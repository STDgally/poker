import { Card, HandValue } from './types';

export const TEN_VALUE_RANKS = new Set(['T', 'J', 'Q', 'K']);

/** Computes the best total for a blackjack hand, treating Aces as 11 unless that busts. */
export function computeHandValue(cards: Card[]): HandValue {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    const rank = card[0];
    if (rank === 'A') {
      total += 11;
      aces += 1;
    } else if (TEN_VALUE_RANKS.has(rank)) {
      total += 10;
    } else {
      total += Number(rank);
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return {
    total,
    isSoft: aces > 0,
    isBust: total > 21,
    isBlackjack: cards.length === 2 && total === 21,
  };
}

export function isPair(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const rankValue = (r: string) => (TEN_VALUE_RANKS.has(r) ? 10 : r === 'A' ? 11 : Number(r));
  return rankValue(cards[0][0]) === rankValue(cards[1][0]);
}
