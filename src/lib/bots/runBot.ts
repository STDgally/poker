import { GameEngine } from '../game/GameEngine';
import { PlayerAction } from '../game/types';
import { decideBotAction } from './botPolicy';
import { BotProfileConfig } from './types';

/**
 * Convenience wrapper for the UI/game loop: pulls the current state and
 * legal actions for a bot seat straight from the engine, decides an action
 * via the bot's profile, applies it, and returns what was played (so the UI
 * can show e.g. "Bot TAG raises to 60").
 */
export function playBotAction(engine: GameEngine, playerId: string, profile: BotProfileConfig): PlayerAction {
  const state = engine.getState();
  const legalActions = engine.getLegalActions(playerId);
  if (!legalActions) {
    throw new Error(`${playerId} has no legal action available right now`);
  }

  const action = decideBotAction({
    state,
    playerId,
    legalActions,
    potSize: engine.getDisplayPot(),
    profile,
  });

  engine.applyAction(playerId, action);
  return action;
}
