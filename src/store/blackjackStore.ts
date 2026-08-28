'use client';

import { create } from 'zustand';
import { BlackjackEngine } from '@/lib/blackjack/BlackjackEngine';
import { getBasicStrategyAction, shouldTakeInsurance } from '@/lib/blackjack/basicStrategy';
import { computeHandValue } from '@/lib/blackjack/handValue';
import { BlackjackGameState, BlackjackPhase, BlackjackRules, BoxAction } from '@/lib/blackjack/types';
import { playCheckSound, playChipSound, playFoldSound, playRaiseSound, playWinSound, playYourTurnSound } from '@/lib/sound/sounds';
import {
  BlackjackActionLogPayload,
  BlackjackBoxResultPayload,
  CreateBlackjackSessionPayload,
  CreateBlackjackSessionResponse,
  RecordBlackjackRoundPayload,
} from '@/lib/blackjack/persistenceTypes';

function snapshot(engine: BlackjackEngine): BlackjackGameState {
  const s = engine.getState();
  return {
    ...s,
    shoe: [],
    dealer: { ...s.dealer, cards: [...s.dealer.cards] },
    seats: s.seats.map((seat) => ({
      ...seat,
      boxes: seat.boxes.map((box) => ({ ...box, cards: [...box.cards] })),
    })),
  };
}

function describeAction(name: string, action: BoxAction): string {
  switch (action) {
    case 'HIT':
      return `${name} chiede carta`;
    case 'STAND':
      return `${name} sta`;
    case 'DOUBLE':
      return `${name} raddoppia`;
    case 'SPLIT':
      return `${name} divide la coppia`;
    case 'SURRENDER':
      return `${name} si arrende`;
    default:
      return `${name} agisce`;
  }
}

function playActionSound(action: BoxAction) {
  switch (action) {
    case 'STAND':
      playCheckSound();
      break;
    case 'HIT':
      playChipSound();
      break;
    case 'DOUBLE':
    case 'SPLIT':
      playRaiseSound();
      break;
    case 'SURRENDER':
      playFoldSound();
      break;
  }
}

/** How long the betting window stays open before the dealer deals automatically, if there's at least one bet down. */
const BETTING_WINDOW_SECONDS = 20;

interface BlackjackStore {
  engine: BlackjackEngine | null;
  gameState: BlackjackGameState | null;
  log: string[];
  /** Single bet amount, applied identically to every seat the hero occupies. */
  pendingBet: number;
  /** Countdown shown during the betting phase; null when not counting down. */
  bettingSecondsLeft: number | null;

  initTable: (heroStartingBankroll: number, rulesOverride?: Partial<BlackjackRules>) => void;
  resetTable: () => void;
  claimSeat: (seat: number) => void;
  leaveSeat: (seat: number) => void;
  addChip: (value: number) => void;
  clearBet: () => void;
  dealRound: () => void;
  humanInsuranceDecision: (boxId: string, take: boolean) => void;
  humanAction: (boxId: string, action: BoxAction) => void;
  nextRound: () => void;
}

