import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RecordHandPayload } from '@/lib/hands/types';

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<RecordHandPayload>;

  if (
    typeof body.sessionId !== 'string' ||
    typeof body.handNumber !== 'number' ||
    typeof body.dealerSeat !== 'number' ||
    typeof body.heroSeat !== 'number' ||
    typeof body.heroPosition !== 'string' ||
    !Array.isArray(body.heroCards) ||
    !Array.isArray(body.board) ||
    typeof body.potSize !== 'number' ||
    typeof body.heroNetResult !== 'number' ||
    typeof body.vpip !== 'boolean' ||
    typeof body.pfr !== 'boolean' ||
    typeof body.wentToShowdown !== 'boolean' ||
    typeof body.wonHand !== 'boolean' ||
    !Array.isArray(body.actions)
  ) {
    return NextResponse.json({ error: 'Missing or invalid hand fields' }, { status: 400 });
  }

  const session = await prisma.session.findUnique({ where: { id: body.sessionId } });
  if (!session) {
    return NextResponse.json({ error: 'Unknown sessionId' }, { status: 404 });
  }

  const [handHistory] = await prisma.$transaction([
    prisma.handHistory.create({
      data: {
        sessionId: session.id,
        userId: session.userId,
        handNumber: body.handNumber,
        dealerSeat: body.dealerSeat,
        heroSeat: body.heroSeat,
        heroPosition: body.heroPosition,
        heroCards: JSON.stringify(body.heroCards),
        board: JSON.stringify(body.board),
        potSize: body.potSize,
        heroNetResult: body.heroNetResult,
        vpip: body.vpip,
        pfr: body.pfr,
        wentToShowdown: body.wentToShowdown,
        wonHand: body.wonHand,
        actions: {
          create: body.actions.map((a) => ({
            street: a.street,
            seat: a.seat,
            actorType: a.actorType,
            actorName: a.actorName,
            action: a.action,
            amount: a.amount,
            potAfter: a.potAfter,
            sequence: a.sequence,
          })),
        },
      },
    }),
    prisma.session.update({
      where: { id: session.id },
      data: { handsPlayed: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ handHistoryId: handHistory.id });
}
