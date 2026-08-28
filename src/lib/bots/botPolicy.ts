import { GameState, LegalActions, PlayerAction, PlayerActionType, Street } from '../game/types';
import { estimateEquity } from './equity';
import { BotProfileConfig } from './types';

export interface DecideBotActionParams {
  state: Readonly<GameState>;
  playerId: string;
  legalActions: LegalActions;
  /** Current pot size (engine.getDisplayPot()), used for bet/raise sizing. */
  potSize: number;
  profile: BotProfileConfig;
}

/**
 * Chooses a bot's action from its hole cards + the current board, using a
 * Monte Carlo equity estimate against the number of live opponents and the
 * behavioral thresholds defined by its BotProfileConfig. Preflop reuses the
 * same thresholds via `preflopEntryThreshold` since raw equity against
 * random hands is naturally lower preflop than with a made postflop hand.
 */
export function decideBotAction({ state, playerId, legalActions, potSize, profile }: DecideBotActionParams): PlayerAction {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error(`Unknown bot player: ${playerId}`);

  const numOpponents = state.players.filter((p) => !p.isFolded && p.id !== playerId).length;
  const equity = estimateEquity(player.holeCards, state.board, numOpponents);

  const isPreflop = state.street === Street.PREFLOP;
  const callBarrier = isPreflop ? profile.preflopEntryThreshold : profile.callThreshold;
  const betBarrier = isPreflop ? profile.preflopEntryThreshold : profile.bettingThreshold;
  const facingBet = legalActions.callAmount > 0;

  if (!facingBet) {
    const wantsToBluff = Math.random() < profile.bluffFrequency;
    const canOpen = legalActions.actions.includes(PlayerActionType.BET);
    if (canOpen && (equity >= betBarrier || wantsToBluff)) {
      return { type: PlayerActionType.BET, amount: computeRaiseTo(state, legalActions, potSize, profile) };
    }
    return { type: PlayerActionType.CHECK };
  }

  if (equity < callBarrier) {
    return { type: PlayerActionType.FOLD };
  }

  const canRaise = legalActions.actions.includes(PlayerActionType.RAISE);
  const wantsToBluffRaise = Math.random() < profile.bluffFrequency;
  const isValueRaise = equity >= profile.raiseOverCallThreshold;
  if (canRaise && (isValueRaise || wantsToBluffRaise) && Math.random() < profile.aggressionFactor) {
    return { type: PlayerActionType.RAISE, amount: computeRaiseTo(state, legalActions, potSize, profile) };
  }

  return { type: PlayerActionType.CALL };
}

function computeRaiseTo(state: Readonly<GameState>, legalActions: LegalActions, potSize: number, profile: BotProfileConfig): number {
  const desiredIncrement = Math.max(potSize * profile.betSizingPotFraction, legalActions.minRaiseTo - state.currentBet);
  const target = state.currentBet + desiredIncrement;
  return Math.round(clamp(target, legalActions.minRaiseTo, legalActions.maxRaiseTo));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
