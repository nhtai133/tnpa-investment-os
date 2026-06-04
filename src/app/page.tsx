import { db } from '@/db';
import { assets, decisionLogs, watchlistItems, rebalanceAlerts } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

import {
  computeInvestmentNetWorth,
  computeTotalNetWorth,
  computeAssetClassBreakdown,
  computePurposeBreakdown,
  computeTopHoldings,
} from '@/lib/calculations';

import { NetWorthCards } from '@/components/dashboard/NetWorthCards';
import { AllocationChart } from '@/components/dashboard/AllocationChart';
import { PurposeAllocation } from '@/components/dashboard/PurposeAllocation';
import { TopHoldings } from '@/components/dashboard/TopHoldings';
import { RecentDecisions } from '@/components/dashboard/RecentDecisions';
import { WatchlistSummary } from '@/components/dashboard/WatchlistSummary';
import { RebalanceAlerts } from '@/components/dashboard/RebalanceAlerts';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [allAssets, decisions, watchlist, alerts] = await Promise.all([
    db.select().from(assets),
    db.select().from(decisionLogs).orderBy(desc(decisionLogs.decision_date)).limit(5),
    db.select().from(watchlistItems).where(eq(watchlistItems.status, 'active')),
    db.select().from(rebalanceAlerts).where(eq(rebalanceAlerts.status, 'open')),
  ]);

  const investmentNetWorth = computeInvestmentNetWorth(allAssets);
  const totalNetWorth = computeTotalNetWorth(allAssets);
  const investableRatio = totalNetWorth > 0 ? investmentNetWorth / totalNetWorth : 0;
  const assetClassBreakdown = computeAssetClassBreakdown(allAssets, investmentNetWorth);
  const purposeBreakdown = computePurposeBreakdown(allAssets, totalNetWorth);
  const topHoldings = computeTopHoldings(allAssets, totalNetWorth);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      {/* Header */}
      <header className="border-b border-[#26262B] px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">
                TNPA
              </p>
              <h1 className="text-base font-semibold text-zinc-100 leading-tight">
                Investment OS
              </h1>
            </div>
            <div className="w-px h-8 bg-[#26262B]" />
            <div>
              <p className="text-sm text-zinc-300">Net Worth Command Center</p>
              <p className="text-[11px] text-zinc-600">Personal Family Office</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">{today}</p>
            <p className="text-[11px] text-zinc-700 mt-0.5">Seed data · No live prices</p>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">
        {/* Row 1: Net Worth Cards */}
        <NetWorthCards
          investmentNetWorth={investmentNetWorth}
          totalNetWorth={totalNetWorth}
          investableRatio={investableRatio}
        />

        {/* Row 2: Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AllocationChart data={assetClassBreakdown} />
          <PurposeAllocation data={purposeBreakdown} />
        </div>

        {/* Row 3: Top Holdings */}
        <TopHoldings holdings={topHoldings} />

        {/* Row 4: Decisions + Watchlist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RecentDecisions decisions={decisions} />
          <WatchlistSummary items={watchlist} />
        </div>

        {/* Row 5: Rebalance Alerts */}
        <RebalanceAlerts alerts={alerts} />

        {/* Footer */}
        <div className="pt-2 pb-6 text-center">
          <p className="text-[11px] text-zinc-700">
            TNPA Investment OS · Phase 1 MVP · {today}
          </p>
        </div>
      </main>
    </div>
  );
}
