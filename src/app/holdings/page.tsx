import Link from 'next/link';
import { db } from '@/db';
import { assets } from '@/db/schema';
import { asc } from 'drizzle-orm';
import type { AssetClass } from '@/db/schema';
import { ASSET_CLASSES } from '@/db/schema';
import {
  computeInvestmentNetWorth,
  computeTotalNetWorth,
  computeAssetClassBreakdown,
  computePurposeBreakdown,
} from '@/lib/calculations';
import { AllocationChart } from '@/components/dashboard/AllocationChart';
import { PurposeAllocation } from '@/components/dashboard/PurposeAllocation';
import { HoldingsStats } from '@/components/holdings/HoldingsStats';
import { FilterTabs } from '@/components/holdings/FilterTabs';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';

export const dynamic = 'force-dynamic';

interface HoldingsPageProps {
  searchParams: { class?: string };
}

export default async function HoldingsPage({ searchParams }: HoldingsPageProps) {
  const rawClass = searchParams.class;
  const activeClass = ASSET_CLASSES.includes(rawClass as AssetClass)
    ? (rawClass as AssetClass)
    : undefined;

  const allAssets = await db.select().from(assets).orderBy(asc(assets.name));

  const filteredAssets = activeClass
    ? allAssets.filter((a) => a.asset_class === activeClass)
    : allAssets;

  const investmentNW = computeInvestmentNetWorth(allAssets);
  const totalNW = computeTotalNetWorth(allAssets);
  const assetClassBreakdown = computeAssetClassBreakdown(allAssets, investmentNW);
  const purposeBreakdown = computePurposeBreakdown(allAssets, totalNW);
  const filteredValue = filteredAssets.reduce((s, a) => s + a.current_value, 0);

  const classCount = new Set(allAssets.map((a) => a.asset_class)).size;

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      {/* Page header — mirrors the dashboard header style */}
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
                {allAssets.length} assets · {classCount} classes
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
        {/* Stats */}
        <HoldingsStats
          totalCount={allAssets.length}
          filteredCount={filteredAssets.length}
          filteredValue={filteredValue}
          investmentNetWorth={investmentNW}
          totalNetWorth={totalNW}
        />

        {/* Allocation charts — always full portfolio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AllocationChart data={assetClassBreakdown} />
          <PurposeAllocation data={purposeBreakdown} />
        </div>

        {/* Filter + Table */}
        <div className="space-y-3">
          <FilterTabs activeClass={activeClass} />
          <HoldingsTable assets={filteredAssets} totalNetWorth={totalNW} />
        </div>
      </main>
    </div>
  );
}
