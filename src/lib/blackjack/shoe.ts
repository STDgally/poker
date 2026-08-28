import { shuffle } from '../game/deck';
import { Card, Rank, Suit } from './types';

const SUITS: Suit[] = ['s', 'h', 'd', 'c'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];

/** Builds and shuffles a fresh multi-deck shoe. */
export function createShoe(numDecks: number): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < numDecks; d++) {
    for (const rank of RANKS) {
      for (const suit of SUITS) {
        shoe.push(`${rank}${suit}` as Card);
      }
    }
  }
  return shuffle(shoe);
}

/** True once the shoe has been dealt past the configured penetration, signalling
 * the next round should reshuffle before dealing rather than mid-round. */
export function needsReshuffle(shoe: Card[], numDecks: number, penetration: number): boolean {
  const totalCards = numDecks * 52;
  const dealt = totalCards - shoe.length;
  return dealt / totalCards >= penetration;
}
