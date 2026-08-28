import { shuffle } from '../game/deck';
import { computeHandValue } from './handValue';
import { BlackjackRules, Card } from './types';

export interface BustRisk {
  bustCount: number;
  total: number;
  percent: number;
}

/** Fraction of the (truly) unseen cards that would bust this hand if drawn next. */
export function computeBustProbability(cards: Card[], shoe: Card[]): BustRisk {
  if (shoe.length === 0) return { bustCount: 0, total: 0, percent: 0 };
  let bustCount = 0;
  for (const card of shoe) {
    if (computeHandValue([...cards, card]).isBust) bustCount++;
  }
  return { bustCount, total: shoe.length, percent: (bustCount / shoe.length) * 100 };
}

export interface StandOutcome {
  winPct: number;
  pushPct: number;
  losePct: number;
}

/**
 * Monte Carlo estimate of the outcome if the hero stands right now. The
 * dealer's hole card is genuinely unknown to the hero, so — rather than
 * peeking at engine state — both it and any further dealer draws are
 * resampled from the pool of cards the hero can't see (remaining shoe +
 * the hole card itself), which is the statistically honest way to model
 * "unknown from the player's point of view" without cheating.
 */
export function estimateStandOutcome(
  playerCards: Card[],
  dealerUpCard: Card,
  shoe: Card[],
  hiddenHoleCard: Card | undefined,
  rules: BlackjackRules,
  iterations = 400,
): StandOutcome {
  const playerValue = computeHandValue(playerCards);
  const unknownPool = hiddenHoleCard ? [...shoe, hiddenHoleCard] : shoe;
  if (unknownPool.length === 0) return { winPct: 0, pushPct: 0, losePct: 0 };

  let wins = 0;
  let pushes = 0;
  let losses = 0;

  for (let i = 0; i < iterations; i++) {
    const pool = shuffle(unknownPool);
    let idx = 0;
    const dealerHand = [dealerUpCard, pool[idx++]];
    let value = computeHandValue(dealerHand);
    while (idx < pool.length && !value.isBust && (value.total < 17 || (value.total === 17 && value.isSoft && rules.dealerHitsSoft17))) {
      dealerHand.push(pool[idx++]);
      value = computeHandValue(dealerHand);
    }

    if (value.isBust || playerValue.total > value.total) wins++;
    else if (playerValue.total < value.total) losses++;
    else pushes++;
  }

  return { winPct: (wins / iterations) * 100, pushPct: (pushes / iterations) * 100, losePct: (losses / iterations) * 100 };
}

export type DealerUpCardStrength = 'weak' | 'medium' | 'strong';

/** Rule-of-thumb read on the dealer's up card, for the hint panel's explanation text. */
export function classifyDealerUpCard(card: Card): DealerUpCardStrength {
  const rank = card[0];
  if ('23456'.includes(rank)) return 'weak';
  if (rank === '7' || rank === '8' || rank === '9') return 'medium';
  return 'strong'; // 10, J, Q, K, A
}
