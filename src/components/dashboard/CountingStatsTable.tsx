import { CountingStats } from '@/lib/countingAnalytics';

interface CountingStatsTableProps {
  stats: CountingStats;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-slate-800 last:border-0">
      <td className="py-2 pr-4 text-slate-400">{label}</td>
      <td className="py-2 text-right font-mono font-semibold text-slate-100">{value}</td>
    </tr>
  );
}

export function CountingStatsTable({ stats }: CountingStatsTableProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-300">Statistiche aggregate</h2>
      <table className="w-full text-sm">
        <tbody>
          <Row label="Sessioni completate" value={stats.sessionsPlayed.toString()} />
          <Row label="Checkpoint totali" value={stats.totalCheckpoints.toString()} />
          <Row label="Accuratezza complessiva" value={`${stats.overallAccuracyPct.toFixed(1)}%`} />
          <Row label="Errore medio" value={stats.avgAbsoluteError.toFixed(2)} />
        </tbody>
      </table>
    </div>
  );
}
