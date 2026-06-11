import Link from 'next/link';
import { db } from '@/db';
import { assets } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import type { AssetClass } from '@/db/schema';
import { ASSET_CLASSES } from '@/db/schema';
import {
  computeInvestmentNetWorth,
  computeTotalNetWorth,
  computeAssetClassBreakdown,
  computePurposeBreakdown,
} from '@/lib/calculations';
import { normalizeToUsd } from '@/lib/fx';
import { getUsdVndRate } from '@/lib/settings';
import { AllocationChart } from '@/components/dashboard/AllocationChart';
import type { AllocationDataItem } from '@/components/dashboard/AllocationChart';
import { PurposeAllocation } from '@/components/dashboard/PurposeAllocation';
import { HoldingsStats } from '@/components/holdings/HoldingsStats';
import { FilterTabs } from '@/components/holdings/FilterTabs';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';
import { ArchivedSection } from '@/components/holdings/ArchivedSection';
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from '@/lib/formatters';
import { getCreditLiabilityUsd } from '@/lib/banking';

const HOLDING_COLORS = ['#818CF8', '#34D399', '#F472B6', '#FB923C', '#A78BFA', '#38BDF8', '#FBBF24', '#F87171', '#4ADE80', '#22D3EE'];

export const dynamic = 'force-dynamic';

interface HoldingsPageProps {
  searchParams: { class?: string };
}

export default async function HoldingsPage({ searchParams }: HoldingsPageProps) {
  const rawClass = searchParams.class;
  const activeClass = ASSET_CLASSES.includes(rawClass as AssetClass)
    ? (rawClass as AssetClass)
    : undefined;

  const [activeAssets, archivedAssets, usdVndRate] = await Promise.all([
    db.select().from(assets).where(eq(assets.is_archived, false)).orderBy(asc(assets.name)),
    db.select().from(assets).where(eq(assets.is_archived, true)).orderBy(asc(assets.name)),
    getUsdVndRate(),
  ]);

  const filteredAssets = activeClass
    ? activeAssets.filter((a) => a.asset_class === activeClass)
    : activeAssets;

  const creditLiabilityUsd = await getCreditLiabilityUsd(usdVndRate);
  const investmentNW = computeInvestmentNetWorth(activeAssets, usdVndRate);
  const totalNW = computeTotalNetWorth(activeAssets, usdVndRate, creditLiabilityUsd);

  // Scope chart denominators to the filtered set so weights sum to 100% within the current tab
  const chartInvestmentNW = activeClass
    ? computeInvestmentNetWorth(filteredAssets, usdVndRate)
    : investmentNW;
  const chartTotalNW = activeClass
    ? computeTotalNetWorth(filteredAssets, usdVndRate)
    : totalNW;
  const assetClassBreakdown = computeAssetClassBreakdown(filteredAssets, chartInvestmentNW, usdVndRate);
  const purposeBreakdown = computePurposeBreakdown(filteredAssets, chartTotalNW, usdVndRate);

  const filteredValueUsd = filteredAssets.reduce(
    (s, a) => s + normalizeToUsd(a.current_value, a.currency, usdVndRate),
    0,
  );

  const allocationData: AllocationDataItem[] = activeClass
    ? (() => {
        const investable = filteredAssets.filter((a) => a.include_in_investment_net_worth);
        const sorted = [...investable].sort(
          (a, b) =>
            normalizeToUsd(b.current_value, b.currency, usdVndRate) -
            normalizeToUsd(a.current_value, a.currency, usdVndRate),
        );
        return sorted.map((a, i) => {
          const usdValue = normalizeToUsd(a.current_value, a.currency, usdVndRate);
          return {
            key: String(a.id),
            label: a.symbol ?? a.name,
            color: HOLDING_COLORS[i % HOLDING_COLORS.length],
            value: usdValue,
            weight: chartInvestmentNW > 0 ? (usdValue / chartInvestmentNW) * 100 : 0,
          };
        });
      })()
    : assetClassBreakdown.map((item) => ({
        key: item.asset_class,
        label: ASSET_CLASS_LABELS[item.asset_class],
        color: ASSET_CLASS_COLORS[item.asset_class],
        value: item.value,
        weight: item.weight,
      }));

  const classCount = new Set(activeAssets.map((a) => a.asset_class)).size;

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">
                TNPA
              </p>
              <h1 className="text-base font-semibold text-zinc-100 leading-tight">
                Holdings Registry
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="w-px h-8 bg-[#26262B]" />
              <div>
                <p className="text-sm text-zinc-300">Asset Registry</p>
                <p className="text-[11px] text-zinc-600">
                  {activeAssets.length} active · {classCount} classes
                  {archivedAssets.length > 0 && ` · ${archivedAssets.length} archived`}
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/holdings/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Asset
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">
        <HoldingsStats
          totalCount={activeAssets.length}
          filteredCount={filteredAssets.length}
          filteredValue={filteredValueUsd}
          investmentNetWorth={investmentNW}
          totalNetWorth={totalNW}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AllocationChart
            data={allocationData}
            label={activeClass ? `Asset Allocation · ${ASSET_CLASS_LABELS[activeClass]}` : undefined}
          />
          <PurposeAllocation
            data={purposeBreakdown}
            label={activeClass ? `Asset Purpose · ${ASSET_CLASS_LABELS[activeClass]}` : undefined}
          />
        </div>

        <div className="space-y-3">
          <FilterTabs activeClass={activeClass} />
          <HoldingsTable assets={filteredAssets} totalNetWorth={totalNW} usdVndRate={usdVndRate} />
        </div>

        {(() => {
          const filteredArchived = activeClass
            ? archivedAssets.filter((a) => a.asset_class === activeClass)
            : archivedAssets;
          const archivedLabel = activeClass
            ? `Archived ${ASSET_CLASS_LABELS[activeClass]}`
            : 'Archived Assets';
          return <ArchivedSection assets={filteredArchived} label={archivedLabel} usdVndRate={usdVndRate} />;
        })()}
      </main>
    </div>
  );
}
