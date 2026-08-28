import { Hand } from 'pokersolver';
import { createDeck, shuffle } from '../game/deck';
import { evaluateHand } from '../game/handEvaluator';
import { Card } from '../game/types';

/**
 * Monte Carlo equity estimator: repeatedly deals random cards for the
 * unknown opponents and the remaining board, then measures how often the
 * hero's hand wins (ties are split fractionally). Works on any street —
 * preflop just means more unknown board cards get dealt out per iteration.
 *
 * This only ever looks at the bot's own hole cards + the public board, never
 * at other players' actual hole cards, so it's a fair (non-cheating) estimate
 * of the bot's chance to win at showdown against random ranges.
 */
export function estimateEquity(
  holeCards: Card[],
  board: Card[],
  numOpponents: number,
  iterations = 250,
): number {
  if (numOpponents <= 0) return 1;

  const known = new Set<Card>([...holeCards, ...board]);
  const remainingDeck = createDeck().filter((c) => !known.has(c));
  const cardsNeededPerIteration = numOpponents * 2 + (5 - board.length);

  if (remainingDeck.length < cardsNeededPerIteration) {
    // Not enough unseen cards to simulate (degenerate/test setups) — fall back to a neutral estimate.
    return 0.5;
  }

  let wins = 0;
  let ties = 0;

  for (let i = 0; i < iterations; i++) {
    const shuffled = shuffle(remainingDeck);
    let cursor = 0;

    const opponentHoles: Card[][] = [];
    for (let o = 0; o < numOpponents; o++) {
      opponentHoles.push([shuffled[cursor], shuffled[cursor + 1]]);
      cursor += 2;
    }

    const missingBoardCount = 5 - board.length;
    const fullBoard = [...board, ...shuffled.slice(cursor, cursor + missingBoardCount)];

    const heroHand = evaluateHand(holeCards, fullBoard);
    const opponentHands = opponentHoles.map((hole) => evaluateHand(hole, fullBoard));
    const winningHands = Hand.winners([heroHand, ...opponentHands]);

    if (winningHands.includes(heroHand)) {
      if (winningHands.length === 1) wins += 1;
      else ties += 1 / winningHands.length;
    }
  }

  return (wins + ties) / iterations;
}
