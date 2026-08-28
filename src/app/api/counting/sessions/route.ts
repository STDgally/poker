import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateLocalUser } from '@/lib/localUser';
import { RecordCountingSessionPayload } from '@/lib/counting/persistenceTypes';

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<RecordCountingSessionPayload>;

  if (
    typeof body.system !== 'string' ||
    typeof body.practiceMode !== 'string' ||
    typeof body.level !== 'number' ||
    typeof body.deckCount !== 'number' ||
    typeof body.cardsSeen !== 'number' ||
    typeof body.checkpoints !== 'number' ||
    typeof body.correctCheckpoints !== 'number' ||
    typeof body.avgAbsoluteError !== 'number'
  ) {
    return NextResponse.json({ error: 'Missing or invalid session fields' }, { status: 400 });
  }

  const user = await getOrCreateLocalUser();

  const session = await prisma.cardCountingSession.create({
    data: {
      userId: user.id,
      system: body.system,
      practiceMode: body.practiceMode,
      level: body.level,
      deckCount: body.deckCount,
      cardsSeen: body.cardsSeen,
      checkpoints: body.checkpoints,
      correctCheckpoints: body.correctCheckpoints,
      avgAbsoluteError: body.avgAbsoluteError,
      endedAt: new Date(),
    },
  });

  return NextResponse.json({ sessionId: session.id });
}
