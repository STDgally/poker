'use client';

import { create } from 'zustand';
import { GameEngine } from '@/lib/game/GameEngine';
import { GameState, PlayerAction, PlayerActionType, SeedPlayer } from '@/lib/game/types';
import { playBotAction } from '@/lib/bots/runBot';
import { BotProfileConfig } from '@/lib/bots/types';
import { TAG_PROFILE, CALLING_STATION_PROFILE } from '@/lib/bots/profiles';

export const HERO_ID = 'hero';
const STARTING_STACK = 1000;
const SMALL_BLIND = 5;
const BIG_BLIND = 10;
const BOT_ACTION_DELAY_MS = 700;

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

  function pushLog(message: string) {
    set((state) => ({ log: [message, ...state.log].slice(0, 40) }));
  }

  function syncState() {
    set({ gameState: snapshot(engine) });
  }

  /** After any action, keep applying bot decisions (with a small UX delay)
   * until it's the human's turn again or the hand is over. */
  function advanceBots() {
    const state = engine.getState();
    if (state.isHandComplete || state.actionOnSeat === null) {
      syncState();
      return;
    }

    const actor = state.players.find((p) => p.seat === state.actionOnSeat);
    if (!actor || !actor.isBot) {
      syncState();
      return;
    }

    syncState();
    set({ isBotActing: true });
    setTimeout(() => {
      const profile = get().botProfiles[actor.id];
      const action = playBotAction(engine, actor.id, profile);
      pushLog(describeAction(actor.name, action));
      set({ isBotActing: false });
      advanceBots();
    }, BOT_ACTION_DELAY_MS);
  }

  return {
    engine,
    gameState: snapshot(engine),
    heroId: HERO_ID,
    botProfiles: BOT_PROFILE_BY_ID,
    log: [],
    isBotActing: false,

    startNewHand: () => {
      engine.startHand();
      pushLog(`--- Mano #${engine.getState().handNumber} ---`);
      syncState();
      advanceBots();
    },

    humanFold: () => {
      engine.applyAction(HERO_ID, { type: PlayerActionType.FOLD });
      pushLog(describeAction('Tu', { type: PlayerActionType.FOLD }));
      advanceBots();
    },

    humanCheckOrCall: () => {
      const legal = engine.getLegalActions(HERO_ID);
      const type = legal && legal.callAmount > 0 ? PlayerActionType.CALL : PlayerActionType.CHECK;
      engine.applyAction(HERO_ID, { type });
      pushLog(describeAction('Tu', { type }));
      advanceBots();
    },

    humanBetOrRaise: (amount: number) => {
      const state = engine.getState();
      const type = state.currentBet === 0 ? PlayerActionType.BET : PlayerActionType.RAISE;
      engine.applyAction(HERO_ID, { type, amount });
      pushLog(describeAction('Tu', { type, amount }));
      advanceBots();
    },
  };
});