export const useBlackjackStore = create<BlackjackStore>((set, get) => {
  // Per-round bookkeeping for hand-history persistence. Plain closured state
  // (not part of the reactive store) since the UI never needs to render it directly.
  let sessionId: string | null = null;
  let sessionCreationPromise: Promise<string | null> | null = null;
  let currentRoundActions: BlackjackActionLogPayload[] = [];
  let actionSequence = 0;
  let roundPersisted = false;

  function pushLog(message: string) {
    set((state) => ({ log: [message, ...state.log].slice(0, 40) }));
  }

  function syncState() {
    const engine = get().engine;
    if (engine) set({ gameState: snapshot(engine) });
  }

  async function ensureSession(): Promise<string | null> {
    const engine = get().engine;
    if (!engine) return null;
    if (sessionId) return sessionId;
    if (!sessionCreationPromise) {
      const rules = engine.getState().rules;
      const payload: CreateBlackjackSessionPayload = {
        numDecks: rules.numDecks,
        dealerHitsSoft17: rules.dealerHitsSoft17,
        blackjackPayout: rules.blackjackPayout,
        minBet: rules.minBet,
        maxBet: rules.maxBet,
        startStack: engine.getState().heroBankroll,
      };
      sessionCreationPromise = fetch('/api/blackjack/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => (res.ok ? (res.json() as Promise<CreateBlackjackSessionResponse>) : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((data) => {
          sessionId = data.sessionId;
          return sessionId;
        })
        .catch((err) => {
          console.error('Impossibile creare la sessione blackjack per il tracking:', err);
          sessionCreationPromise = null;
          return null;
        });
    }
    return sessionCreationPromise;
  }

  async function persistRound() {
    const engine = get().engine;
    if (!engine) return;
    const sid = await ensureSession();
    if (!sid) return; // tracking is best-effort; gameplay must never depend on it

    const state = engine.getState();
    const boxes: BlackjackBoxResultPayload[] = [];
    for (const seat of state.seats) {
      for (const box of seat.boxes) {
        boxes.push({
          isHero: seat.occupant === 'HERO',
          actorName: seat.name,
          seat: seat.seat,
          boxIndex: box.boxIndex,
          cards: box.cards,
          finalTotal: computeHandValue(box.cards).total,
          bet: box.bet,
          insuranceBet: box.insuranceBet,
          isDoubled: box.isDoubled,
          isFromSplit: box.isFromSplit,
          isBlackjack: box.isBlackjack,
          isBust: box.isBust,
          isSurrendered: box.isSurrendered,
          result: box.result ?? 'PUSH',
          payout: box.payout,
        });
      }
    }

    const payload: RecordBlackjackRoundPayload = {
      sessionId: sid,
      roundNumber: state.roundNumber,
      dealerCards: state.dealer.cards,
      dealerTotal: computeHandValue(state.dealer.cards).total,
      boxes,
      actions: currentRoundActions,
    };

    try {
      const res = await fetch('/api/blackjack/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('Impossibile salvare la mano di blackjack:', err);
    }
  }

  // The 20-second betting-window countdown. A plain module-closured interval
  // handle (like the session bookkeeping above) since it drives store state
  // rather than being derived from it.
  let bettingIntervalId: ReturnType<typeof setInterval> | null = null;

  function stopBettingTimer() {
    if (bettingIntervalId !== null) {
      clearInterval(bettingIntervalId);
      bettingIntervalId = null;
    }
    set({ bettingSecondsLeft: null });
  }

  function startBettingTimer() {
    stopBettingTimer();
    set({ bettingSecondsLeft: BETTING_WINDOW_SECONDS });
    bettingIntervalId = setInterval(() => {
      const secondsLeft = get().bettingSecondsLeft;
      if (secondsLeft === null) return;
      const next = secondsLeft - 1;
      if (next > 0) {
        set({ bettingSecondsLeft: next });
        return;
      }
      const engine = get().engine;
      const state = engine?.getState();
      const hasValidBet = !!state && state.seats.some((s) => s.occupant === 'HERO') && get().pendingBet >= state.rules.minBet;
      if (engine && hasValidBet) {
        stopBettingTimer();
        get().dealRound();
      } else {
        // Nobody's seated, or no chips placed yet — keep offering fresh 20-second windows rather than forcing an empty deal.
        set({ bettingSecondsLeft: BETTING_WINDOW_SECONDS });
      }
    }, 1000);
  }

  /** Syncs the reactive snapshot after any engine mutation, and reacts to phase changes: a
   * "your turn" cue when a new box becomes active, or round-end bookkeeping (sound + persistence). */
  function syncAfterEngineChange() {
    const engine = get().engine;
    if (!engine) return;
    syncState();
    const state = engine.getState();

    if (state.phase === BlackjackPhase.ROUND_COMPLETE) {
      const heroWon = state.seats.some((s) => s.occupant === 'HERO' && s.boxes.some((b) => b.payout > 0));
      if (heroWon) playWinSound();
      if (!roundPersisted) {
        roundPersisted = true;
        void persistRound();
      }
      return;
    }

    if (state.activeBoxId && (state.phase === BlackjackPhase.INSURANCE || state.phase === BlackjackPhase.PLAYER_TURNS)) {
      playYourTurnSound();
    }
  }

  return {
    engine: null,
    gameState: null,
    log: [],
    pendingBet: 0,
    bettingSecondsLeft: null,

    initTable: (heroStartingBankroll, rulesOverride) => {
      const engine = new BlackjackEngine(heroStartingBankroll, rulesOverride);
      sessionId = null;
      sessionCreationPromise = null;
      set({ engine, gameState: snapshot(engine), pendingBet: 0, log: [] });
      startBettingTimer();
    },

    resetTable: () => {
      stopBettingTimer();
      sessionId = null;
      sessionCreationPromise = null;
      set({ engine: null, gameState: null, pendingBet: 0, log: [] });
    },

    claimSeat: (seat) => {
      const engine = get().engine;
      if (!engine) return;
      const heroCount = engine.getState().seats.filter((s) => s.occupant === 'HERO').length;
      try {
        engine.claimSeat(seat, heroCount === 0 ? 'Tu' : `Tu (${heroCount + 1})`);
        syncState();
      } catch (err) {
        pushLog(err instanceof Error ? err.message : 'Impossibile sedersi a questa postazione');
      }
    },

    leaveSeat: (seat) => {
      const engine = get().engine;
      if (!engine) return;
      try {
        engine.leaveSeat(seat);
        syncState();
      } catch (err) {
        pushLog(err instanceof Error ? err.message : 'Impossibile alzarsi da questa postazione');
      }
    },

    addChip: (value) => {
      set((state) => {
        const maxBet = state.engine?.getState().rules.maxBet ?? Infinity;
        return { pendingBet: Math.min(maxBet, state.pendingBet + value) };
      });
    },

    clearBet: () => {
      set({ pendingBet: 0 });
    },

    dealRound: () => {
      const engine = get().engine;
      if (!engine) return;
      void ensureSession();
      stopBettingTimer();

      try {
        engine.startRound(get().pendingBet);
      } catch (err) {
        pushLog(err instanceof Error ? err.message : 'Impossibile distribuire le carte');
        startBettingTimer();
        return;
      }

      currentRoundActions = [];
      actionSequence = 0;
      roundPersisted = false;
      pushLog(`--- Mano #${engine.getState().roundNumber} ---`);
      syncAfterEngineChange();
    },

    humanInsuranceDecision: (boxId, take) => {
      const engine = get().engine;
      if (!engine) return;
      const before = engine.getState();
      const box = before.seats.flatMap((s) => s.boxes).find((b) => b.id === boxId)!;

      currentRoundActions.push({
        seat: box.seat,
        boxIndex: box.boxIndex,
        sequence: actionSequence++,
        action: take ? 'INSURANCE_TAKEN' : 'INSURANCE_DECLINED',
        handTotalBefore: computeHandValue(box.cards).total,
        dealerUpCard: before.dealer.cards[0],
        wasOptimal: take === shouldTakeInsurance(),
      });

      engine.applyInsuranceDecision(boxId, take);
      pushLog(take ? "Tu prendi l'assicurazione" : "Tu rifiuti l'assicurazione");
      syncAfterEngineChange();
    },

    humanAction: (boxId, action) => {
      const engine = get().engine;
      if (!engine) return;
      const before = engine.getState();
      const box = before.seats.flatMap((s) => s.boxes).find((b) => b.id === boxId)!;
      const legal = engine.getLegalActions(boxId);
      const rec = legal ? getBasicStrategyAction(box.cards, before.dealer.cards[0], legal.actions) : null;

      currentRoundActions.push({
        seat: box.seat,
        boxIndex: box.boxIndex,
        sequence: actionSequence++,
        action,
        handTotalBefore: computeHandValue(box.cards).total,
        dealerUpCard: before.dealer.cards[0],
        wasOptimal: rec ? rec.action === action : true,
      });

      engine.applyAction(boxId, action);
      pushLog(describeAction('Tu', action));
      playActionSound(action);
      syncAfterEngineChange();
    },

    nextRound: () => {
      const engine = get().engine;
      if (!engine) return;
      engine.prepareNextRound();
      syncState();
      startBettingTimer();
    },
  };
});
