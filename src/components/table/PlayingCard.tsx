import { Card } from '@/lib/game/types';

const SUIT_SYMBOLS: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
const RED_SUITS = new Set(['h', 'd']);

interface PlayingCardProps {
  card?: Card;
  /** Face-down (opponent's hidden hole card), as opposed to an empty/not-yet-dealt slot. */
  hidden?: boolean;
  small?: boolean;
}

export function PlayingCard({ card, hidden = false, small = false }: PlayingCardProps) {
  const sizeClasses = small ? 'w-8 h-11 text-xs' : 'w-12 h-16 text-base';

  if (!card && !hidden) {
    return <div className={`${sizeClasses} rounded-md border border-dashed border-slate-500/50`} />;
  }

  if (hidden || !card) {
    return (
      <div
        className={`${sizeClasses} rounded-md border border-slate-900 bg-gradient-to-br from-sky-700 to-sky-900 shadow-inner`}
      />
    );
  }

  const rank = card[0];
  const suit = card[1];
  const isRed = RED_SUITS.has(suit);

  return (
    <div
      className={`${sizeClasses} flex flex-col items-center justify-center rounded-md border border-slate-300 bg-white font-bold leading-none shadow ${
        isRed ? 'text-red-600' : 'text-slate-900'
      }`}
    >
      <span>{rank}</span>
      <span className="-mt-0.5">{SUIT_SYMBOLS[suit]}</span>
    </div>
  );
}
