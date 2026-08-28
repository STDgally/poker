'use client';

import { useBlackjackStore } from '@/store/blackjackStore';
import { formatChips } from '@/lib/format';

export function BettingControls() {
  const gameState = useBlackjackStore((s) => s.gameState);
  const pendingBets = useBlackjackStore((s) => s.pendingBets);
  const setPendingBet = useBlackjackStore((s) => s.setPendingBet);
  const dealRound = useBlackjackStore((s) => s.dealRound);

  if (!gameState) return null;
  const { rules } = gameState;
  const heroSeats = gameState.seats.filter((s) => s.occupant === 'HERO');

  const totalWagered = heroSeats.reduce((sum, seat) => {
    let seatSum = 0;
    for (let i = 0; i < seat.boxCount; i++) seatSum += pendingBets[`${seat.seat}-${i}`] ?? rules.minBet;
    return sum + seatSum;
  }, 0);

  const allValid = heroSeats.every((seat) => {
    for (let i = 0; i < seat.boxCount; i++) {
      const amount = pendingBets[`${seat.seat}-${i}`] ?? rules.minBet;
      if (amount < rules.minBet || amount > rules.maxBet) return false;
    }
    return true;
  });

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/90 p-4">
      <div className="text-sm font-semibold text-slate-200">Piazza le puntate (limiti {formatChips(rules.minBet)} - {formatChips(rules.maxBet)})</div>

      {heroSeats.map((seat) => (
        <div key={seat.seat} className="flex flex-col gap-2 rounded-md border border-slate-800 p-2">
          <div className="text-xs text-slate-400">
            {seat.name} — bankroll {formatChips(seat.bankroll)}
          </div>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: seat.boxCount }).map((_, boxIndex) => {
              const key = `${seat.seat}-${boxIndex}`;
              const amount = pendingBets[key] ?? rules.minBet;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Box {boxIndex + 1}</span>
                  <button
                    onClick={() => setPendingBet(seat.seat, boxIndex, Math.max(rules.minBet, amount - rules.minBet))}
                    className="h-7 w-7 rounded-full border border-slate-600 text-slate-200 hover:border-amber-400 hover:text-amber-300"
                  >
                    −
                  </button>
                  <span className="w-16 text-center font-mono text-amber-300">{formatChips(amount)}</span>
                  <button
                    onClick={() => setPendingBet(seat.seat, boxIndex, Math.min(rules.maxBet, amount + rules.minBet))}
                    className="h-7 w-7 rounded-full border border-slate-600 text-slate-200 hover:border-amber-400 hover:text-amber-300"
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Totale puntato: {formatChips(totalWagered)}</span>
        <button
          onClick={dealRound}
          disabled={!allValid}
          className="rounded-md bg-emerald-700 px-6 py-2 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Distribuisci
        </button>
      </div>
    </div>
  );
}
