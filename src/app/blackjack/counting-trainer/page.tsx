'use client';

import { useCountingTrainerStore } from '@/store/countingTrainerStore';
import { NavBar } from '@/components/NavBar';
import { TrainerSetup } from '@/components/counting/TrainerSetup';
import { DrillView } from '@/components/counting/DrillView';
import { SessionSummary } from '@/components/counting/SessionSummary';

export default function CountingTrainerPage() {
  const system = useCountingTrainerStore((s) => s.system);
  const isFinished = useCountingTrainerStore((s) => s.isFinished);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-slate-950 p-6 text-slate-100">
      <NavBar title="Allenamento conteggio carte" />
      {!system ? <TrainerSetup /> : isFinished ? <SessionSummary /> : <DrillView />}
    </div>
  );
}
