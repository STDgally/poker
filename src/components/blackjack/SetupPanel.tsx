'use client';

import { useState } from 'react';
import { useBlackjackStore } from '@/store/blackjackStore';
import { SeatConfig, SeatOccupant } from '@/lib/blackjack/types';

const SEAT_NUMBERS = [0, 1, 2, 3, 4, 5];
const STARTING_STACK_DEFAULT = 1000;

interface SeatSetup {
  occupant: SeatOccupant;
  boxCount: number;
}

export function SetupPanel() {
  const initTable = useBlackjackStore((s) => s.initTable);
  const [startingStack, setStartingStack] = useState(STARTING_STACK_DEFAULT);
  const [seats, setSeats] = useState<SeatSetup[]>(
    SEAT_NUMBERS.map((seat) => ({ occupant: seat === 0 ? 'HERO' : seat <= 2 ? 'BOT' : 'EMPTY', boxCount: 1 })),
  );

  const heroSeatCount = seats.filter((s) => s.occupant === 'HERO').length;
  const canStart = heroSeatCount > 0 && startingStack > 0;

  function updateSeat(index: number, patch: Partial<SeatSetup>) {
    setSeats((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function handleStart() {
    if (!canStart) return;
    const seatConfigs: SeatConfig[] = seats.map((s, i) => ({
      seat: i,
      occupant: s.occupant,
      name: s.occupant === 'HERO' ? (heroSeatCount > 1 ? `Tu (postazione ${i + 1})` : 'Tu') : s.occupant === 'BOT' ? `Bot ${i + 1}` : '',
      boxCount: s.occupant === 'HERO' ? s.boxCount : 1,
    }));
    initTable(seatConfigs, startingStack);
  }

  return (
    <div className="w-full max-w-2xl rounded-lg border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-4 text-lg font-bold text-slate-100">Siediti al tavolo</h2>

      <label className="mb-4 flex items-center justify-between text-sm">
        <span className="text-slate-300">Stack iniziale</span>
        <input
          type="number"
          min={100}
          step={100}
          value={startingStack}
          onChange={(e) => setStartingStack(Math.max(0, Number(e.target.value)))}
          className="w-32 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-right text-slate-100"
        />
      </label>

      <div className="flex flex-col gap-2">
        {seats.map((seat, i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/60 p-2">
            <span className="w-20 text-sm text-slate-400">Postazione {i + 1}</span>

            <div className="flex gap-1">
              {(['EMPTY', 'BOT', 'HERO'] as SeatOccupant[]).map((occ) => (
                <button
                  key={occ}
                  onClick={() => updateSeat(i, { occupant: occ })}
                  className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${
                    seat.occupant === occ
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                      : 'border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {occ === 'EMPTY' ? 'Vuota' : occ === 'BOT' ? 'Bot' : 'Tu'}
                </button>
              ))}
            </div>

            {seat.occupant === 'HERO' ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Box:</span>
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => updateSeat(i, { boxCount: n })}
                    className={`h-6 w-6 rounded-full border text-xs font-semibold transition ${
                      seat.boxCount === n
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            ) : (
              <span className="w-24" />
            )}
          </div>
        ))}
      </div>

      {heroSeatCount === 0 && <p className="mt-3 text-xs text-rose-400">Occupa almeno una postazione come &quot;Tu&quot; per iniziare.</p>}

      <button
        onClick={handleStart}
        disabled={!canStart}
        className="mt-4 w-full rounded-md bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Siediti e inizia
      </button>
    </div>
  );
}
