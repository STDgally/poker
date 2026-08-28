import { computeHandValue } from '@/lib/blackjack/handValue';
import { BoxState, SeatState } from '@/lib/blackjack/types';
import { formatChips } from '@/lib/format';
import { PlayingCard } from '@/components/table/PlayingCard';
import { ChipToken } from './ChipToken';

const RESULT_LABELS: Record<NonNullable<BoxState['result']>, string> = {
  WIN: 'Vinta',
  LOSE: 'Persa',
  PUSH: 'Pareggio',
  BLACKJACK: 'Blackjack!',
  SURRENDER: 'Resa',
};

function BoxCard({ box, isActive }: { box: BoxState; isActive: boolean }) {
  const value = computeHandValue(box.cards);
  const resultColor =
    box.result === 'WIN' || box.result === 'BLACKJACK'
      ? 'text-emerald-400'
      : box.result === 'LOSE' || box.result === 'SURRENDER'
        ? 'text-rose-400'
        : 'text-slate-300';

  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-lg border p-2 ${
        isActive ? 'border-amber-400 bg-slate-800 ring-2 ring-amber-400' : 'border-slate-700 bg-slate-800/70'
      }`}
    >
      <div className="flex max-w-[6.5rem] flex-wrap justify-center gap-1">
        {box.cards.map((c, i) => (
          <PlayingCard key={i} card={c} size="sm" />
        ))}
      </div>
      <div className="text-xs text-slate-300">
        {value.total}
        {value.isSoft && !value.isBust ? ' (soft)' : ''}
      </div>
      <ChipToken amount={box.bet} small />
      {box.insuranceBet > 0 && <div className="text-[10px] text-sky-400">Ass. {formatChips(box.insuranceBet)}</div>}
      {box.result && (
        <div className={`text-[10px] font-semibold ${resultColor}`}>
          {RESULT_LABELS[box.result]} {box.payout !== 0 ? `(${box.payout > 0 ? '+' : ''}${formatChips(box.payout)})` : ''}
        </div>
      )}
      {!box.result && box.isStanding && <div className="text-[10px] text-slate-500">Sta</div>}
    </div>
  );
}

export function SeatBoxes({ seat, activeBoxId }: { seat: SeatState; activeBoxId: string | null }) {
  if (seat.occupant === 'EMPTY') {
    return <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-slate-800 text-[10px] text-slate-700">vuota</div>;
  }
  if (seat.boxes.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <div className="flex flex-wrap justify-center gap-2">
        {seat.boxes.map((box) => (
          <BoxCard key={box.id} box={box} isActive={box.id === activeBoxId} />
        ))}
      </div>
      <div className="rounded-md border border-slate-700 bg-slate-900/90 px-2 py-0.5 text-center text-xs font-semibold text-slate-100">
        {seat.name}
      </div>
    </div>
  );
}
