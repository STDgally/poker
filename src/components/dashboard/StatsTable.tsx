import { UserStats } from '@/lib/analytics';
import { formatChips } from '@/lib/format';

interface StatsTableProps {
  stats: UserStats;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-slate-800 last:border-0">
      <td className="py-2 pr-4 text-slate-400">{label}</td>
      <td className="py-2 text-right font-mono font-semibold text-slate-100">{value}</td>
    </tr>
  );
}

export function StatsTable({ stats }: StatsTableProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-300">Statistiche aggregate</h2>
      <table className="w-full text-sm">
        <tbody>
          <Row label="Mani giocate" value={stats.handsPlayed.toString()} />
          <Row label="Risultato netto" value={`${formatChips(stats.netChips)} chips`} />
          <Row label="BB/100" value={stats.bbPer100.toFixed(2)} />
          <Row label="VPIP" value={`${stats.vpipPct.toFixed(1)}%`} />
          <Row label="PFR" value={`${stats.pfrPct.toFixed(1)}%`} />
          <Row label="Went to Showdown" value={`${stats.wentToShowdownPct.toFixed(1)}%`} />
        </tbody>
      </table>
    </div>
  );
}
