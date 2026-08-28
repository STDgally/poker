'use client';

import { useBlackjackStore } from '@/store/blackjackStore';
import { formatChips } from '@/lib/format';
import { ChipToken } from './ChipToken';

const CHIP_VALUES = [5, 25, 100, 500];

export function BettingControls() {
  const gameState = useBlackjackStore((s) => s.gameState);
  const pendingBet = useBlackjackStore((s) => s.pendingBet);
  const addChip = useBlackjackStore((s) => s.addChip);
  const clearBet = useBlackjackStore((s) => s.clearBet);
  const dealRound = useBlackjackStore((s) => s.dealRound);
  const bettingSecondsLeft = useBlackjackStore((s) => s.bettingSecondsLeft);

  if (!gameState) return null;
  const { rules } = gameState;
  const heroSeats = gameState.seats.filter((s) => s.occupant === 'HERO');
  const totalWagered = pendingBet * heroSeats.length;
  const canDeal = heroSeats.length > 0 && pendingBet >= rules.minBet && pendingBet <= rules.maxBet && totalWagered <= gameState.heroBankroll;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/90 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-200">
          Clicca una postazione libera al tavolo, poi scegli le fiches (limiti {formatChips(rules.minBet)} - {formatChips(rules.maxBet)})
        </span>
        {bettingSecondsLeft !== null && (
          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold tabular-nums ${
              bettingSecondsLeft <= 5 ? 'border-rose-500 text-rose-300' : 'border-slate-600 text-slate-300'
            }`}
            aria-live="polite"
            aria-label={`${bettingSecondsLeft} secondi rimanenti prima della distribuzione automatica`}
          >
            {bettingSecondsLeft}s
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {CHIP_VALUES.map((value) => (
          <button key={value} onClick={() => addChip(value)} aria-label={`Aggiungi fiche da ${value}`}>
            <ChipToken amount={value} />
          </button>
        ))}
        <button
          onClick={clearBet}
          className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-300 transition hover:border-rose-400 hover:text-rose-300"
        >
          Pulisci puntata
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">
          Puntata per postazione: <span className="font-mono text-amber-300">{formatChips(pendingBet)}</span>
          {heroSeats.length > 1 && (
            <>
              {' '}
              · Totale ({heroSeats.length} postazioni): <span className="font-mono text-amber-300">{formatChips(totalWagered)}</span>
            </>
          )}
        </div>
        <button
          onClick={dealRound}
          disabled={!canDeal}
          className="rounded-md bg-emerald-700 px-6 py-2 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Dai le carte subito
        </button>
      </div>

      {heroSeats.length === 0 && <p className="text-center text-xs text-rose-400">Clicca su una postazione libera al tavolo per sederti.</p>}
    </div>
  );
}
