import Link from 'next/link';
import { db } from '@/db';
import { accountRegistry } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getModuleData } from '@/lib/moduleData';
import { WorkspaceKPIs } from '@/components/workspace/WorkspaceKPIs';
import { SectionPlaceholder } from '@/components/workspace/SectionPlaceholder';
import { WorkspaceAllocationChart } from '@/components/workspace/WorkspaceAllocationChart';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';
import { ArchivedSection } from '@/components/holdings/ArchivedSection';
import { Card, CardHeader } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function StocksPage() {
  const [
    { classAssets, investmentNW, totalNW, classValue, classValueUsd, archivedClassAssets, usdVndRate },
    brokerAccounts,
  ] = await Promise.all([
    getModuleData('stock'),
    db
      .select()
      .from(accountRegistry)
      .where(eq(accountRegistry.type, 'broker_account')),
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

        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              Broker Accounts
            </p>
            <Link
              href="/stocks/accounts"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Manage →
            </Link>
          </div>
          <Card>
            <CardHeader
              label="Registered Brokers"
              action={
                <Link
                  href="/stocks/accounts/new"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  + Add Broker Account
                </Link>
              }
            />
            {brokerAccounts.length === 0 ? (
              <div className="px-5 py-6 text-sm text-zinc-600">
                No broker accounts registered.{' '}
                <Link href="/stocks/accounts/new" className="text-indigo-400 hover:text-indigo-300">
                  Add one
                </Link>{' '}
                to enable lifecycle tracking for stock purchases.
              </div>
            ) : (
              <div className="divide-y divide-[#1A1A1F]">
                {brokerAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm text-zinc-200">{account.name}</p>
                      {account.institution && (
                        <p className="text-xs text-zinc-600">{account.institution}</p>
                      )}
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
