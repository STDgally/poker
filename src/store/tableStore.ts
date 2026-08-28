'use client';

import { create } from 'zustand';
import { GameEngine } from '@/lib/game/GameEngine';
import { GameState, LegalActions, PlayerAction, PlayerActionType, SeedPlayer, Street } from '@/lib/game/types';
import { getPositionLabel } from '@/lib/game/position';
import { decideBotAction } from '@/lib/bots/botPolicy';
import { BotProfileConfig } from '@/lib/bots/types';
import { TAG_PROFILE, CALLING_STATION_PROFILE } from '@/lib/bots/profiles';
import { CreateSessionPayload, CreateSessionResponse, HandActionPayload, RecordHandPayload } from '@/lib/hands/types';
import { playCheckSound, playChipSound, playFoldSound, playRaiseSound, playWinSound, playYourTurnSound } from '@/lib/sound/sounds';
import { useSettingsStore } from '@/store/settingsStore';

export const HERO_ID = 'hero';
const STARTING_STACK = 1000;
const SMALL_BLIND = 5;
const BIG_BLIND = 10;
/** Bots "think" for a randomized delay before acting instead of responding
 * instantly — folds are quick, bets/raises take noticeably longer, mimicking
 * how a real opponent would pause more before a bigger decision. Scaled
 * around the user's configured bot-speed setting (Impostazioni). */
function getBotThinkDelayMs(action: PlayerAction): number {
  const settingBase = useSettingsStore.getState().botDelayMs;
  const base = settingBase * (0.7 + Math.random() * 0.9);
  if (action.type === PlayerActionType.FOLD) return base * 0.6;
  if (action.type === PlayerActionType.BET || action.type === PlayerActionType.RAISE || action.type === PlayerActionType.ALL_IN) {
    return base + settingBase * 0.4 + Math.random() * settingBase * 0.6;
  }
  return base;
}

const SEED_PLAYERS: SeedPlayer[] = [
  { id: HERO_ID, name: 'Tu', seat: 0, stack: STARTING_STACK, isBot: false },
  { id: 'bot1', name: 'Bot TAG 1', seat: 1, stack: STARTING_STACK, isBot: true },
  { id: 'bot2', name: 'Bot Station 1', seat: 2, stack: STARTING_STACK, isBot: true },
  { id: 'bot3', name: 'Bot TAG 2', seat: 3, stack: STARTING_STACK, isBot: true },
  { id: 'bot4', name: 'Bot Station 2', seat: 4, stack: STARTING_STACK, isBot: true },
  { id: 'bot5', name: 'Bot TAG 3', seat: 5, stack: STARTING_STACK, isBot: true },
];

const BOT_PROFILE_BY_ID: Record<string, BotProfileConfig> = {
  bot1: TAG_PROFILE,
  bot2: CALLING_STATION_PROFILE,
  bot3: TAG_PROFILE,
  bot4: CALLING_STATION_PROFILE,
  bot5: TAG_PROFILE,
};

/** GameEngine mutates its internal state in place; snapshot it into fresh
 * objects/arrays so Zustand (and React) reliably detect the change. */
function snapshot(engine: GameEngine): GameState {
  const s = engine.getState();
  return {
    ...s,
    deck: [], // never exposed to the UI
    board: [...s.board],
    players: s.players.map((p) => ({ ...p, holeCards: [...p.holeCards] })),
    pots: s.pots.map((p) => ({ ...p, eligiblePlayerIds: [...p.eligiblePlayerIds] })),
    winners: [...s.winners],
  };
}

function describeAction(name: string, action: PlayerAction): string {
  switch (action.type) {
    case PlayerActionType.FOLD:
      return `${name} passa`;
    case PlayerActionType.CHECK:
      return `${name} checka`;
    case PlayerActionType.CALL:
      return `${name} paga`;
    case PlayerActionType.BET:
      return `${name} punta ${action.amount}`;
    case PlayerActionType.RAISE:
      return `${name} rilancia a ${action.amount}`;
    case PlayerActionType.ALL_IN:
      return `${name} va all-in`;
    default:
      return `${name} agisce`;
  }
}

/** What to log for a BET/RAISE is the raise-to amount (readable in a hand history);
 * for a CALL it's the chips needed to call; for ALL_IN it's whatever stack remained. */
