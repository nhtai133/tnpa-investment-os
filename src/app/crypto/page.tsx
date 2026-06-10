import Link from 'next/link';
import { getModuleData } from '@/lib/moduleData';
import { hasMultipleCurrencies } from '@/lib/calculations';
import { WorkspaceKPIs } from '@/components/workspace/WorkspaceKPIs';
import { SectionPlaceholder } from '@/components/workspace/SectionPlaceholder';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';
import { CryptoPortfolioClient } from '@/components/crypto/CryptoPortfolioClient';

export const dynamic = 'force-dynamic';

export default async function CryptoPage() {
  const { classAssets, allAssets, investmentNW, totalNW, classValue } = await getModuleData('crypto');
  const isMixedCurrency = hasMultipleCurrencies(allAssets);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">
              Portfolio
            </p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              Crypto Portfolio
            </h1>
          </div>
          <Link
            href="/crypto/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Crypto Asset
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-8">
        <WorkspaceKPIs
          totalValue={classValue}
          count={classAssets.length}
          investmentNetWorth={investmentNW}
          totalNetWorth={totalNW}
          isMixedCurrency={isMixedCurrency}
        />

        <section>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">
            Crypto Holdings
          </p>
          <HoldingsTable assets={classAssets} totalNetWorth={totalNW} />
        </section>

        <section>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">
            Wallet Registry
          </p>
          <CryptoPortfolioClient />
        </section>

        <SectionPlaceholder
          label="Allocation Breakdown"
          note="Crypto allocation chart — coming in a future sprint."
        />

        <SectionPlaceholder
          label="Transactions"
          note="Transaction log — coming in a future sprint."
        />
      </main>
    </div>
  );
}
