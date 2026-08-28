// Core domain types shared by the GameEngine, the bot logic (Step 2) and the UI (Step 3).

export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
/** Two-character card code understood by pokersolver, e.g. "Ah", "Td", "2c". */
export type Card = `${Rank}${Suit}`;

export enum Street {
  PREFLOP = 'PREFLOP',
  FLOP = 'FLOP',
  TURN = 'TURN',
  RIVER = 'RIVER',
  SHOWDOWN = 'SHOWDOWN',
}

export enum PlayerActionType {
  FOLD = 'FOLD',
  CHECK = 'CHECK',
  CALL = 'CALL',
  BET = 'BET',
  RAISE = 'RAISE',
  ALL_IN = 'ALL_IN',
}

export interface PlayerAction {
  type: PlayerActionType;
  /** For BET/RAISE: the total amount the player's bet is raised *to* this street (not the delta). */
  amount?: number;
}

export interface PlayerState {
  id: string;
  name: string;
  seat: number;
  stack: number;
  isBot: boolean;
  holeCards: Card[];
  isFolded: boolean;
  isAllIn: boolean;
  /** Chips committed on the current street only. Reset when the street advances. */
  currentStreetBet: number;
  /** Chips committed during the whole hand. Used for side-pot calculation. */
  totalHandContribution: number;
  hasActedThisStreet: boolean;
}

export interface PotShare {
  amount: number;
  /** Player ids allowed to win this pot (excludes folded players and players who didn't cover this level). */
  eligiblePlayerIds: string[];
}

export interface GameState {
  handNumber: number;
  street: Street;
  deck: Card[];
  board: Card[];
  players: PlayerState[];
  dealerSeat: number;
  sbSeat: number;
  bbSeat: number;
  smallBlind: number;
  bigBlind: number;
  /** Populated once the hand ends (fold-win or showdown). */
  pots: PotShare[];
  /** Amount a player must match on the current street to stay in the hand. */
  currentBet: number;
  /** Minimum legal raise increment on top of currentBet. */
  minRaise: number;
  actionOnSeat: number | null;
  lastAggressorSeat: number | null;
  isHandComplete: boolean;
  winners: HandResult[];
}

export interface HandResult {
  playerId: string;
  amountWon: number;
  handDescription?: string;
}

export interface LegalActions {
  actions: PlayerActionType[];
  /** Chips needed to call (0 if the player can check). */
  callAmount: number;
  /** Minimum total "raise to" amount if betting/raising is legal. */
  minRaiseTo: number;
  /** Maximum total "raise to" amount (i.e. shoving all-in). */
  maxRaiseTo: number;
}

export interface SeedPlayer {
  id: string;
  name: string;
  seat: number;
  stack: number;
  isBot: boolean;
}
