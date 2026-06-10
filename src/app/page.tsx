import { db } from '@/db';
import { assets, decisionLogs, watchlistItems, rebalanceAlerts, opportunities, researchNotes } from '@/db/schema';
import { desc, eq, or } from 'drizzle-orm';

import {
  computeInvestmentNetWorth,
  computeTotalNetWorth,
  computeAssetClassBreakdown,
  computePurposeBreakdown,
  computeTopHoldings,
} from '@/lib/calculations';
import { getUsdVndRate } from '@/lib/settings';

import { NetWorthCards } from '@/components/dashboard/NetWorthCards';
import { StatCounters } from '@/components/dashboard/StatCounters';
import { AllocationChart } from '@/components/dashboard/AllocationChart';
import { PurposeAllocation } from '@/components/dashboard/PurposeAllocation';
import { TopHoldings } from '@/components/dashboard/TopHoldings';
import { RecentDecisions } from '@/components/dashboard/RecentDecisions';
import { WatchlistSummary } from '@/components/dashboard/WatchlistSummary';
import { RebalanceAlerts } from '@/components/dashboard/RebalanceAlerts';
import { RecentOpportunities } from '@/components/dashboard/RecentOpportunities';
import { RecentNotes } from '@/components/dashboard/RecentNotes';
import { NextActions } from '@/components/dashboard/NextActions';
import { QuickNav } from '@/components/dashboard/QuickNav';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [allAssets, decisions, watchlist, alerts, recentOpps, recentNotes, activeOpps, usdVndRate] =
    await Promise.all([
      db.select().from(assets).where(eq(assets.is_archived, false)),
      db.select().from(decisionLogs).orderBy(desc(decisionLogs.decision_date)).limit(5),
      db.select().from(watchlistItems).where(eq(watchlistItems.status, 'active')),
      db.select().from(rebalanceAlerts).where(eq(rebalanceAlerts.status, 'open')),
      db.select().from(opportunities).orderBy(desc(opportunities.created_at)).limit(4),
      db.select().from(researchNotes).orderBy(desc(researchNotes.created_at)).limit(4),
      db
        .select({ id: opportunities.id })
        .from(opportunities)
        .where(or(eq(opportunities.status, 'new'), eq(opportunities.status, 'reviewing'))),
      getUsdVndRate(),
    ]);

  const investmentNetWorth = computeInvestmentNetWorth(allAssets, usdVndRate);
  const totalNetWorth = computeTotalNetWorth(allAssets, usdVndRate);
  const investableRatio = totalNetWorth > 0 ? investmentNetWorth / totalNetWorth : 0;
  const assetClassBreakdown = computeAssetClassBreakdown(allAssets, investmentNetWorth, usdVndRate);
  const purposeBreakdown = computePurposeBreakdown(allAssets, totalNetWorth, usdVndRate);
  const topHoldings = computeTopHoldings(allAssets, totalNetWorth, usdVndRate);

  const activeOpportunities = activeOpps.length;
  const today = new Date().toISOString().split('T')[0];
  const pendingReviews = watchlist.filter(
    (w) => w.review_date && w.review_date <= today,
  ).length;

  const todayLabel = new Date().toLocaleDateString('en-US', {
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
              <p className="text-sm text-zinc-300">Command Center</p>
              <p className="text-[11px] text-zinc-600">v1.0 · Personal Family Office</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">{todayLabel}</p>
            <p className="text-[11px] text-zinc-700 mt-0.5">Manual data · No live prices</p>
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
        <div className="flex justify-end -mt-2">
          <p className="text-[10px] text-zinc-700">
            Reporting currency: USD · USD/VND: {usdVndRate.toLocaleString('en-US')}
          </p>
        </div>

        {/* Row 2: Stat Counters */}
        <StatCounters
          holdings={allAssets.length}
          activeOpportunities={activeOpportunities}
          watchlistItems={watchlist.length}
          totalNotes={recentNotes.length}
          recentDecisions={decisions.length}
          pendingReviews={pendingReviews}
        />

        {/* Row 3: Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AllocationChart data={assetClassBreakdown} />
          <PurposeAllocation data={purposeBreakdown} />
        </div>

        {/* Row 4: Command Center — Signals, Notes, Next Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RecentOpportunities opportunities={recentOpps} />
          <RecentNotes notes={recentNotes} />
          <NextActions items={watchlist} />
        </div>

        {/* Row 5: Top Holdings */}
        <TopHoldings holdings={topHoldings} />

        {/* Row 6: Decisions + Watchlist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RecentDecisions decisions={decisions} />
          <WatchlistSummary items={watchlist} />
        </div>

        {/* Row 7: Rebalance Alerts */}
        <RebalanceAlerts alerts={alerts} />

        {/* Row 8: Quick Navigation */}
        <QuickNav />

        {/* Footer */}
        <div className="pt-2 pb-6 text-center">
          <p className="text-[11px] text-zinc-700">
            TNPA Investment OS · v1.0 · {todayLabel}
          </p>
        </div>
      </main>
    </div>
  );
}
