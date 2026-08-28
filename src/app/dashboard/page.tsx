import Link from 'next/link';
import { getUserStats } from '@/lib/analytics';
import { NavBar } from '@/components/NavBar';
import { BankrollChart } from '@/components/dashboard/BankrollChart';
import { StatsTable } from '@/components/dashboard/StatsTable';

// Always re-query on load: hand history changes after every hand played at the table.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const stats = await getUserStats();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6 text-slate-100">
      <NavBar title="Dashboard & Analytics" />

      {stats.handsPlayed === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
          Nessuna mano giocata ancora.{' '}
          <Link href="/" className="text-sky-400 hover:text-sky-300">
            Vai al tavolo
          </Link>{' '}
          per iniziare a costruire lo storico.
        </div>
      ) : (
        <>
          <BankrollChart data={stats.bankrollSeries} />
          <StatsTable stats={stats} />
        </>
      )}
    </main>
  );
}
