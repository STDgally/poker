import { prisma } from './prisma';
import { LOCAL_USERNAME } from './localUser';

export interface BankrollPoint {
  handIndex: number;
  cumulativeNet: number;
}

export interface UserStats {
  handsPlayed: number;
  netChips: number;
  vpipPct: number;
  pfrPct: number;
  wentToShowdownPct: number;
  bbPer100: number;
  bankrollSeries: BankrollPoint[];
}

const EMPTY_STATS: UserStats = {
  handsPlayed: 0,
  netChips: 0,
  vpipPct: 0,
  pfrPct: 0,
  wentToShowdownPct: 0,
  bbPer100: 0,
  bankrollSeries: [],
};

/** Aggregates every persisted hand for the local MVP profile into dashboard-ready stats. */
export async function getUserStats(username: string = LOCAL_USERNAME): Promise<UserStats> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return EMPTY_STATS;

  const hands = await prisma.handHistory.findMany({
    where: { userId: user.id },
    orderBy: { playedAt: 'asc' },
    select: {
      heroNetResult: true,
      vpip: true,
      pfr: true,
      wentToShowdown: true,
      session: { select: { bigBlind: true } },
    },
  });

  const handsPlayed = hands.length;
  if (handsPlayed === 0) return EMPTY_STATS;

  let netChips = 0;
  let vpipCount = 0;
  let pfrCount = 0;
  let showdownCount = 0;
  let netInBigBlinds = 0;
  const bankrollSeries: BankrollPoint[] = [];

  hands.forEach((hand, index) => {
    netChips += hand.heroNetResult;
    if (hand.vpip) vpipCount += 1;
    if (hand.pfr) pfrCount += 1;
    if (hand.wentToShowdown) showdownCount += 1;
    const bigBlind = hand.session.bigBlind || 1;
    netInBigBlinds += hand.heroNetResult / bigBlind;
    bankrollSeries.push({ handIndex: index + 1, cumulativeNet: netChips });
  });

  return {
    handsPlayed,
    netChips,
    vpipPct: (vpipCount / handsPlayed) * 100,
    pfrPct: (pfrCount / handsPlayed) * 100,
    wentToShowdownPct: (showdownCount / handsPlayed) * 100,
    bbPer100: (netInBigBlinds / handsPlayed) * 100,
    bankrollSeries,
  };
}
