'use client';

import { useState } from 'react';
import { useCountingTrainerStore } from '@/store/countingTrainerStore';
import { COUNTING_SYSTEMS, CountingSystemKey } from '@/lib/counting/systems';
import { COUNTING_LEVELS } from '@/lib/counting/levels';
import { CountingPracticeMode } from '@/lib/counting/persistenceTypes';

export function TrainerSetup() {
  const startDrill = useCountingTrainerStore((s) => s.startDrill);
  const [system, setSystem] = useState<CountingSystemKey>('HI_LO');
  const [level, setLevel] = useState(1);
  const [practiceMode, setPracticeMode] = useState<CountingPracticeMode>('RUNNING_COUNT');

  const systemDef = COUNTING_SYSTEMS[system];

  return (
    <div className="w-full max-w-2xl rounded-lg border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-4 text-lg font-bold text-slate-100">Allenamento conteggio carte</h2>

      <div className="mb-4">
        <div className="mb-2 text-sm font-semibold text-slate-300">Sistema di conteggio</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.values(COUNTING_SYSTEMS).map((sys) => (
            <button
              key={sys.key}
              onClick={() => setSystem(sys.key)}
              className={`rounded-md border p-3 text-left transition ${
                system === sys.key ? 'border-amber-400 bg-amber-500/10' : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className={`font-semibold ${system === sys.key ? 'text-amber-300' : 'text-slate-200'}`}>{sys.label}</div>
              <div className="mt-1 text-xs text-slate-500">{sys.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-sm font-semibold text-slate-300">Livello di difficoltà</div>
        <div className="grid grid-cols-5 gap-2">
          {COUNTING_LEVELS.map((lvl) => (
            <button
              key={lvl.level}
              onClick={() => setLevel(lvl.level)}
              className={`rounded-md border p-2 text-center text-xs transition ${
                level === lvl.level ? 'border-amber-400 bg-amber-500/10 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="font-semibold">{lvl.level}</div>
              <div className="text-[10px] text-slate-500">{lvl.label}</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {COUNTING_LEVELS[level - 1].deckCount} mazzi, una carta ogni {(COUNTING_LEVELS[level - 1].msPerCard / 1000).toFixed(1)}s,
          verifica ogni {COUNTING_LEVELS[level - 1].cardsPerCheckpoint} carte.
        </p>
      </div>

      <div className="mb-5">
        <div className="mb-2 text-sm font-semibold text-slate-300">Cosa allenare</div>
        <div className="flex gap-2">
          <button
            onClick={() => setPracticeMode('RUNNING_COUNT')}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition ${
              practiceMode === 'RUNNING_COUNT' ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            Conteggio corrente
          </button>
          <button
            onClick={() => setPracticeMode('TRUE_COUNT')}
            disabled={!systemDef.isBalanced}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${
              practiceMode === 'TRUE_COUNT' ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            True count
          </button>
        </div>
        {!systemDef.isBalanced && (
          <p className="mt-2 text-xs text-slate-500">
            {systemDef.label} non è bilanciato: la conversione a true count non ha senso con questo sistema, disponibile solo il
            conteggio corrente.
          </p>
        )}
      </div>

      <button
        onClick={() => startDrill(system, level, systemDef.isBalanced ? practiceMode : 'RUNNING_COUNT')}
        className="w-full rounded-md bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-500"
      >
        Inizia l&apos;allenamento
      </button>
    </div>
  );
}
