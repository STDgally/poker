import { Hand } from 'pokersolver';
import { createDeck } from './deck';
import { evaluateHand } from './handEvaluator';
import { Card } from './types';

export interface OutsResult {
  outs: number;
  outCards: Card[];
  /** Rule-of-4-and-2 rough equity estimate for hitting one of the outs by the river. */
  approxPercent: number;
}

function isStrictlyBetter(candidate: Hand, baseline: Hand): boolean {
  const winners = Hand.winners([baseline, candidate]);
  return winners.length === 1 && winners[0] === candidate;
}

/**
 * Counts community cards that would improve the hero's made hand (a
 * simplified "outs" definition: it does not know opponents' cards, so an
 * out here means "hand gets stronger", not "hand is guaranteed to win").
 * Only meaningful on the flop or turn — returns 0 pre-flop and on the river.
 */
export function countOuts(holeCards: Card[], board: Card[]): OutsResult {
  if (board.length < 3 || board.length >= 5) {
    return { outs: 0, outCards: [], approxPercent: 0 };
  }

  const known = new Set<Card>([...holeCards, ...board]);
  const unseen = createDeck().filter((c) => !known.has(c));
  const currentHand = evaluateHand(holeCards, board);

  const outCards = unseen.filter((card) => isStrictlyBetter(evaluateHand(holeCards, [...board, card]), currentHand));

  const cardsToCome = board.length === 3 ? 2 : 1;
  const approxPercent = Math.min(outCards.length * (cardsToCome === 2 ? 4 : 2), 100);

  return { outs: outCards.length, outCards, approxPercent };
}
