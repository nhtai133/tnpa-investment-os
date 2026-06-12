import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/Card';
import { getAccountDetailSummary } from '@/lib/asset-lifecycle';
import { formatValue, formatDate, formatPercent } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function BrokerDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const summary = await getAccountDetailSummary(id);
  if (!summary) notFound();
  if (summary.account.type !== 'broker_account') notFound();

  const { account } = summary;

  const stockHoldings = summary.custodiedAssets.filter(
    (row) => row.asset.asset_class === 'stock',
  );

  const unrealizedPnl = stockHoldings.reduce((sum, row) => {
    const pricePerUnit =
      row.asset.quantity && row.asset.quantity > 0
        ? row.asset.current_value / row.asset.quantity
        : 0;
    const marketValue = pricePerUnit * row.quantity;
    return sum + (marketValue - row.costBasis);
  }, 0);

  const totalStockValue = stockHoldings.reduce((sum, row) => {
    const pricePerUnit =
      row.asset.quantity && row.asset.quantity > 0
        ? row.asset.current_value / row.asset.quantity
        : 0;
    return sum + pricePerUnit * row.quantity;
  }, 0);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/stocks/accounts"
              className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← Broker Accounts
            </Link>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              {account.name}
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              {account.institution ?? 'Broker'} · {account.status}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/accounts/${account.id}`}
              className="px-4 py-2 border border-[#303037] hover:border-zinc-500 text-sm text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
            >
              Registry View
            </Link>
            <Link
              href={`/transactions/new?execution_account_id=${account.id}`}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + New Transaction
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Cash Balance" value={formatValue(account.current_balance, account.currency)} />
          <Metric label="Stock Value" value={formatValue(totalStockValue, account.currency)} />
          <Metric
            label="Realized P&L"
            value={formatValue(summary.realizedPnl, account.currency)}
            colored={summary.realizedPnl}
          />
          <Metric
            label="Unrealized P&L"
            value={formatValue(unrealizedPnl, account.currency)}
            colored={unrealizedPnl}
          />
        </div>

        <Card>
          <CardHeader label="Stock Positions" action={`${stockHoldings.length} holdings`} />
          {stockHoldings.length === 0 ? (
            <div className="px-5 py-8 text-sm text-zinc-700">
              No stock positions at this broker.{' '}
              <Link href="/transactions/new" className="text-indigo-400 hover:text-indigo-300">
                Record a buy transaction
              </Link>{' '}
              and select this account as execution venue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#26262B]">
                    {['Asset', 'Quantity', 'Market Value', 'Cost Basis', 'Gain / Loss'].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-zinc-600 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1F]">
                  {stockHoldings.map((row) => {
                    const pricePerUnit =
                      row.asset.quantity && row.asset.quantity > 0
                        ? row.asset.current_value / row.asset.quantity
                        : 0;
                    const marketValue = pricePerUnit * row.quantity;
                    const gain = marketValue - row.costBasis;
                    const gainPct =
                      row.costBasis > 0 ? (gain / row.costBasis) * 100 : null;

                    return (
                      <tr key={row.asset.id} className="hover:bg-[#101014] transition-colors">
                        <td className="px-5 py-3">
                          <Link
                            href={`/holdings/${row.asset.id}`}
                            className="text-sm text-zinc-200 hover:text-indigo-300 transition-colors"
                          >
                            {row.asset.name}
                          </Link>
                          {row.asset.symbol && (
                            <p className="text-xs text-zinc-600 mt-0.5 font-mono">
                              {row.asset.symbol}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-zinc-400 tabular-nums">
                          {row.quantity.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-zinc-200 tabular-nums">
                          {formatValue(marketValue, row.asset.currency)}
                        </td>
                        <td className="px-5 py-3 text-zinc-500 tabular-nums">
                          {formatValue(row.costBasis, row.asset.currency)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-sm font-medium tabular-nums ${
                              gain >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {gain >= 0 ? '+' : ''}
                            {formatValue(gain, row.asset.currency)}
                          </span>
                          {gainPct !== null && (
                            <p
                              className={`text-xs tabular-nums ${
                                gainPct >= 0 ? 'text-emerald-500' : 'text-red-500'
                              }`}
                            >
                              {formatPercent(gainPct)}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            label="Transactions"
            action={`${summary.linkedTransactions.length} total`}
          />
          {summary.linkedTransactions.length === 0 ? (
            <div className="px-5 py-8 text-sm text-zinc-700">No transactions linked.</div>
          ) : (
            <div className="divide-y divide-[#1A1A1F]">
              {summary.linkedTransactions.slice(0, 25).map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div>
                    <p className="text-sm text-zinc-300 uppercase">{txn.type}</p>
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
              {summary.linkedTransactions.length > 25 && (
                <div className="px-5 py-3 text-xs text-zinc-600">
                  Showing 25 of {summary.linkedTransactions.length}.{' '}
                  <Link href={`/accounts/${account.id}`} className="text-indigo-400 hover:text-indigo-300">
                    View all in Registry
                  </Link>
                </div>
              )}
            </div>
          )}
        </Card>
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
