'use client';

import { useState } from 'react';
import { useBlackjackStore } from '@/store/blackjackStore';
import { useSettingsStore } from '@/store/settingsStore';

const STARTING_STACK_DEFAULT = 1000;

export function SetupPanel() {
  const initTable = useBlackjackStore((s) => s.initTable);
  const blackjackRules = useSettingsStore((s) => s.blackjackRules);
  const [startingStack, setStartingStack] = useState(STARTING_STACK_DEFAULT);

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-2 text-lg font-bold text-slate-100">Siediti al tavolo</h2>
      <p className="mb-4 text-xs text-slate-400">
        Il tavolo ha 3 postazioni libere. Una volta entrato potrai cliccarne fino a 3 per giocare più mani
        contemporaneamente, con la stessa puntata su ognuna.
      </p>

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

      <button
        onClick={() => initTable(startingStack, blackjackRules)}
        disabled={startingStack <= 0}
        className="w-full rounded-md bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Entra al tavolo
      </button>
    </div>
  );
}
