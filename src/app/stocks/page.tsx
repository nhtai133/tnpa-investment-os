import Link from 'next/link';
import { db } from '@/db';
import { accountRegistry } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getModuleData } from '@/lib/moduleData';
import { getBrokerPortfolioBreakdown } from '@/lib/broker-portfolio';
import { WorkspaceKPIs } from '@/components/workspace/WorkspaceKPIs';
import { SectionPlaceholder } from '@/components/workspace/SectionPlaceholder';
import { WorkspaceAllocationChart } from '@/components/workspace/WorkspaceAllocationChart';
import { ArchivedSection } from '@/components/holdings/ArchivedSection';
import { Card } from '@/components/ui/Card';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { BrokerPortfolioBreakdown } from '@/components/stocks/BrokerPortfolioBreakdown';
import { BrokerAllocationSummary } from '@/components/stocks/BrokerAllocationSummary';
import { StocksHoldingsTable } from '@/components/stocks/StocksHoldingsTable';
import type { AssetAccountMeta } from '@/components/stocks/StocksHoldingsTable';

export const dynamic = 'force-dynamic';

export default async function StocksPage() {
  const [
    { classAssets, investmentNW, totalNW, classValue, classValueUsd, archivedClassAssets, usdVndRate },
    brokerAccounts,
    brokerBreakdown,
  ] = await Promise.all([
    getModuleData('stock'),
    db.select().from(accountRegistry).where(eq(accountRegistry.type, 'broker_account')),
    getBrokerPortfolioBreakdown(),
  ]);

  const assetMeta = new Map<number, AssetAccountMeta>();
  for (const row of brokerBreakdown) {
    for (const holding of row.holdings) {
      const existing = assetMeta.get(holding.asset.id);
      if (existing) {
        if (existing.brokerName && !existing.brokerName.includes(row.broker.name)) {
          existing.brokerName = `${existing.brokerName}, ${row.broker.name}`;
          existing.custodyName = existing.brokerName;
        }
      } else {
        assetMeta.set(holding.asset.id, {
          brokerName: row.broker.name,
          custodyName: row.broker.name,
          fundingName: holding.fundingAccountName,
        });
      }
    }
  }

  const holdingsSummary =
    classAssets.length > 0 ? `${classAssets.length} positions` : undefined;

  const brokerSummary =
    brokerBreakdown.length > 0
      ? `${brokerBreakdown.length} broker${brokerBreakdown.length !== 1 ? 's' : ''}`
      : undefined;

  const archivedSummary =
    archivedClassAssets.length > 0
      ? `${archivedClassAssets.length} archived`
      : undefined;

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
        {/* Always-visible KPIs */}
        <WorkspaceKPIs
          totalValue={classValue}
          count={classAssets.length}
          investmentNetWorth={investmentNW}
          totalNetWorth={totalNW}
          currency="VND"
          classValueUsd={classValueUsd}
        />

        {/* Holdings + Allocation — default open */}
        <CollapsibleSection
          title="Stock Holdings & Allocation"
          summary={holdingsSummary}
          defaultOpen
        >
          <div className="space-y-4">
            <StocksHoldingsTable
              assets={classAssets}
              totalNetWorth={totalNW}
              usdVndRate={usdVndRate}
              assetMeta={assetMeta}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <WorkspaceAllocationChart
                assets={classAssets}
                usdVndRate={usdVndRate}
                label="Stock Allocation"
              />
              <BrokerAllocationSummary brokers={brokerBreakdown} />
            </div>
          </div>
        </CollapsibleSection>

        {/* Broker Portfolio Breakdown — default collapsed */}
        <CollapsibleSection
          title="Broker Portfolio Breakdown"
          summary={brokerSummary}
          defaultOpen={false}
        >
          <BrokerPortfolioBreakdown brokers={brokerBreakdown} />
        </CollapsibleSection>

        {/* Broker Accounts admin card — default collapsed */}
        <CollapsibleSection
          title="Broker Accounts"
          summary={brokerAccounts.length > 0 ? `${brokerAccounts.length} registered` : undefined}
          defaultOpen={false}
        >
          <Card>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#26262B]">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
                Registered Brokers
              </span>
              <div className="flex items-center gap-3">
                <Link
                  href="/stocks/accounts/new"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  + Add Broker Account
                </Link>
                <Link
                  href="/stocks/accounts"
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Manage →
                </Link>
              </div>
            </div>
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
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/stocks/accounts/${account.id}`}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        Detail
                      </Link>
                      <Link
                        href={`/accounts/${account.id}`}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        Registry
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </CollapsibleSection>

        {/* Archived — default collapsed */}
        <CollapsibleSection
          title="Archived Stocks"
          summary={archivedSummary}
          defaultOpen={false}
        >
          <ArchivedSection
            assets={archivedClassAssets}
            label="Archived Stocks"
            usdVndRate={usdVndRate}
          />
        </CollapsibleSection>

        {/* Watchlist — default collapsed */}
        <CollapsibleSection title="Watchlist" defaultOpen={false}>
          <SectionPlaceholder
            label="Watchlist"
            note="Stock watchlist — coming in a future sprint."
          />
        </CollapsibleSection>

        {/* Research Notes — default collapsed */}
        <CollapsibleSection title="Research Notes" defaultOpen={false}>
          <SectionPlaceholder
            label="Research Notes"
            note="Research notes — coming in a future sprint."
          />
        </CollapsibleSection>
      </main>
    </div>
  );
}
