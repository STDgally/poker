'use client';

import { useCountingTrainerStore } from '@/store/countingTrainerStore';
import { getCountingSystem } from '@/lib/counting/systems';
import { getCountingLevel } from '@/lib/counting/levels';

export function SessionSummary() {
  const system = useCountingTrainerStore((s) => s.system);
  const level = useCountingTrainerStore((s) => s.level);
  const checkpoints = useCountingTrainerStore((s) => s.checkpoints);
  const dealtCards = useCountingTrainerStore((s) => s.dealtCards);
  const resetToSetup = useCountingTrainerStore((s) => s.resetToSetup);
  const startDrill = useCountingTrainerStore((s) => s.startDrill);
  const practiceMode = useCountingTrainerStore((s) => s.practiceMode);

  if (!system) return null;

  const correct = checkpoints.filter((c) => c.correct).length;
  const accuracy = checkpoints.length > 0 ? (correct / checkpoints.length) * 100 : 0;
  const avgError = checkpoints.length > 0 ? checkpoints.reduce((sum, c) => sum + c.absError, 0) / checkpoints.length : 0;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-slate-700 bg-slate-900/90 p-6 text-center">
      <h2 className="text-lg font-bold text-slate-100">Sessione completata</h2>
      <div className="text-sm text-slate-400">
        {getCountingSystem(system).label} — Livello {level} ({getCountingLevel(level).label})
      </div>

      <div className="grid w-full grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-2xl font-bold text-amber-300">{accuracy.toFixed(0)}%</div>
          <div className="text-xs text-slate-500">Accuratezza</div>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-2xl font-bold text-amber-300">{dealtCards.length}</div>
          <div className="text-xs text-slate-500">Carte viste</div>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-2xl font-bold text-slate-100">
            {correct}/{checkpoints.length}
          </div>
          <div className="text-xs text-slate-500">Checkpoint corretti</div>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-2xl font-bold text-slate-100">{avgError.toFixed(1)}</div>
          <div className="text-xs text-slate-500">Errore medio</div>
        </div>
      </div>

      <div className="flex w-full gap-3">
        <button
          onClick={() => startDrill(system, level, practiceMode)}
          className="flex-1 rounded-md bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-500"
        >
          Riprova stesso livello
        </button>
        <button
          onClick={resetToSetup}
          className="flex-1 rounded-md border border-slate-600 px-4 py-2 font-semibold text-slate-200 transition hover:border-amber-400 hover:text-amber-300"
        >
          Cambia impostazioni
        </button>
      </div>
    </div>
  );
}
