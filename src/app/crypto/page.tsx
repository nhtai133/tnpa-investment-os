import Link from 'next/link';
import { db } from '@/db';
import { accountRegistry } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { getModuleData } from '@/lib/moduleData';
import { WorkspaceKPIs } from '@/components/workspace/WorkspaceKPIs';
import { SectionPlaceholder } from '@/components/workspace/SectionPlaceholder';
import { WorkspaceAllocationChart } from '@/components/workspace/WorkspaceAllocationChart';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';
import { ArchivedSection } from '@/components/holdings/ArchivedSection';
import { CryptoPortfolioClient } from '@/components/crypto/CryptoPortfolioClient';
import { Card, CardHeader } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function CryptoPage() {
  const [
    { classAssets, investmentNW, totalNW, classValue, classValueUsd, archivedClassAssets, usdVndRate },
    cryptoAccounts,
  ] = await Promise.all([
    getModuleData('crypto'),
    db.select().from(accountRegistry).where(inArray(accountRegistry.type, ['crypto_exchange', 'crypto_wallet'])),
  ]);

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
          classValueUsd={classValueUsd}
        />

        <section>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">
            Crypto Holdings
          </p>
          <HoldingsTable assets={classAssets} totalNetWorth={totalNW} usdVndRate={usdVndRate} />
        </section>

        <ArchivedSection assets={archivedClassAssets} label="Archived Crypto Holdings" usdVndRate={usdVndRate} />

        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              Exchanges & Wallets
            </p>
            <Link
              href="/crypto/accounts"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Manage →
            </Link>
          </div>
          <Card>
            <CardHeader
              label="Registered Accounts"
              action={
                <Link
                  href="/crypto/accounts/new"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  + Add Exchange or Wallet
                </Link>
              }
            />
            {cryptoAccounts.length === 0 ? (
              <div className="px-5 py-6 text-sm text-zinc-600">
                No exchanges or wallets registered.{' '}
                <Link href="/crypto/accounts/new" className="text-indigo-400 hover:text-indigo-300">
                  Add one
                </Link>{' '}
                to enable lifecycle tracking for crypto purchases.
              </div>
            ) : (
              <div className="divide-y divide-[#1A1A1F]">
                {cryptoAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm text-zinc-200">{account.name}</p>
                      {account.institution && (
                        <p className="text-xs text-zinc-600">{account.institution}</p>
                      )}
                      <p className="text-xs text-zinc-700">
                        {account.type === 'crypto_exchange' ? 'Exchange' : 'Wallet'}
                      </p>
                    </div>
                    <Link
                      href={`/accounts/${account.id}`}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        <section>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">
            Address Book
          </p>
          <CryptoPortfolioClient />
        </section>

        <WorkspaceAllocationChart
          assets={classAssets}
          usdVndRate={usdVndRate}
          label="Crypto Allocation"
        />

        <SectionPlaceholder
          label="Transactions"
          note="Transaction log — coming in a future sprint."
        />
      </main>
    </div>
  );
}
