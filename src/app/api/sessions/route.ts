import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateLocalUser } from '@/lib/localUser';
import { CreateSessionPayload, CreateSessionResponse } from '@/lib/hands/types';

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateSessionPayload>;

  if (
    typeof body.smallBlind !== 'number' ||
    typeof body.bigBlind !== 'number' ||
    typeof body.buyIn !== 'number' ||
    typeof body.startStack !== 'number'
  ) {
    return NextResponse.json({ error: 'Missing or invalid session fields' }, { status: 400 });
  }

  const user = await getOrCreateLocalUser();

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      type: body.type === 'TOURNAMENT' ? 'TOURNAMENT' : 'CASH',
      smallBlind: body.smallBlind,
      bigBlind: body.bigBlind,
      buyIn: body.buyIn,
      startStack: body.startStack,
    },
  });

  const response: CreateSessionResponse = { sessionId: session.id };
  return NextResponse.json(response);
}
