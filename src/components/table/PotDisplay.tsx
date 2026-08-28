import { Card } from '@/lib/game/types';
import { formatChips } from '@/lib/format';
import { PlayingCard } from './PlayingCard';

interface PotDisplayProps {
  board: Card[];
  pot: number;
}

export function PotDisplay({ board, pot }: PotDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <PlayingCard key={i} card={board[i]} />
        ))}
      </div>
      <div className="rounded-full bg-slate-900/80 px-4 py-1 text-sm font-semibold text-amber-300 shadow">
        Pot: {formatChips(pot)}
      </div>
    </div>
  );
}
