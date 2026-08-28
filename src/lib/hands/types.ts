// Shared shapes between the client (tableStore, which builds these while a
// hand is played) and the API route handlers (which persist them via Prisma).

export interface CreateSessionPayload {
  type: 'CASH' | 'TOURNAMENT';
  smallBlind: number;
  bigBlind: number;
  buyIn: number;
  startStack: number;
}

export interface CreateSessionResponse {
  sessionId: string;
}

export interface HandActionPayload {
  street: 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';
  seat: number;
  actorType: 'HUMAN' | 'BOT';
  actorName: string;
  action: 'POST_SB' | 'POST_BB' | 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN';
  amount: number;
  potAfter: number;
  sequence: number;
}

export interface RecordHandPayload {
  sessionId: string;
  handNumber: number;
  dealerSeat: number;
  heroSeat: number;
  heroPosition: string;
  heroCards: string[];
  board: string[];
  potSize: number;
  heroNetResult: number;
  vpip: boolean;
  pfr: boolean;
  wentToShowdown: boolean;
  wonHand: boolean;
  actions: HandActionPayload[];
}
