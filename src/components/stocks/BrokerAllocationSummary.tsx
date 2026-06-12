import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { formatValue, formatWeight } from '@/lib/formatters';
import type { BrokerPortfolioRow } from '@/lib/broker-portfolio';

interface Props {
  brokers: BrokerPortfolioRow[];
}

export function BrokerAllocationSummary({ brokers }: Props) {
  if (brokers.length === 0) return null;

  const totalStockValue = brokers.reduce((sum, b) => sum + b.stockCustodyValue, 0);

  return (
    <Card className="overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-[#26262B]">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
          Broker Allocation
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1A1A1F]">
              {['Broker', 'Stock Value', 'Cash', 'Total', '% of Portfolio', 'P&L'].map((col) => (
                <th
                  key={col}
                  className="px-5 py-2.5 text-left text-[10px] font-semibold tracking-widest uppercase text-zinc-600 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A1F]">
            {brokers.map((row) => {
              const pct =
                totalStockValue > 0 ? (row.stockCustodyValue / totalStockValue) * 100 : 0;
              const totalPnl = row.realizedPnl + row.unrealizedPnl;
              return (
                <tr key={row.broker.id} className="hover:bg-[#101014] transition-colors">
                  <td className="px-5 py-2.5 whitespace-nowrap">
                    <Link
                      href={`/stocks/accounts/${row.broker.id}`}
                      className="text-sm font-medium text-zinc-200 hover:text-indigo-300 transition-colors"
                    >
                      {row.broker.name}
                    </Link>
                  </td>
                  <td className="px-5 py-2.5 text-zinc-300 tabular-nums whitespace-nowrap">
                    {formatValue(row.stockCustodyValue, row.broker.currency)}
                  </td>
                  <td className="px-5 py-2.5 text-zinc-500 tabular-nums whitespace-nowrap">
                    {formatValue(row.cashBalance, row.broker.currency)}
                  </td>
                  <td className="px-5 py-2.5 text-zinc-200 tabular-nums whitespace-nowrap font-medium">
                    {formatValue(row.totalValue, row.broker.currency)}
                  </td>
                  <td className="px-5 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-[#26262B]">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400 tabular-nums">
                        {formatWeight(pct)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 whitespace-nowrap">
                    <span
                      className={`text-xs tabular-nums ${
                        totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {totalPnl >= 0 ? '+' : ''}
                      {formatValue(totalPnl, row.broker.currency)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
