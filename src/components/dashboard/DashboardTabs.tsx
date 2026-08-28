'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserStats } from '@/lib/analytics';
import { BlackjackStats } from '@/lib/blackjackAnalytics';
import { BankrollChart } from './BankrollChart';
import { StatsTable } from './StatsTable';
import { BlackjackStatsTable } from './BlackjackStatsTable';

interface DashboardTabsProps {
  pokerStats: UserStats;
  blackjackStats: BlackjackStats;
}

type Tab = 'poker' | 'blackjack';

export function DashboardTabs({ pokerStats, blackjackStats }: DashboardTabsProps) {
  const [tab, setTab] = useState<Tab>('poker');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <button
          onClick={() => setTab('poker')}
          className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
            tab === 'poker' ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
          }`}
        >
          Poker
        </button>
        <button
          onClick={() => setTab('blackjack')}
          className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
            tab === 'blackjack' ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'
          }`}
        >
          Blackjack
        </button>
      </div>

      {tab === 'poker' &&
        (pokerStats.handsPlayed === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
            Nessuna mano di poker giocata ancora.{' '}
            <Link href="/" className="text-sky-400 hover:text-sky-300">
              Vai al tavolo
            </Link>{' '}
            per iniziare a costruire lo storico.
          </div>
        ) : (
          <>
            <BankrollChart data={pokerStats.bankrollSeries} />
            <StatsTable stats={pokerStats} />
          </>
        ))}

      {tab === 'blackjack' &&
        (blackjackStats.roundsPlayed === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
            Nessuna mano di blackjack giocata ancora.{' '}
            <Link href="/blackjack" className="text-sky-400 hover:text-sky-300">
              Vai al tavolo
            </Link>{' '}
            per iniziare a costruire lo storico.
          </div>
        ) : (
          <>
            <BankrollChart data={blackjackStats.bankrollSeries} />
            <BlackjackStatsTable stats={blackjackStats} />
          </>
        ))}
    </div>
  );
}
