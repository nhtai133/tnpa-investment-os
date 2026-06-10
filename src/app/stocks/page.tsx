import Link from 'next/link';
import { getModuleData } from '@/lib/moduleData';
import { WorkspaceKPIs } from '@/components/workspace/WorkspaceKPIs';
import { SectionPlaceholder } from '@/components/workspace/SectionPlaceholder';
import { WorkspaceAllocationChart } from '@/components/workspace/WorkspaceAllocationChart';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';
import { ArchivedSection } from '@/components/holdings/ArchivedSection';

export const dynamic = 'force-dynamic';

export default async function StocksPage() {
  const { classAssets, investmentNW, totalNW, classValue, classValueUsd, archivedClassAssets, usdVndRate } =
    await getModuleData('stock');

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">
              Portfolio
            </p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              Stocks
            </h1>
          </div>
          <Link
            href="/stocks/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Stock
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-8">
        <WorkspaceKPIs
          totalValue={classValue}
          count={classAssets.length}
          investmentNetWorth={investmentNW}
          totalNetWorth={totalNW}
          currency="VND"
          classValueUsd={classValueUsd}
        />

        <section>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">
            Stock Holdings
          </p>
          <HoldingsTable assets={classAssets} totalNetWorth={totalNW} usdVndRate={usdVndRate} />
        </section>

        <WorkspaceAllocationChart
          assets={classAssets}
          usdVndRate={usdVndRate}
          label="Stock Allocation"
        />

        <ArchivedSection assets={archivedClassAssets} label="Archived Stocks" usdVndRate={usdVndRate} />

        <SectionPlaceholder
          label="Watchlist"
          note="Stock watchlist — coming in a future sprint."
        />

        <SectionPlaceholder
          label="Research Notes"
          note="Research notes — coming in a future sprint."
        />
      </main>
    </div>
  );
}
