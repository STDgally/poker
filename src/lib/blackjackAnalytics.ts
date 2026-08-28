import { prisma } from './prisma';
import { LOCAL_USERNAME } from './localUser';
import { BankrollPoint } from './analytics';

export interface BlackjackStats {
  roundsPlayed: number;
  netChips: number;
  winRate: number;
  bustRate: number;
  blackjackRate: number;
  strategyAdherencePct: number;
  bankrollSeries: BankrollPoint[];
}

const EMPTY_STATS: BlackjackStats = {
  roundsPlayed: 0,
  netChips: 0,
  winRate: 0,
  bustRate: 0,
  blackjackRate: 0,
  strategyAdherencePct: 0,
  bankrollSeries: [],
};

/** Aggregates every persisted Blackjack round for the local MVP profile into dashboard-ready stats. */
export async function getBlackjackStats(username: string = LOCAL_USERNAME): Promise<BlackjackStats> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return EMPTY_STATS;

  const rounds = await prisma.blackjackRound.findMany({
    where: { userId: user.id },
    orderBy: { playedAt: 'asc' },
    select: {
      boxes: {
        where: { isHero: true },
        select: { payout: true, result: true, isBust: true, isBlackjack: true },
      },
    },
  });

  if (rounds.length === 0) return EMPTY_STATS;

  let netChips = 0;
  let heroBoxCount = 0;
  let winCount = 0;
  let bustCount = 0;
  let blackjackCount = 0;
  const bankrollSeries: BankrollPoint[] = [];

  rounds.forEach((round, index) => {
    let roundNet = 0;
    for (const box of round.boxes) {
      roundNet += box.payout;
      heroBoxCount += 1;
      if (box.result === 'WIN' || box.result === 'BLACKJACK') winCount += 1;
      if (box.isBust) bustCount += 1;
      if (box.isBlackjack) blackjackCount += 1;
    }
    netChips += roundNet;
    bankrollSeries.push({ handIndex: index + 1, cumulativeNet: netChips });
  });

  const actionStats = await prisma.blackjackActionLog.aggregate({
    where: { round: { userId: user.id } },
    _count: { _all: true },
  });
  const optimalActionCount = await prisma.blackjackActionLog.count({
    where: { round: { userId: user.id }, wasOptimal: true },
  });

  return {
    roundsPlayed: rounds.length,
    netChips,
    winRate: heroBoxCount > 0 ? (winCount / heroBoxCount) * 100 : 0,
    bustRate: heroBoxCount > 0 ? (bustCount / heroBoxCount) * 100 : 0,
    blackjackRate: heroBoxCount > 0 ? (blackjackCount / heroBoxCount) * 100 : 0,
    strategyAdherencePct: actionStats._count._all > 0 ? (optimalActionCount / actionStats._count._all) * 100 : 0,
    bankrollSeries,
  };
}
