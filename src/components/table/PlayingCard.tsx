'use client';

import { Card } from '@/lib/game/types';
import { useSettingsStore } from '@/store/settingsStore';

const SUIT_SYMBOLS: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
const SUIT_NAMES_IT: Record<string, string> = { s: 'picche', h: 'cuori', d: 'quadri', c: 'fiori' };
const RANK_NAMES_IT: Record<string, string> = { A: 'Asso', T: '10', J: 'Fante', Q: 'Regina', K: 'Re' };
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

function describeCard(card: Card): string {
  const rank = RANK_NAMES_IT[card[0]] ?? card[0];
  const suit = SUIT_NAMES_IT[card[1]];
  return `${rank} di ${suit}`;
}

export function PlayingCard({ card, hidden = false, size = 'md' }: PlayingCardProps) {
  const highContrast = useSettingsStore((s) => s.highContrast);
  const sizeClasses = SIZE_CLASSES[size];

  if (!card && !hidden) {
    return <div className={`${sizeClasses} rounded-md border border-dashed border-slate-500/50`} aria-hidden="true" />;
  }

  if (hidden || !card) {
    return (
      <div
        className={`${sizeClasses} rounded-md border border-slate-900 bg-gradient-to-br from-sky-700 to-sky-900 shadow-inner`}
        role="img"
        aria-label="Carta coperta"
      />
    );
  }

  const rank = card[0];
  const suit = card[1];
  const isRed = RED_SUITS.has(suit);
  // Under high contrast, use blue instead of red for hearts/diamonds — red/black
  // is one of the hardest pairs to distinguish for red-green color blindness.
  const redClass = highContrast ? 'text-sky-400' : 'text-red-600';

  return (
    <div
      className={`${sizeClasses} flex flex-col items-center justify-center rounded-md border border-slate-300 bg-white font-bold leading-none shadow ${
        isRed ? redClass : 'text-slate-900'
      }`}
      role="img"
      aria-label={describeCard(card)}
    >
      <span aria-hidden="true">{rank}</span>
      <span className="-mt-0.5" aria-hidden="true">
        {SUIT_SYMBOLS[suit]}
      </span>
    </div>
  );
}
