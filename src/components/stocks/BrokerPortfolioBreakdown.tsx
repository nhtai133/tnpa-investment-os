import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatValue, formatPercent } from '@/lib/formatters';
import type { BrokerPortfolioRow } from '@/lib/broker-portfolio';

interface Props {
  brokers: BrokerPortfolioRow[];
}

export function BrokerPortfolioBreakdown({ brokers }: Props) {
  if (brokers.length === 0) {
    return (
      <Card className="px-6 py-12 text-center">
        <p className="text-sm text-zinc-600 mb-3">No broker accounts registered yet.</p>
        <Link
          href="/stocks/accounts/new"
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          + Add a broker account
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {brokers.map((row) => (
        <Card key={row.broker.id}>
          <CardHeader
            label={row.broker.name}
            action={
              <Link
                href={`/stocks/accounts/${row.broker.id}`}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                View Broker →
              </Link>
            }
          />

          <div className="grid grid-cols-2 md:grid-cols-5 border-b border-[#26262B]">
            <BrokerMetric label="Cash Balance" value={formatValue(row.cashBalance, row.broker.currency)} />
            <BrokerMetric label="Stock Value" value={formatValue(row.stockCustodyValue, row.broker.currency)} />
            <BrokerMetric label="Total Value" value={formatValue(row.totalValue, row.broker.currency)} highlight />
            <BrokerMetric label="Holdings" value={String(row.holdingCount)} />
            <BrokerMetric label="Transactions" value={String(row.transactionCount)} />
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-2.5 border-b border-[#26262B] text-xs">
            <span className="text-zinc-600">Realized P&L:</span>
            <span className={`tabular-nums ${row.realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {row.realizedPnl >= 0 ? '+' : ''}
              {formatValue(row.realizedPnl, row.broker.currency)}
            </span>
            <span className="text-zinc-600">Unrealized P&L:</span>
            <span className={`tabular-nums ${row.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {row.unrealizedPnl >= 0 ? '+' : ''}
              {formatValue(row.unrealizedPnl, row.broker.currency)}
            </span>
          </div>

          {row.holdings.length === 0 ? (
            <div className="px-5 py-6 text-sm text-zinc-700">
              No stock positions at this broker.{' '}
              <Link href="/transactions/new" className="text-indigo-400 hover:text-indigo-300">
                Add a buy transaction
              </Link>
              {' '}to assign holdings here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1A1A1F]">
                    {['Symbol', 'Company', 'Qty', 'Market Value', 'Cost Basis', 'Gain / Loss', 'Funding Source'].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-5 py-2.5 text-left text-[10px] font-semibold tracking-widest uppercase text-zinc-600 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1F]">
                  {row.holdings.map((h) => (
                    <tr key={h.asset.id} className="hover:bg-[#101014] transition-colors">
                      <td className="px-5 py-2.5 font-mono text-xs text-zinc-400 whitespace-nowrap">
                        {h.asset.symbol ?? '—'}
                      </td>
                      <td className="px-5 py-2.5 whitespace-nowrap">
                        <Link
                          href={`/holdings/${h.asset.id}`}
                          className="text-sm text-zinc-200 hover:text-indigo-300 transition-colors"
                        >
                          {h.asset.name}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5 text-zinc-400 tabular-nums whitespace-nowrap">
                        {h.quantity.toLocaleString()}
                      </td>
                      <td className="px-5 py-2.5 text-zinc-200 tabular-nums whitespace-nowrap">
                        {formatValue(h.marketValue, h.asset.currency)}
                      </td>
                      <td className="px-5 py-2.5 text-zinc-500 tabular-nums whitespace-nowrap">
                        {formatValue(h.costBasis, h.asset.currency)}
                      </td>
                      <td className="px-5 py-2.5 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium tabular-nums ${
                            h.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {h.gainLoss >= 0 ? '+' : ''}
                          {formatValue(h.gainLoss, h.asset.currency)}
                        </span>
                        {h.gainLossPct !== null && (
                          <p
                            className={`text-xs tabular-nums ${
                              h.gainLossPct >= 0 ? 'text-emerald-500' : 'text-red-500'
                            }`}
                          >
                            {formatPercent(h.gainLossPct)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-zinc-600 text-xs whitespace-nowrap">
                        {h.fundingAccountName ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function BrokerMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-5 py-3">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-1">{label}</p>
      <p className={`text-sm tabular-nums ${highlight ? 'text-zinc-100 font-medium' : 'text-zinc-300'}`}>
        {value}
      </p>
    </div>
  );
}
