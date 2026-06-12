import { db } from '@/db';
import {
  appSettings,
  decisionLogs,
  decisionReviews,
  watchlistItems,
  opportunities,
} from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { normalizeToUsd, getNormalizedCostBasisUsd } from '@/lib/fx';
import {
  REBALANCING_CLASSES,
  REBALANCING_SETTINGS_KEYS,
  DEFAULT_TARGETS,
  computeRebalancing,
  PURPOSE_REBALANCING_PURPOSES,
  PURPOSE_REBALANCING_SETTINGS_KEYS,
  DEFAULT_PURPOSE_TARGETS,
  computePurposeRebalancing,
  type RebalancingAssetClass,
  type RebalancingPurpose,
} from '@/lib/rebalancing';
import { REBALANCING_COLORS, REBALANCING_LABELS } from '@/lib/rebalancing';
import { PURPOSE_COLORS, PURPOSE_LABELS, formatValue } from '@/lib/formatters';
import type { AssetPurpose } from '@/db/schema';
import { getPortfolioSummary, positionToAsset } from '@/lib/portfolio-aggregation';
import { getBankingMaturitySummary } from '@/lib/banking-events';

import { WealthSnapshot } from '@/components/dashboard/WealthSnapshot';
import { PurposeHealth, type PurposeHealthRow } from '@/components/dashboard/PurposeHealth';
import { DecisionIntelligence } from '@/components/dashboard/DecisionIntelligence';
import { WealthScore } from '@/components/dashboard/WealthScore';
import { ReviewQueue } from '@/components/dashboard/ReviewQueue';
import { RebalancingSignals } from '@/components/dashboard/RebalancingSignals';
import { PipelineSummary } from '@/components/dashboard/PipelineSummary';
import { SourceContributionPanel } from '@/components/portfolio/SourceContributionPanel';
import { BankingAlertsCard, UpcomingBankingEvents } from '@/components/banking/BankingEvents';
import { Card } from '@/components/ui/Card';
import { LifecycleDashboard } from '@/components/dashboard/LifecycleDashboard';
import { getLifecycleDashboard } from '@/lib/asset-lifecycle';
import { LocationsSummary } from '@/components/dashboard/LocationsSummary';
import { getPortfolioLocations } from '@/lib/locations';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

export const dynamic = 'force-dynamic';

// ── Score helpers ────────────────────────────────────────────────────────────

function computeAllocationScore(classDrift: number, purposeDrift: number): number {
  const worst = Math.max(classDrift, purposeDrift);
  if (worst < 10) return 25;
  if (worst < 20) return 18;
  if (worst < 35) return 10;
  return 4;
}

function computeDecisionScore(total: number, open: number): number {
  if (total === 0) return 5;
  const openRatio = open / total;
  if (openRatio < 0.2) return 25;
  if (openRatio < 0.5) return 18;
  if (openRatio < 0.8) return 12;
  return 6;
}

