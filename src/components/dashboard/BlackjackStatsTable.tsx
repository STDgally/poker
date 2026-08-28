import { BlackjackStats } from '@/lib/blackjackAnalytics';
import { formatChips } from '@/lib/format';

interface BlackjackStatsTableProps {
  stats: BlackjackStats;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-slate-800 last:border-0">
      <td className="py-2 pr-4 text-slate-400">{label}</td>
      <td className="py-2 text-right font-mono font-semibold text-slate-100">{value}</td>
    </tr>
  );
}

export function BlackjackStatsTable({ stats }: BlackjackStatsTableProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-300">Statistiche aggregate</h2>
      <table className="w-full text-sm">
        <tbody>
          <Row label="Mani giocate" value={stats.roundsPlayed.toString()} />
          <Row label="Risultato netto" value={`${formatChips(stats.netChips)} chips`} />
          <Row label="Win rate (per box)" value={`${stats.winRate.toFixed(1)}%`} />
          <Row label="Blackjack naturali" value={`${stats.blackjackRate.toFixed(1)}%`} />
          <Row label="Sballi (bust)" value={`${stats.bustRate.toFixed(1)}%`} />
          <Row label="Aderenza alla strategia base" value={`${stats.strategyAdherencePct.toFixed(1)}%`} />
        </tbody>
      </table>
    </div>
  );
}
