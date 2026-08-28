'use client';

import { useBlackjackStore } from '@/store/blackjackStore';
import { SeatState } from '@/lib/blackjack/types';
import { ChipToken } from './ChipToken';

/** How a seat looks during the betting phase: an empty spot to claim, or the hero's chip stack once claimed. */
export function SeatSlot({ seat }: { seat: SeatState }) {
  const claimSeat = useBlackjackStore((s) => s.claimSeat);
  const leaveSeat = useBlackjackStore((s) => s.leaveSeat);
  const pendingBet = useBlackjackStore((s) => s.pendingBet);

  if (seat.occupant === 'EMPTY') {
    return (
      <button
        onClick={() => claimSeat(seat.seat)}
        className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-slate-600 text-[10px] text-slate-400 transition hover:border-amber-400 hover:text-amber-300"
        aria-label={`Siediti alla postazione ${seat.seat + 1}`}
      >
        <span className="text-lg leading-none">+</span>
        <span>Siediti</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <ChipToken amount={pendingBet} label={seat.name} />
      <button
        onClick={() => leaveSeat(seat.seat)}
        className="text-[10px] text-slate-500 underline decoration-dotted hover:text-rose-300"
      >
        Alzati
      </button>
    </div>
  );
}
