import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateLocalUser } from '@/lib/localUser';
import { CreateBlackjackSessionPayload, CreateBlackjackSessionResponse } from '@/lib/blackjack/persistenceTypes';

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateBlackjackSessionPayload>;

  if (
    typeof body.numDecks !== 'number' ||
    typeof body.dealerHitsSoft17 !== 'boolean' ||
    typeof body.blackjackPayout !== 'number' ||
    typeof body.minBet !== 'number' ||
    typeof body.maxBet !== 'number' ||
    typeof body.startStack !== 'number'
  ) {
    return NextResponse.json({ error: 'Missing or invalid session fields' }, { status: 400 });
  }

  const user = await getOrCreateLocalUser();

  const session = await prisma.blackjackSession.create({
    data: {
      userId: user.id,
      numDecks: body.numDecks,
      dealerHitsSoft17: body.dealerHitsSoft17,
      blackjackPayout: body.blackjackPayout,
      minBet: body.minBet,
      maxBet: body.maxBet,
      startStack: body.startStack,
    },
  });

  const response: CreateBlackjackSessionResponse = { sessionId: session.id };
  return NextResponse.json(response);
}
