import { Card } from '@/lib/game/types';

const SUIT_SYMBOLS: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
const RED_SUITS = new Set(['h', 'd']);

export type PlayingCardSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<PlayingCardSize, string> = {
  sm: 'w-10 h-14 text-sm',
  md: 'w-14 h-20 text-lg',
  lg: 'w-[4.5rem] h-[6.5rem] text-3xl',
};

interface PlayingCardProps {
  card?: Card;
  /** Face-down (opponent's hidden hole card), as opposed to an empty/not-yet-dealt slot. */
  hidden?: boolean;
  size?: PlayingCardSize;
}

export function PlayingCard({ card, hidden = false, size = 'md' }: PlayingCardProps) {
  const sizeClasses = SIZE_CLASSES[size];

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