function computeReviewScore(total: number, reviewed: number, overdueWatchlist: number): number {
  if (total === 0) return 0;
  const rate = reviewed / total;
  const base = rate >= 0.7 ? 22 : rate >= 0.4 ? 15 : rate >= 0.1 ? 8 : 2;
  return Math.min(25, base + (overdueWatchlist === 0 ? 3 : 0));
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CommandCenter() {
  const [
    portfolio,
    allSettings,
    allDecisions,
    allReviews,
    activeWatchlist,
    allOpps,
    bankingEvents,
    lifecycleDashboard,
    locationsData,
  ] = await Promise.all([
    getPortfolioSummary(),
    db.select().from(appSettings),
    db.select().from(decisionLogs).orderBy(desc(decisionLogs.decision_date)),
    db.select().from(decisionReviews),
    db.select().from(watchlistItems).where(eq(watchlistItems.status, 'active')),
    db.select().from(opportunities),
    getBankingMaturitySummary(),
    getLifecycleDashboard(),
    getPortfolioLocations(),
  ]);
  const allAssets = portfolio.positions.map(positionToAsset);
  const usdVndRate = portfolio.usdVndRate;

  // ── Settings map ────────────────────────────────────────────────────────────
  const settingsMap = new Map(allSettings.map((s) => [s.key, s.value]));

  // ── Targets ─────────────────────────────────────────────────────────────────
  const classTargets = { ...DEFAULT_TARGETS };
  for (const cls of REBALANCING_CLASSES) {
    const val = settingsMap.get(REBALANCING_SETTINGS_KEYS[cls]);
    if (val) {
      const n = parseFloat(val);
      if (Number.isFinite(n)) classTargets[cls] = n;
    }
  }

  const purposeTargets = { ...DEFAULT_PURPOSE_TARGETS };
  for (const p of PURPOSE_REBALANCING_PURPOSES) {
    const val = settingsMap.get(PURPOSE_REBALANCING_SETTINGS_KEYS[p]);
    if (val) {
      const n = parseFloat(val);
      if (Number.isFinite(n)) purposeTargets[p] = n;
    }
  }

  // ── Rebalancing ─────────────────────────────────────────────────────────────
  const rebalancing = computeRebalancing(allAssets, classTargets, usdVndRate);
  const purposeRebalancing = computePurposeRebalancing(allAssets, purposeTargets, usdVndRate);

  // ── Wealth snapshot ─────────────────────────────────────────────────────────
  const totalNetWorth = portfolio.totalNetWorth;
  const investableNetWorth = portfolio.investmentNetWorth;

  const assetsWithCostBasis = allAssets.filter((a) => a.cost_basis != null);
  const totalCostBasis = assetsWithCostBasis.reduce(
    (sum, a) => sum + normalizeToUsd(a.current_value, a.currency, usdVndRate),
    0,
  );
  // Gain/Loss only against assets that have a cost basis
  const costBasisTotal = assetsWithCostBasis.reduce(
    (sum, a) => sum + getNormalizedCostBasisUsd(a, usdVndRate),
    0,
  );
  const totalGainLoss = costBasisTotal > 0 ? totalCostBasis - costBasisTotal : null;
  const gainLossPct =
    totalGainLoss != null && costBasisTotal > 0
      ? (totalGainLoss / costBasisTotal) * 100
      : null;

  // ── Purpose health rows ─────────────────────────────────────────────────────
  const purposeHealthRows: PurposeHealthRow[] = purposeRebalancing.rows.map((r) => ({
    purpose: r.purpose as AssetPurpose,
    currentPct: r.currentPct,
    targetPct: r.targetPct,
    drift: r.differencePct, // positive = underfunded
  }));

  // ── Decision metrics ────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const cutoff = ninetyDaysAgo.toISOString().split('T')[0];

  const openDecisions = allDecisions.filter((d) => !d.is_reviewed);
  const reviewedDecisions = allDecisions.filter((d) => d.is_reviewed);
  const positiveReviews = allReviews.filter((r) => r.outcome === 'positive').length;
  const winRate =
    allReviews.length > 0 ? Math.round((positiveReviews / allReviews.length) * 100) : null;
  const overdueDecisions = openDecisions.filter((d) => d.decision_date <= cutoff);

  // ── Review queue ────────────────────────────────────────────────────────────
  const overdueWatchlist = activeWatchlist.filter(
    (w) => w.review_date && w.review_date <= today,
  );
  const underfundedBuckets = purposeRebalancing.rows
    .filter((r) => r.differencePct > 5)
    .sort((a, b) => b.differencePct - a.differencePct)
    .slice(0, 4);

  // ── Rebalancing signals ─────────────────────────────────────────────────────
  // Pick the class/purpose row with the largest absolute drift
  const largestClassRow = [...rebalancing.rows].sort(
    (a, b) => Math.abs(b.differencePct) - Math.abs(a.differencePct),
  )[0];
  const largestPurposeRow = [...purposeRebalancing.rows].sort(
    (a, b) => Math.abs(b.differencePct) - Math.abs(a.differencePct),
  )[0];

  const classSignal =
    largestClassRow && Math.abs(largestClassRow.differencePct) > 2
      ? {
          label: REBALANCING_LABELS[largestClassRow.assetClass as RebalancingAssetClass],
          currentPct: largestClassRow.currentPct,
          targetPct: largestClassRow.targetPct,
          differencePct: largestClassRow.differencePct,
          action: largestClassRow.action,
          color: REBALANCING_COLORS[largestClassRow.assetClass as RebalancingAssetClass],
        }
      : null;

  const purposeSignal =
    largestPurposeRow && Math.abs(largestPurposeRow.differencePct) > 2
      ? {
          label: PURPOSE_LABELS[largestPurposeRow.purpose as AssetPurpose],
          currentPct: largestPurposeRow.currentPct,
          targetPct: largestPurposeRow.targetPct,
          differencePct: largestPurposeRow.differencePct,
          action: largestPurposeRow.action,
          color: PURPOSE_COLORS[largestPurposeRow.purpose as AssetPurpose] ?? '#9CA3AF',
        }
      : null;

  // ── Opportunity pipeline ────────────────────────────────────────────────────
  const inbox = allOpps.filter((o) => o.status === 'new').length;
  const researching = allOpps.filter((o) => o.status === 'reviewing').length;
  const highConviction = activeWatchlist.filter(
    (w) => w.priority === 'high' || (w.conviction_score != null && w.conviction_score >= 8),
  ).length;

  // ── Wealth Score ────────────────────────────────────────────────────────────
  const allocationScore = computeAllocationScore(
    rebalancing.driftScore,
    purposeRebalancing.driftScore,
  );
  const decisionScore = computeDecisionScore(allDecisions.length, openDecisions.length);
  const reviewScore = computeReviewScore(
    allDecisions.length,
    reviewedDecisions.length,
    overdueWatchlist.length,
  );
  const hasUsdRate = settingsMap.has('usd_vnd_rate');
  const hasPurposeTargets = PURPOSE_REBALANCING_PURPOSES.some((p) =>
    settingsMap.has(PURPOSE_REBALANCING_SETTINGS_KEYS[p]),
  );
  const hasClassTargets = REBALANCING_CLASSES.some((c) =>
    settingsMap.has(REBALANCING_SETTINGS_KEYS[c]),
  );
  const configScore = (hasUsdRate ? 8 : 0) + (hasPurposeTargets ? 9 : 0) + (hasClassTargets ? 8 : 0);
  const wealthScore = allocationScore + decisionScore + reviewScore + configScore;

  // ── Date ─────────────────────────────────────────────────────────────────────
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
              <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">TNPA</p>
              <h1 className="text-base font-semibold text-zinc-100 leading-tight">Wealth Command Center</h1>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="w-px h-6 bg-[#26262B]" />
              <p className="text-[11px] text-zinc-600">v2.0 · Personal Family Office</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">{todayLabel}</p>
            <p className="text-[11px] text-zinc-700 mt-0.5">Manual data · No live prices · No investment advice</p>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">

        {/* 1. Wealth Snapshot */}
        <WealthSnapshot
          totalNetWorth={totalNetWorth}
          investableNetWorth={investableNetWorth}
          totalGainLoss={totalGainLoss}
          gainLossPct={gainLossPct}
          usdVndRate={usdVndRate}
        />

        <SourceContributionPanel rows={portfolio.sourceContributions} />

        <LifecycleDashboard {...lifecycleDashboard} />

        <CollapsibleSection
          title="Assets by Location"
          summary={`${locationsData.locations.filter((l) => !l.isEmpty).length} active locations`}
          defaultOpen
        >
          <LocationsSummary
            locations={locationsData.locations}
            totalValue={locationsData.totalValue}
          />
        </CollapsibleSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">Upcoming Maturities</p>
            <p className="text-3xl font-light text-zinc-50 tracking-tight tabular-nums">{bankingEvents.upcomingMaturities}</p>
            <p className="mt-1.5 text-xs text-zinc-600">Deposits maturing within 30 days</p>
          </Card>
          <Card className="p-5">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">Maturing Capital</p>
            <p className="text-3xl font-light text-zinc-50 tracking-tight tabular-nums">{formatValue(bankingEvents.maturingCapital, 'VND')}</p>
            <p className="mt-1.5 text-xs text-zinc-600">Principal maturing within 30 days</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <BankingAlertsCard events={bankingEvents.events} />
          <UpcomingBankingEvents events={bankingEvents.events} />
        </div>

        {/* 2 + 7. Purpose Health ← 2/3 | Wealth Score + Decision Intel ← 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PurposeHealth rows={purposeHealthRows} />
          </div>
          <div className="space-y-4">
            <WealthScore
              score={wealthScore}
              allocationScore={allocationScore}
              decisionScore={decisionScore}
              reviewScore={reviewScore}
              configScore={configScore}
            />
            <DecisionIntelligence
              total={allDecisions.length}
              open={openDecisions.length}
              reviewed={reviewedDecisions.length}
              winRate={winRate}
              overdueCount={overdueDecisions.length}
            />
          </div>
        </div>

        {/* 4. Review Queue */}
        <ReviewQueue
          overdueDecisions={overdueDecisions.slice(0, 8)}
          overdueWatchlist={overdueWatchlist}
          underfundedBuckets={underfundedBuckets}
          totalOpen={openDecisions.length}
        />

        {/* 5 + 6. Rebalancing Signals | Opportunity Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RebalancingSignals
            classSignal={classSignal}
            purposeSignal={purposeSignal}
            classDriftScore={rebalancing.driftScore}
            purposeDriftScore={purposeRebalancing.driftScore}
          />
          <PipelineSummary
            inbox={inbox}
            researching={researching}
            watchlistCount={activeWatchlist.length}
            highConviction={highConviction}
          />
        </div>

        {/* Safety Footer */}
        <div className="border border-[#26262B] rounded-xl px-5 py-4 bg-[#131316]">
          <p className="text-[11px] font-semibold text-zinc-500 mb-1">Disclaimer</p>
          <p className="text-[11px] text-zinc-700 leading-relaxed">
            This dashboard is a personal tracking tool. It does not provide investment advice, performance
            guarantees, or automated trading. All decisions are manual and your own responsibility.
            No data leaves this device.
          </p>
        </div>

        <div className="pb-4 text-center">
          <p className="text-[10px] text-zinc-800">TNPA Wealth OS · v2.0 · {todayLabel}</p>
        </div>
      </main>
    </div>
  );
}
