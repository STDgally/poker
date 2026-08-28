'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CountingAccuracyPoint } from '@/lib/countingAnalytics';

interface CountingAccuracyChartProps {
  data: CountingAccuracyPoint[];
}

export function CountingAccuracyChart({ data }: CountingAccuracyChartProps) {
  return (
    <div className="h-80 w-full rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-4 text-sm font-semibold text-slate-300">Accuratezza nel tempo (per sessione di allenamento)</h2>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="sessionIndex"
            stroke="#94a3b8"
            fontSize={12}
            label={{ value: 'Sessioni', position: 'insideBottom', offset: -3, fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} width={50} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 6 }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value: number) => [`${value.toFixed(0)}%`, 'Accuratezza']}
            labelFormatter={(label) => `Sessione #${label}`}
          />
          <Line type="monotone" dataKey="accuracyPct" stroke="#38bdf8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
