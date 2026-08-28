import { Hand } from 'pokersolver';
import { Card } from './types';

export interface Contestant {
  playerId: string;
  holeCards: Card[];
}

export interface EvaluatedContestant {
  playerId: string;
  hand: Hand;
}

/** Evaluates a single player's best 5-card hand from their hole cards + the board. */
export function evaluateHand(holeCards: Card[], board: Card[]): Hand {
  return Hand.solve([...holeCards, ...board]);
}

/**
 * Evaluates every contestant and returns only the winner(s) (pokersolver
 * already handles ties by returning multiple Hand objects of equal rank).
 */
export function determineWinners(contestants: Contestant[], board: Card[]): EvaluatedContestant[] {
  const evaluated: EvaluatedContestant[] = contestants.map((c) => ({
    playerId: c.playerId,
    hand: evaluateHand(c.holeCards, board),
  }));

  const winningHands = Hand.winners(evaluated.map((e) => e.hand));
  return evaluated.filter((e) => winningHands.includes(e.hand));
}
