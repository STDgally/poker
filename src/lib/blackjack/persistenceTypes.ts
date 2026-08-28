// Shared shapes between the client (blackjackStore, which builds these while
// a round is played) and the API route handlers (which persist them via Prisma).

export interface CreateBlackjackSessionPayload {
  numDecks: number;
  dealerHitsSoft17: boolean;
  blackjackPayout: number;
  minBet: number;
  maxBet: number;
  startStack: number;
}

export interface CreateBlackjackSessionResponse {
  sessionId: string;
}

export type BlackjackLogActionType = 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT' | 'SURRENDER' | 'INSURANCE_TAKEN' | 'INSURANCE_DECLINED';
export type BlackjackOutcome = 'WIN' | 'LOSE' | 'PUSH' | 'BLACKJACK' | 'SURRENDER';

export interface BlackjackActionLogPayload {
  seat: number;
  boxIndex: number;
  sequence: number;
  action: BlackjackLogActionType;
  handTotalBefore: number;
  dealerUpCard: string;
  wasOptimal: boolean;
}

export interface BlackjackBoxResultPayload {
  isHero: boolean;
  actorName: string;
  seat: number;
  boxIndex: number;
  cards: string[];
  finalTotal: number;
  bet: number;
  insuranceBet: number;
  isDoubled: boolean;
  isFromSplit: boolean;
  isBlackjack: boolean;
  isBust: boolean;
  isSurrendered: boolean;
  result: BlackjackOutcome;
  payout: number;
}

export interface RecordBlackjackRoundPayload {
  sessionId: string;
  roundNumber: number;
  dealerCards: string[];
  dealerTotal: number;
  boxes: BlackjackBoxResultPayload[];
  actions: BlackjackActionLogPayload[];
}
