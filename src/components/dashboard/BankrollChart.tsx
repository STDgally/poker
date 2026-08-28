'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BankrollPoint } from '@/lib/analytics';
import { formatChips } from '@/lib/format';

interface BankrollChartProps {
  data: BankrollPoint[];
}

export function BankrollChart({ data }: BankrollChartProps) {
  return (
    <div className="h-80 w-full rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-4 text-sm font-semibold text-slate-300">Bankroll nel tempo (chips vs mani giocate)</h2>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="handIndex"
            stroke="#94a3b8"
            fontSize={12}
            label={{ value: 'Mani giocate', position: 'insideBottom', offset: -3, fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v: number) => formatChips(v)} width={70} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 6 }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value: number) => [formatChips(value), 'Bankroll']}
            labelFormatter={(label) => `Mano #${label}`}
          />
          <Line type="monotone" dataKey="cumulativeNet" stroke="#fbbf24" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