function computeLoggedAmount(preLegal: LegalActions | null, preStack: number, action: PlayerAction): number {
  switch (action.type) {
    case PlayerActionType.CALL:
      return preLegal?.callAmount ?? 0;
    case PlayerActionType.BET:
    case PlayerActionType.RAISE:
      return action.amount ?? 0;
    case PlayerActionType.ALL_IN:
      return preStack;
    default:
      return 0;
  }
}

interface TableStore {
  engine: GameEngine;
  gameState: GameState;
  heroId: string;
  botProfiles: Record<string, BotProfileConfig>;
  log: string[];
  isBotActing: boolean;
  startNewHand: () => void;
  humanFold: () => void;
  humanCheckOrCall: () => void;
  humanBetOrRaise: (amount: number) => void;
}

export const useTableStore = create<TableStore>((set, get) => {
  const engine = new GameEngine(SEED_PLAYERS, SMALL_BLIND, BIG_BLIND, 0);

  // Per-hand bookkeeping for hand-history persistence. Plain closured state
  // (not part of the reactive store) since the UI never needs to render it directly.
  let sessionId: string | null = null;
  let sessionCreationPromise: Promise<string | null> | null = null;
  let currentHandActions: HandActionPayload[] = [];
  let actionSequence = 0;
  let heroStartStack = STARTING_STACK;
  let heroVpip = false;
  let heroPfr = false;
  let handPersisted = false;

  function pushLog(message: string) {
    set((state) => ({ log: [message, ...state.log].slice(0, 40) }));
  }

  function syncState() {
    set({ gameState: snapshot(engine) });
  }

  function logAction(street: Street, seat: number, actorType: 'HUMAN' | 'BOT', actorName: string, action: PlayerAction, amount: number, potAfter: number) {
    currentHandActions.push({
      street,
      seat,
      actorType,
      actorName,
      action: action.type,
      amount,
      potAfter,
      sequence: actionSequence++,
    });
  }

  /** Posts blinds happen inside engine.startHand() itself; log them as synthetic
   * entries right after so the persisted hand history includes them. */
  function logBlinds() {
    const state = engine.getState();
    const sb = state.players.find((p) => p.seat === state.sbSeat)!;
    const bb = state.players.find((p) => p.seat === state.bbSeat)!;
    currentHandActions.push({
      street: Street.PREFLOP,
      seat: sb.seat,
      actorType: sb.isBot ? 'BOT' : 'HUMAN',
      actorName: sb.name,
      action: 'POST_SB',
      amount: sb.currentStreetBet,
      potAfter: sb.currentStreetBet,
      sequence: actionSequence++,
    });
    currentHandActions.push({
      street: Street.PREFLOP,
      seat: bb.seat,
      actorType: bb.isBot ? 'BOT' : 'HUMAN',
      actorName: bb.name,
      action: 'POST_BB',
      amount: bb.currentStreetBet,
      potAfter: sb.currentStreetBet + bb.currentStreetBet,
      sequence: actionSequence++,
    });
  }

  function applyAndLog(playerId: string, action: PlayerAction) {
    const before = engine.getState();
    const player = before.players.find((p) => p.id === playerId)!;
    const preLegal = engine.getLegalActions(playerId);
    const street = before.street;
    const loggedAmount = computeLoggedAmount(preLegal, player.stack, action);

    if (playerId === HERO_ID && street === Street.PREFLOP) {
      if (action.type === PlayerActionType.CALL || action.type === PlayerActionType.BET || action.type === PlayerActionType.RAISE || action.type === PlayerActionType.ALL_IN) {
        heroVpip = true;
      }
      if (action.type === PlayerActionType.BET || action.type === PlayerActionType.RAISE || action.type === PlayerActionType.ALL_IN) {
        heroPfr = true;
      }
    }

    engine.applyAction(playerId, action);

    const potAfter = engine.getDisplayPot();
    logAction(street, player.seat, player.isBot ? 'BOT' : 'HUMAN', player.name, action, loggedAmount, potAfter);
    pushLog(describeAction(player.isBot ? player.name : 'Tu', action));
    playActionSound(action);
  }

  function playActionSound(action: PlayerAction) {
    switch (action.type) {
      case PlayerActionType.FOLD:
        playFoldSound();
        break;
      case PlayerActionType.CHECK:
        playCheckSound();
        break;
      case PlayerActionType.CALL:
        playChipSound();
        break;
      case PlayerActionType.BET:
      case PlayerActionType.RAISE:
      case PlayerActionType.ALL_IN:
        playRaiseSound();
        break;
    }
  }

  async function ensureSession(): Promise<string | null> {
    if (sessionId) return sessionId;
    if (!sessionCreationPromise) {
      const payload: CreateSessionPayload = {
        type: 'CASH',
        smallBlind: SMALL_BLIND,
        bigBlind: BIG_BLIND,
        buyIn: STARTING_STACK,
        startStack: STARTING_STACK,
      };
      sessionCreationPromise = fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => (res.ok ? (res.json() as Promise<CreateSessionResponse>) : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((data) => {
          sessionId = data.sessionId;
          return sessionId;
        })
        .catch((err) => {
          console.error('Impossibile creare la sessione per il tracking:', err);
          sessionCreationPromise = null;
          return null;
        });
    }
    return sessionCreationPromise;
  }

  async function persistHand() {
    const state = engine.getState();
    const hero = state.players.find((p) => p.id === HERO_ID)!;
    const sid = await ensureSession();
    if (!sid) return; // tracking is best-effort; gameplay must not depend on it

    const potSize = state.pots.reduce((sum, p) => sum + p.amount, 0);
    const payload: RecordHandPayload = {
      sessionId: sid,
      handNumber: state.handNumber,
      dealerSeat: state.dealerSeat,
      heroSeat: hero.seat,
      heroPosition: getPositionLabel(hero.seat, state.dealerSeat, state.players.length),
      heroCards: hero.holeCards,
      board: state.board,
      potSize,
      heroNetResult: hero.stack - heroStartStack,
      vpip: heroVpip,
      pfr: heroPfr,
      wentToShowdown: state.street === Street.SHOWDOWN && !hero.isFolded,
      wonHand: state.winners.some((w) => w.playerId === HERO_ID),
      actions: currentHandActions,
    };

    try {
      const res = await fetch('/api/hands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('Impossibile salvare la hand history:', err);
    }
  }

  /** After any action, keep applying bot decisions (with a small UX delay)
   * until it's the human's turn again or the hand is over. */
  function advanceBots() {
    const state = engine.getState();

    if (state.isHandComplete) {
      syncState();
      if (!handPersisted) {
        handPersisted = true;
        if (state.winners.some((w) => w.playerId === HERO_ID)) playWinSound();
        void persistHand();
      }
      return;
    }

    if (state.actionOnSeat === null) {
      syncState();
      return;
    }

    const actor = state.players.find((p) => p.seat === state.actionOnSeat);
    if (!actor || !actor.isBot) {
      syncState();
      if (actor?.id === HERO_ID) playYourTurnSound();
      return;
    }

    syncState();
    set({ isBotActing: true });

    // Decide the action now (so the "thinking" delay can depend on how
    // aggressive it is) but only reveal/apply it after the delay elapses.
    const profile = get().botProfiles[actor.id];
    const legalActions = engine.getLegalActions(actor.id);
    if (!legalActions) throw new Error(`${actor.id} has no legal action available right now`);
    const action = decideBotAction({ state: engine.getState(), playerId: actor.id, legalActions, potSize: engine.getDisplayPot(), profile });

    setTimeout(() => {
      applyAndLog(actor.id, action);
      set({ isBotActing: false });
      advanceBots();
    }, getBotThinkDelayMs(action));
  }

  return {
    engine,
    gameState: snapshot(engine),
    heroId: HERO_ID,
    botProfiles: BOT_PROFILE_BY_ID,
    log: [],
    isBotActing: false,

    startNewHand: () => {
      void ensureSession();
      heroStartStack = engine.getState().players.find((p) => p.id === HERO_ID)!.stack;
      engine.startHand();
      currentHandActions = [];
      actionSequence = 0;
      heroVpip = false;
      heroPfr = false;
      handPersisted = false;
      logBlinds();
      pushLog(`--- Mano #${engine.getState().handNumber} ---`);
      syncState();
      advanceBots();
    },

    humanFold: () => {
      applyAndLog(HERO_ID, { type: PlayerActionType.FOLD });
      advanceBots();
    },

    humanCheckOrCall: () => {
      const legal = engine.getLegalActions(HERO_ID);
      const type = legal && legal.callAmount > 0 ? PlayerActionType.CALL : PlayerActionType.CHECK;
      applyAndLog(HERO_ID, { type });
      advanceBots();
    },

    humanBetOrRaise: (amount: number) => {
      const state = engine.getState();
      const type = state.currentBet === 0 ? PlayerActionType.BET : PlayerActionType.RAISE;
      applyAndLog(HERO_ID, { type, amount });
      advanceBots();
    },
  };
});
