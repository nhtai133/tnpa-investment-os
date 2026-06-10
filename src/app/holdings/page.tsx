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
import { PurposeAllocation } from '@/components/dashboard/PurposeAllocation';
import { HoldingsStats } from '@/components/holdings/HoldingsStats';
import { FilterTabs } from '@/components/holdings/FilterTabs';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';
import { ArchivedSection } from '@/components/holdings/ArchivedSection';
import { ASSET_CLASS_LABELS } from '@/lib/formatters';

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

  const investmentNW = computeInvestmentNetWorth(activeAssets, usdVndRate);
  const totalNW = computeTotalNetWorth(activeAssets, usdVndRate);
  const assetClassBreakdown = computeAssetClassBreakdown(activeAssets, investmentNW, usdVndRate);
  const purposeBreakdown = computePurposeBreakdown(activeAssets, totalNW, usdVndRate);
  const filteredValueUsd = filteredAssets.reduce(
    (s, a) => s + normalizeToUsd(a.current_value, a.currency, usdVndRate),
    0,
  );

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
            <div className="w-px h-8 bg-[#26262B]" />
            <div>
              <p className="text-sm text-zinc-300">Asset Registry</p>
              <p className="text-[11px] text-zinc-600">
                {activeAssets.length} active · {classCount} classes
                {archivedAssets.length > 0 && ` · ${archivedAssets.length} archived`}
              </p>
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
          <AllocationChart data={assetClassBreakdown} />
          <PurposeAllocation data={purposeBreakdown} />
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
