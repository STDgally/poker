import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RecordBlackjackRoundPayload } from '@/lib/blackjack/persistenceTypes';

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<RecordBlackjackRoundPayload>;

  if (
    typeof body.sessionId !== 'string' ||
    typeof body.roundNumber !== 'number' ||
    !Array.isArray(body.dealerCards) ||
    typeof body.dealerTotal !== 'number' ||
    !Array.isArray(body.boxes) ||
    !Array.isArray(body.actions)
  ) {
    return NextResponse.json({ error: 'Missing or invalid round fields' }, { status: 400 });
  }

  const session = await prisma.blackjackSession.findUnique({ where: { id: body.sessionId } });
  if (!session) {
    return NextResponse.json({ error: 'Unknown sessionId' }, { status: 404 });
  }

  const [round] = await prisma.$transaction([
    prisma.blackjackRound.create({
      data: {
        sessionId: session.id,
        userId: session.userId,
        roundNumber: body.roundNumber,
        dealerCards: JSON.stringify(body.dealerCards),
        dealerTotal: body.dealerTotal,
        boxes: {
          create: body.boxes.map((b) => ({
            isHero: b.isHero,
            actorName: b.actorName,
            seat: b.seat,
            boxIndex: b.boxIndex,
            cards: JSON.stringify(b.cards),
            finalTotal: b.finalTotal,
            bet: b.bet,
            insuranceBet: b.insuranceBet,
            isDoubled: b.isDoubled,
            isFromSplit: b.isFromSplit,
            isBlackjack: b.isBlackjack,
            isBust: b.isBust,
            isSurrendered: b.isSurrendered,
            result: b.result,
            payout: b.payout,
          })),
        },
        actions: {
          create: body.actions.map((a) => ({
            seat: a.seat,
            boxIndex: a.boxIndex,
            sequence: a.sequence,
            action: a.action,
            handTotalBefore: a.handTotalBefore,
            dealerUpCard: a.dealerUpCard,
            wasOptimal: a.wasOptimal,
          })),
        },
      },
    }),
    prisma.blackjackSession.update({
      where: { id: session.id },
      data: { roundsPlayed: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ roundId: round.id });
}
