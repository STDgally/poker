import { prisma } from './prisma';
import { LOCAL_USERNAME } from './localUser';

export interface CountingAccuracyPoint {
  sessionIndex: number;
  accuracyPct: number;
}

export interface CountingStats {
  sessionsPlayed: number;
  totalCheckpoints: number;
  overallAccuracyPct: number;
  avgAbsoluteError: number;
  accuracySeries: CountingAccuracyPoint[];
}

const EMPTY_STATS: CountingStats = {
  sessionsPlayed: 0,
  totalCheckpoints: 0,
  overallAccuracyPct: 0,
  avgAbsoluteError: 0,
  accuracySeries: [],
};

/** Aggregates every persisted card-counting drill for the local MVP profile into dashboard-ready stats. */
export async function getCountingStats(username: string = LOCAL_USERNAME): Promise<CountingStats> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return EMPTY_STATS;

  const sessions = await prisma.cardCountingSession.findMany({
    where: { userId: user.id, checkpoints: { gt: 0 } },
    orderBy: { startedAt: 'asc' },
    select: { checkpoints: true, correctCheckpoints: true, avgAbsoluteError: true },
  });

  if (sessions.length === 0) return EMPTY_STATS;

  let totalCheckpoints = 0;
  let totalCorrect = 0;
  let totalWeightedError = 0;
  const accuracySeries: CountingAccuracyPoint[] = [];

  sessions.forEach((session, index) => {
    totalCheckpoints += session.checkpoints;
    totalCorrect += session.correctCheckpoints;
    totalWeightedError += session.avgAbsoluteError * session.checkpoints;
    accuracySeries.push({
      sessionIndex: index + 1,
      accuracyPct: (session.correctCheckpoints / session.checkpoints) * 100,
    });
  });

  return {
    sessionsPlayed: sessions.length,
    totalCheckpoints,
    overallAccuracyPct: totalCheckpoints > 0 ? (totalCorrect / totalCheckpoints) * 100 : 0,
    avgAbsoluteError: totalCheckpoints > 0 ? totalWeightedError / totalCheckpoints : 0,
    accuracySeries,
  };
}
