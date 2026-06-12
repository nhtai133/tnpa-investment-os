import Link from 'next/link';
import { db } from '@/db';
import { accountRegistry, transactions, assets } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Card } from '@/components/ui/Card';
import {
  formatDate,
  ASSET_CLASS_LABELS,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPE_COLORS,
} from '@/lib/formatters';

export const dynamic = 'force-dynamic';

function TypeBadge({ type }: { type: string }) {
  const color = TRANSACTION_TYPE_COLORS[type as keyof typeof TRANSACTION_TYPE_COLORS] ?? '#9CA3AF';
  const label = TRANSACTION_TYPE_LABELS[type as keyof typeof TRANSACTION_TYPE_LABELS] ?? type;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  );
}

function formatAmount(amount: number, currency: string): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function TransactionsPage() {
  const [txns, allAssets, accounts] = await Promise.all([
    db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.transaction_date), desc(transactions.created_at))
      .limit(500),
    db.select().from(assets),
    db.select().from(accountRegistry),
  ]);

  const assetMap = new Map(allAssets.map((a) => [a.id, a]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const buyCount = txns.filter((t) => t.type === 'buy').length;
  const sellCount = txns.filter((t) => t.type === 'sell').length;
  const incomeCount = txns.filter((t) => t.type === 'dividend' || t.type === 'interest').length;

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">
              Portfolio
            </p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              Transaction Ledger
            </h1>
          </div>
          <Link
            href="/transactions/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Transaction
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              Total Records
            </p>
            <p className="text-xl font-bold text-zinc-100 mt-1.5 tabular-nums">{txns.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              Buy
            </p>
            <p className="text-xl font-bold text-emerald-400 mt-1.5 tabular-nums">{buyCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              Sell
            </p>
            <p className="text-xl font-bold text-red-400 mt-1.5 tabular-nums">{sellCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              Income
            </p>
            <p className="text-xl font-bold text-purple-400 mt-1.5 tabular-nums">{incomeCount}</p>
          </Card>
        </div>

        {/* Table */}
        {txns.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-sm text-zinc-600">No transactions yet.</p>
            <p className="text-xs text-zinc-700 mt-1">
              Add your first transaction to start tracking activity.
            </p>
            <Link
              href="/transactions/new"
              className="inline-block mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Add Transaction
            </Link>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#26262B]">
                    {[
                      'Date', 'Type', 'Asset', 'Class',
                      'Quantity', 'Price', 'Amount', 'Funding', 'Execution', 'Custody', 'Receive', 'Fees', 'P&L',
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-zinc-600 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1F]">
                  {txns.map((txn) => {
                    const asset = txn.asset_id ? assetMap.get(txn.asset_id) : null;
                    return (
                      <tr key={txn.id} className="hover:bg-[#131316] transition-colors">
                        <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap tabular-nums">
                          {formatDate(txn.transaction_date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <TypeBadge type={txn.type} />
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-200 whitespace-nowrap max-w-[160px] truncate">
                          {asset ? (
                            <Link
                              href={`/holdings/${asset.id}`}
                              className="hover:text-indigo-400 transition-colors"
                            >
                              {asset.name}
                              {asset.symbol ? (
                                <span className="text-zinc-600 ml-1">({asset.symbol})</span>
                              ) : null}
                            </Link>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                          {asset ? ASSET_CLASS_LABELS[asset.asset_class] : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400 tabular-nums whitespace-nowrap">
                          {txn.quantity != null ? txn.quantity.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400 tabular-nums whitespace-nowrap">
                          {txn.price != null ? formatAmount(txn.price, txn.currency) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-zinc-200 tabular-nums whitespace-nowrap">
                          {formatAmount(txn.amount, txn.currency)}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                          {accountMap.get(txn.funding_account_id ?? -1)?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                          {accountMap.get(txn.execution_account_id ?? -1)?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                          {accountMap.get(txn.custody_account_id ?? txn.from_custody_account_id ?? -1)?.name ?? '—'}
                          {txn.to_custody_account_id ? ` -> ${accountMap.get(txn.to_custody_account_id)?.name ?? 'Unknown'}` : ''}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                          {accountMap.get(txn.receive_account_id ?? -1)?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500 tabular-nums whitespace-nowrap">
                          {txn.fees != null ? formatAmount(txn.fees, txn.currency) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500 tabular-nums whitespace-nowrap">
                          {txn.realized_pnl != null ? formatAmount(txn.realized_pnl, txn.currency) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
