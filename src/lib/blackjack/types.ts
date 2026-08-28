// Core domain types for the Blackjack engine, the basic-strategy advisor
// (Step B2), and the table UI (Step B3).

export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K';
export type Suit = 's' | 'h' | 'd' | 'c';
/** Two-character card code, e.g. "Ah", "Td", "9c" — same convention as the poker engine. */
export type Card = `${Rank}${Suit}`;

export type SeatOccupant = 'HERO' | 'EMPTY';

export type BoxAction = 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT' | 'SURRENDER';

export type BoxResult = 'WIN' | 'LOSE' | 'PUSH' | 'BLACKJACK' | 'SURRENDER';

export enum BlackjackPhase {
  BETTING = 'BETTING',
  INSURANCE = 'INSURANCE',
  PLAYER_TURNS = 'PLAYER_TURNS',
  DEALER_TURN = 'DEALER_TURN',
  ROUND_COMPLETE = 'ROUND_COMPLETE',
}

export interface BlackjackRules {
  numDecks: number;
  dealerHitsSoft17: boolean;
  /** Payout multiplier for a natural blackjack, e.g. 1.5 for 3:2, 1.2 for 6:5. */
  blackjackPayout: number;
  doubleAfterSplit: boolean;
  resplitAces: boolean;
  /** Maximum number of splits per original box (3 splits = up to 4 resulting hands). */
  maxSplits: number;
  lateSurrender: boolean;
  /** Fraction of the shoe dealt before a reshuffle is triggered at the next round, e.g. 0.75. */
  penetration: number;
  minBet: number;
  maxBet: number;
}

export const DEFAULT_RULES: BlackjackRules = {
  numDecks: 6,
  dealerHitsSoft17: true,
  blackjackPayout: 1.5,
  doubleAfterSplit: true,
  resplitAces: false,
  maxSplits: 3,
  lateSurrender: true,
  penetration: 0.75,
  minBet: 5,
  maxBet: 500,
};

export interface BoxState {
  id: string;
  seat: number;
  boxIndex: number;
  cards: Card[];
  bet: number;
  insuranceBet: number;
  insuranceDecided: boolean;
  isDoubled: boolean;
  /** True for every box created by a split (both resulting hands). */
  isFromSplit: boolean;
  isSplitAces: boolean;
  /** How many times this box's lineage has been split (0 for an original, unsplit box). */
  splitDepth: number;
  /** Natural 21 on the initial two cards. Never true for a box created by a split. */
  isBlackjack: boolean;
  isBust: boolean;
  isSurrendered: boolean;
  isStanding: boolean;
  isResolved: boolean;
  result: BoxResult | null;
  /** Net profit (positive) or loss (negative) from this box, including any insurance side bet. */
  payout: number;
}

export interface SeatState {
  seat: number;
  occupant: SeatOccupant;
  name: string;
  boxes: BoxState[];
}

export interface DealerState {
  cards: Card[];
  holeCardRevealed: boolean;
}

export interface BlackjackGameState {
  rules: BlackjackRules;
  shoe: Card[];
  shoeSize: number;
  seats: SeatState[];
  dealer: DealerState;
  phase: BlackjackPhase;
  activeBoxId: string | null;
  roundNumber: number;
  needsReshuffle: boolean;
  /** Single shared balance for every seat the hero occupies — sitting at more seats never multiplies funds. */
  heroBankroll: number;
}

export interface HandValue {
  total: number;
  isSoft: boolean;
  isBust: boolean;
  isBlackjack: boolean;
}

export interface LegalBoxActions {
  actions: BoxAction[];
  minBet: number;
  maxBet: number;
}

