import { getUserStats } from '@/lib/analytics';
import { getBlackjackStats } from '@/lib/blackjackAnalytics';
import { getCountingStats } from '@/lib/countingAnalytics';
import { NavBar } from '@/components/NavBar';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';

// Always re-query on load: hand history changes after every hand played at either table.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [pokerStats, blackjackStats, countingStats] = await Promise.all([getUserStats(), getBlackjackStats(), getCountingStats()]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6 text-slate-100">
      <NavBar title="Dashboard & Analytics" />
      <DashboardTabs pokerStats={pokerStats} blackjackStats={blackjackStats} countingStats={countingStats} />
    </main>
  );
}
