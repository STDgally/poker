'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserStats } from '@/lib/analytics';
import { BlackjackStats } from '@/lib/blackjackAnalytics';
import { CountingStats } from '@/lib/countingAnalytics';
import { BankrollChart } from './BankrollChart';
import { StatsTable } from './StatsTable';
import { BlackjackStatsTable } from './BlackjackStatsTable';
import { CountingAccuracyChart } from './CountingAccuracyChart';
import { CountingStatsTable } from './CountingStatsTable';

interface DashboardTabsProps {
  pokerStats: UserStats;
  blackjackStats: BlackjackStats;
  countingStats: CountingStats;
}

type Tab = 'poker' | 'blackjack' | 'counting';

const EMPTY_STATE: Record<Tab, { message: string; href: string; linkLabel: string }> = {
  poker: { message: 'Nessuna mano di poker giocata ancora.', href: '/', linkLabel: 'Vai al tavolo' },
  blackjack: { message: 'Nessuna mano di blackjack giocata ancora.', href: '/blackjack', linkLabel: 'Vai al tavolo' },
  counting: { message: 'Nessuna sessione di allenamento completata ancora.', href: '/blackjack/counting-trainer', linkLabel: "Vai all'allenamento" },
};

export function DashboardTabs({ pokerStats, blackjackStats, countingStats }: DashboardTabsProps) {
  const [tab, setTab] = useState<Tab>('poker');

  const TABS: { key: Tab; label: string }[] = [
    { key: 'poker', label: 'Poker' },
    { key: 'blackjack', label: 'Blackjack' },
    { key: 'counting', label: 'Conteggio carte' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
              tab === t.key ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'poker' &&
        (pokerStats.handsPlayed === 0 ? (
          <EmptyState tab="poker" />
        ) : (
          <>
            <BankrollChart data={pokerStats.bankrollSeries} />
            <StatsTable stats={pokerStats} />
          </>
        ))}

      {tab === 'blackjack' &&
        (blackjackStats.roundsPlayed === 0 ? (
          <EmptyState tab="blackjack" />
        ) : (
          <>
            <BankrollChart data={blackjackStats.bankrollSeries} />
            <BlackjackStatsTable stats={blackjackStats} />
          </>
        ))}

      {tab === 'counting' &&
        (countingStats.sessionsPlayed === 0 ? (
          <EmptyState tab="counting" />
        ) : (
          <>
            <CountingAccuracyChart data={countingStats.accuracySeries} />
            <CountingStatsTable stats={countingStats} />
          </>
        ))}
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const { message, href, linkLabel } = EMPTY_STATE[tab];
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
      {message}{' '}
      <Link href={href} className="text-sky-400 hover:text-sky-300">
        {linkLabel}
      </Link>
      .
    </div>
  );
}
