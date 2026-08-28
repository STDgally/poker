'use client';

import { create } from 'zustand';
import { BlackjackEngine } from '@/lib/blackjack/BlackjackEngine';
import { getBasicStrategyAction, shouldTakeInsurance } from '@/lib/blackjack/basicStrategy';
import { computeHandValue } from '@/lib/blackjack/handValue';
import { BetInput, BlackjackGameState, BlackjackPhase, BlackjackRules, BoxAction, SeatConfig } from '@/lib/blackjack/types';
import { playCheckSound, playChipSound, playFoldSound, playRaiseSound, playWinSound, playYourTurnSound } from '@/lib/sound/sounds';
import {
  BlackjackActionLogPayload,
  BlackjackBoxResultPayload,
  CreateBlackjackSessionPayload,
  CreateBlackjackSessionResponse,
  RecordBlackjackRoundPayload,
} from '@/lib/blackjack/persistenceTypes';
import { useSettingsStore } from '@/store/settingsStore';

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

/** Scaled around the user's configured bot-speed setting (Impostazioni), shared with poker. */
function randomThinkDelay(): number {
  const settingBase = useSettingsStore.getState().botDelayMs;
  return settingBase * (0.5 + Math.random());
}

interface BlackjackStore {
  engine: BlackjackEngine | null;
  gameState: BlackjackGameState | null;
  isBotThinking: boolean;
  log: string[];
  pendingBets: Record<string, number>;

  initTable: (seatConfigs: SeatConfig[], heroStartingBankroll: number, rulesOverride?: Partial<BlackjackRules>) => void;
  resetTable: () => void;
  setPendingBet: (seat: number, boxIndex: number, amount: number) => void;
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

  function isHeroBox(boxSeat: number): boolean {
    const state = get().engine?.getState();
    return state?.seats.find((s) => s.seat === boxSeat)?.occupant === 'HERO';
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
        startStack: engine.getState().seats.find((s) => s.occupant === 'HERO')?.bankroll ?? 0,
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

  /** Drives every bot decision (insurance + play) automatically, with a
   * short "thinking" delay, until it's the human's turn or the round ends. */
  function advanceBots() {
    const engine = get().engine;
    if (!engine) return;
    const state = engine.getState();

    if (state.phase === BlackjackPhase.ROUND_COMPLETE) {
      syncState();
      const heroWon = state.seats.some((s) => s.occupant === 'HERO' && s.boxes.some((b) => b.payout > 0));
      if (heroWon) playWinSound();
      if (!roundPersisted) {
        roundPersisted = true;
        void persistRound();
      }
      return;
    }

    if (state.phase === BlackjackPhase.INSURANCE) {
      const boxId = state.activeBoxId;
      if (!boxId) { syncState(); return; }
      const box = state.seats.flatMap((s) => s.boxes).find((b) => b.id === boxId)!;
      if (isHeroBox(box.seat)) {
        syncState();
        playYourTurnSound();
        return;
      }
      syncState();
      set({ isBotThinking: true });
      setTimeout(() => {
        engine.applyInsuranceDecision(boxId, shouldTakeInsurance());
        set({ isBotThinking: false });
        advanceBots();
      }, randomThinkDelay());
      return;
    }

    if (state.phase === BlackjackPhase.PLAYER_TURNS) {
      const boxId = state.activeBoxId;
      if (!boxId) { syncState(); return; }
      const box = state.seats.flatMap((s) => s.boxes).find((b) => b.id === boxId)!;
      const seat = state.seats.find((s) => s.seat === box.seat)!;

      if (seat.occupant === 'HERO') {
        syncState();
        playYourTurnSound();
        return;
      }

      syncState();
      set({ isBotThinking: true });
      const legal = engine.getLegalActions(boxId)!;
      const rec = getBasicStrategyAction(box.cards, state.dealer.cards[0], legal.actions);
      setTimeout(() => {
        engine.applyAction(boxId, rec.action);
        pushLog(describeAction(seat.name, rec.action));
        playActionSound(rec.action);
        set({ isBotThinking: false });
        advanceBots();
      }, randomThinkDelay());
      return;
    }

    syncState();
  }

  return {
    engine: null,
    gameState: null,
    isBotThinking: false,
    log: [],
    pendingBets: {},

    initTable: (seatConfigs, heroStartingBankroll, rulesOverride) => {
      const engine = new BlackjackEngine(seatConfigs, heroStartingBankroll, rulesOverride);
      const state = engine.getState();
      const pendingBets: Record<string, number> = {};
      for (const seat of state.seats) {
        if (seat.occupant !== 'HERO') continue;
        for (let i = 0; i < seat.boxCount; i++) {
          pendingBets[`${seat.seat}-${i}`] = state.rules.minBet;
        }
      }
      sessionId = null;
      sessionCreationPromise = null;
      set({ engine, gameState: snapshot(engine), pendingBets, log: [], isBotThinking: false });
    },

    resetTable: () => {
      sessionId = null;
      sessionCreationPromise = null;
      set({ engine: null, gameState: null, pendingBets: {}, log: [], isBotThinking: false });
    },

    setPendingBet: (seat, boxIndex, amount) => {
      set((state) => ({ pendingBets: { ...state.pendingBets, [`${seat}-${boxIndex}`]: amount } }));
    },

    dealRound: () => {
      const engine = get().engine;
      if (!engine) return;
      void ensureSession();
      const state = engine.getState();
      const pendingBets = get().pendingBets;

      const heroBets: BetInput[] = [];
      for (const seat of state.seats) {
        if (seat.occupant !== 'HERO') continue;
        for (let i = 0; i < seat.boxCount; i++) {
          heroBets.push({ seat: seat.seat, boxIndex: i, amount: pendingBets[`${seat.seat}-${i}`] ?? state.rules.minBet });
        }
      }

      engine.startRound(heroBets);
      currentRoundActions = [];
      actionSequence = 0;
      roundPersisted = false;
      pushLog(`--- Mano #${engine.getState().roundNumber} ---`);
      syncState();
      advanceBots();
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
      advanceBots();
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
      advanceBots();
    },

    nextRound: () => {
      const engine = get().engine;
      if (!engine) return;
      engine.prepareNextRound();
      syncState();
    },
  };
});
