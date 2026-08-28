import { computeHandValue } from '@/lib/blackjack/handValue';
import { DealerState } from '@/lib/blackjack/types';
import { PlayingCard } from '@/components/table/PlayingCard';

export function DealerHand({ dealer }: { dealer: DealerState }) {
  const visibleCards = dealer.holeCardRevealed ? dealer.cards : dealer.cards.slice(0, 1);
  const value = dealer.holeCardRevealed && dealer.cards.length > 0 ? computeHandValue(dealer.cards) : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Banco</div>
      <div className="flex gap-1">
        {visibleCards.map((c, i) => (
          <PlayingCard key={i} card={c} size="md" />
        ))}
        {!dealer.holeCardRevealed && dealer.cards.length > 1 && <PlayingCard hidden size="md" />}
        {dealer.cards.length === 0 &&
          Array.from({ length: 2 }).map((_, i) => <PlayingCard key={`empty-${i}`} size="md" />)}
      </div>
      {value && (
        <div className={`text-sm font-bold ${value.isBust ? 'text-rose-400' : 'text-amber-300'}`}>
          {value.total}
          {value.isBust ? ' — sballato' : value.isBlackjack ? ' — Blackjack!' : ''}
        </div>
      )}
    </div>
  );
}
