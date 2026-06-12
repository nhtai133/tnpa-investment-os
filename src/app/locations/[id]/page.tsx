import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/Card';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { getAccountDetailSummary } from '@/lib/asset-lifecycle';
import { ACCOUNT_TYPE_GROUP, ACCOUNT_TYPE_MODULE, ACCOUNT_TYPE_MODULE_HREF } from '@/lib/locations';
import { formatValue, formatDate, formatPercent } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

const MODULE_DETAIL_HREF: Record<string, (id: number) => string | null> = {
  broker_account: (id) => `/stocks/accounts/${id}`,
  crypto_exchange: () => `/crypto/accounts`,
  crypto_wallet: () => `/crypto/accounts`,
  bank_account: () => null,
  cash_location: () => null,
  gold_storage: () => null,
  real_estate_registry: () => null,
  other_custody: () => null,
};

export default async function LocationDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const summary = await getAccountDetailSummary(id);
  if (!summary) notFound();

  const { account, linkedTransactions, custodiedAssets, transfersIn, transfersOut, realizedPnl } = summary;

  const group = ACCOUNT_TYPE_GROUP[account.type] ?? 'Other';
  const moduleName = ACCOUNT_TYPE_MODULE[account.type] ?? 'System';
  const moduleHref = ACCOUNT_TYPE_MODULE_HREF[account.type] ?? '/accounts';
  const moduleDetailFn = MODULE_DETAIL_HREF[account.type];
  const moduleDetailHref = moduleDetailFn ? moduleDetailFn(id) : null;

  // Compute custody/unrealized values
  let custodyValue = 0;
  let unrealizedPnl = 0;

  const enrichedPositions = custodiedAssets
    .filter((row) => row.quantity > 0)
    .map((row) => {
      const pricePerUnit =
        row.asset.quantity && row.asset.quantity > 0
          ? row.asset.current_value / row.asset.quantity
          : 0;
      const marketValue = pricePerUnit * row.quantity;
      const gain = marketValue - row.costBasis;
      const gainPct = row.costBasis > 0 ? (gain / row.costBasis) * 100 : null;
      custodyValue += marketValue;
      unrealizedPnl += gain;
      return { ...row, marketValue, gain, gainPct };
    });

  const recentTxns = linkedTransactions.slice(0, 25);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/locations"
              className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← Locations
            </Link>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              {account.name}
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              {group} · {moduleName}{account.institution ? ` · ${account.institution}` : ''} · {account.status}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {moduleDetailHref && (
              <Link
                href={moduleDetailHref}
                className="px-3 py-1.5 border border-[#303037] hover:border-zinc-500 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
              >
                Open in {moduleName}
              </Link>
            )}
            <Link
              href={`/accounts/${account.id}`}
              className="px-3 py-1.5 border border-[#303037] hover:border-zinc-500 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
            >
              Registry View
            </Link>
            <Link
              href={`/transactions/new`}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + New Transaction
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric label="Cash Balance" value={formatValue(account.current_balance, account.currency)} />
          <Metric label="Asset / Custody Value" value={formatValue(custodyValue, account.currency)} />
          <Metric
            label="Realized P&L"
            value={formatValue(realizedPnl, account.currency)}
            colored={realizedPnl}
          />
          <Metric
            label="Unrealized P&L"
            value={formatValue(unrealizedPnl, account.currency)}
            colored={unrealizedPnl}
          />
        </div>

        {/* Custody positions */}
        <CollapsibleSection
          title="Custody Positions"
          summary={enrichedPositions.length > 0 ? `${enrichedPositions.length} asset${enrichedPositions.length !== 1 ? 's' : ''}` : undefined}
          defaultOpen={enrichedPositions.length > 0}
        >
          {enrichedPositions.length === 0 ? (
            <Card className="px-6 py-8 text-center">
              <p className="text-sm text-zinc-700">
                No assets custodied here yet.{' '}
                <Link href="/transactions/new" className="text-indigo-400 hover:text-indigo-300">
                  Record a transaction
                </Link>{' '}
                to assign assets to this location.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#26262B]">
                      {['Asset', 'Qty', 'Market Value', 'Cost Basis', 'Gain / Loss'].map((col) => (
                        <th
                          key={col}
                          className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-zinc-600 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1F]">
                    {enrichedPositions.map((row) => (
                      <tr key={row.asset.id} className="hover:bg-[#101014] transition-colors">
                        <td className="px-5 py-3">
                          <Link
                            href={`/holdings/${row.asset.id}`}
                            className="text-sm text-zinc-200 hover:text-indigo-300 transition-colors"
                          >
                            {row.asset.name}
                          </Link>
                          {row.asset.symbol && (
                            <p className="text-xs text-zinc-600 mt-0.5 font-mono">{row.asset.symbol}</p>
                          )}
                          <p className="text-[11px] text-zinc-700 mt-0.5 capitalize">
                            {row.asset.asset_class}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-zinc-400 tabular-nums whitespace-nowrap">
                          {row.quantity.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-zinc-200 tabular-nums whitespace-nowrap">
                          {formatValue(row.marketValue, row.asset.currency)}
                        </td>
                        <td className="px-5 py-3 text-zinc-500 tabular-nums whitespace-nowrap">
                          {formatValue(row.costBasis, row.asset.currency)}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium tabular-nums ${
                              row.gain >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {row.gain >= 0 ? '+' : ''}
                            {formatValue(row.gain, row.asset.currency)}
                          </span>
                          {row.gainPct !== null && (
                            <p
                              className={`text-xs tabular-nums ${
                                row.gainPct >= 0 ? 'text-emerald-500' : 'text-red-500'
                              }`}
                            >
                              {formatPercent(row.gainPct)}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </CollapsibleSection>

        {/* Transfers */}
        {(transfersIn.length > 0 || transfersOut.length > 0) && (
          <CollapsibleSection
            title="Transfers"
            summary={`${transfersIn.length} in · ${transfersOut.length} out`}
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader label="Transfers In" action={`${transfersIn.length}`} />
                {transfersIn.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-zinc-700">None.</div>
                ) : (
                  <div className="divide-y divide-[#1A1A1F]">
                    {transfersIn.slice(0, 10).map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between px-5 py-3">
                        <p className="text-xs text-zinc-600">{formatDate(txn.transaction_date)}</p>
                        <p className="text-sm text-zinc-200 tabular-nums">
                          {formatValue(txn.amount, txn.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              <Card>
                <CardHeader label="Transfers Out" action={`${transfersOut.length}`} />
                {transfersOut.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-zinc-700">None.</div>
                ) : (
                  <div className="divide-y divide-[#1A1A1F]">
                    {transfersOut.slice(0, 10).map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between px-5 py-3">
                        <p className="text-xs text-zinc-600">{formatDate(txn.transaction_date)}</p>
                        <p className="text-sm text-zinc-200 tabular-nums">
                          {formatValue(txn.amount, txn.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </CollapsibleSection>
        )}

        {/* Transactions */}
        <CollapsibleSection
          title="Transactions"
          summary={`${linkedTransactions.length} total`}
          defaultOpen={enrichedPositions.length === 0}
        >
          <Card>
            <CardHeader
              label="Linked Transactions"
              action={`${linkedTransactions.length} total`}
            />
            {linkedTransactions.length === 0 ? (
              <div className="px-5 py-8 text-sm text-zinc-700">No transactions linked.</div>
            ) : (
              <div className="divide-y divide-[#1A1A1F]">
                {recentTxns.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-[#101014] transition-colors"
                  >
                    <div>
                      <p className="text-sm text-zinc-300 uppercase font-medium">{txn.type}</p>
                      <p className="text-xs text-zinc-600">{formatDate(txn.transaction_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-100 tabular-nums">
                        {formatValue(txn.amount, txn.currency)}
                      </p>
                      {txn.quantity != null && (
                        <p className="text-xs text-zinc-600 tabular-nums">
                          {txn.quantity.toLocaleString()} units
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {linkedTransactions.length > 25 && (
                  <div className="px-5 py-3 text-xs text-zinc-600">
                    Showing 25 of {linkedTransactions.length}.{' '}
                    <Link
                      href={`/accounts/${account.id}`}
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      View all in Registry →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </Card>
        </CollapsibleSection>

        {/* Module link */}
        <div className="flex items-center justify-center gap-4 py-2">
          <Link
            href={moduleHref}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Open {moduleName} module →
          </Link>
          <span className="text-zinc-800">·</span>
          <Link
            href={`/accounts/${account.id}`}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            View in Account Registry →
          </Link>
        </div>
      </main>
    </div>
  );
}

function Metric({
  label,
  value,
  colored,
}: {
  label: string;
  value: string;
  colored?: number;
}) {
  const colorClass =
    colored != null
      ? colored >= 0
        ? 'text-emerald-300'
        : 'text-red-400'
      : 'text-zinc-50';
  return (
    <Card className="p-5">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">
        {label}
      </p>
      <p className={`text-2xl font-light tracking-tight tabular-nums ${colorClass}`}>{value}</p>
    </Card>
  );
}
