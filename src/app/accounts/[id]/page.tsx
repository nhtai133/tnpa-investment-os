import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/Card';
import { archiveAccount } from '@/app/accounts/actions';
import { getAccountDetailSummary } from '@/lib/asset-lifecycle';
import { formatDate, formatValue } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function AccountDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const summary = await getAccountDetailSummary(id);
  if (!summary) notFound();

  const { account } = summary;

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/accounts" className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold">
              Back to Accounts
            </Link>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              {account.name}
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              {account.type.replaceAll('_', ' ')} - {account.status}
            </p>
          </div>
          <form action={archiveAccount.bind(null, account.id)}>
            <button className="px-4 py-2 border border-[#303037] hover:border-zinc-500 text-sm text-zinc-300 hover:text-zinc-100 rounded-lg transition-colors">
              {account.status === 'active' ? 'Archive' : 'Mark Inactive'}
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Current Balance" value={formatValue(account.current_balance, account.currency)} />
          <Metric label="Transactions" value={String(summary.linkedTransactions.length)} />
          <Metric label="Custody Value" value={formatValue(summary.custodiedAssets.reduce((sum, row) => sum + row.costBasis, 0), account.currency)} />
          <Metric label="Realized P&L" value={formatValue(summary.realizedPnl, account.currency)} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <AssetList title="Assets Funded From This Account" assets={summary.fundedAssets} />
          <AssetList title="Assets Executed Through This Account" assets={summary.executedAssets} />
        </div>

        <Card>
          <CardHeader label="Assets Custodied In This Account" />
          <div className="divide-y divide-[#1A1A1F]">
            {summary.custodiedAssets.length === 0 ? (
              <Empty />
            ) : (
              summary.custodiedAssets.map((row) => (
                <div key={row.asset.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <Link href={`/holdings/${row.asset.id}`} className="text-sm text-zinc-300 hover:text-indigo-300">
                    {row.asset.name}{row.asset.symbol ? ` (${row.asset.symbol})` : ''}
                  </Link>
                  <div className="text-right">
                    <p className="text-sm text-zinc-100 tabular-nums">{row.quantity.toLocaleString()} units</p>
                    <p className="text-xs text-zinc-600 tabular-nums">{formatValue(row.costBasis, row.asset.currency)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <TransactionList title="Transfers In" transactions={summary.transfersIn} accountCurrency={account.currency} />
          <TransactionList title="Transfers Out" transactions={summary.transfersOut} accountCurrency={account.currency} />
        </div>

        <TransactionList
          title="Linked Transactions"
          transactions={summary.linkedTransactions}
          accountCurrency={account.currency}
        />
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">{label}</p>
      <p className="text-2xl font-light text-zinc-50 tracking-tight tabular-nums">{value}</p>
    </Card>
  );
}

function AssetList({ title, assets }: { title: string; assets: Array<{ id: number; name: string; symbol: string | null }> }) {
  return (
    <Card>
      <CardHeader label={title} />
      <div className="divide-y divide-[#1A1A1F]">
        {assets.length === 0 ? (
          <Empty />
        ) : (
          assets.map((asset) => (
            <Link key={asset.id} href={`/holdings/${asset.id}`} className="block px-5 py-3 text-sm text-zinc-300 hover:text-indigo-300 hover:bg-[#101014]">
              {asset.name}{asset.symbol ? ` (${asset.symbol})` : ''}
            </Link>
          ))
        )}
      </div>
    </Card>
  );
}

function TransactionList({
  title,
  transactions,
}: {
  title: string;
  transactions: Array<{ id: number; type: string; transaction_date: string; amount: number; currency: string; quantity: number | null; realized_pnl: number | null }>;
  accountCurrency: string;
}) {
  return (
    <Card>
      <CardHeader label={title} />
      <div className="divide-y divide-[#1A1A1F]">
        {transactions.length === 0 ? (
          <Empty />
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div>
                <p className="text-sm text-zinc-300 uppercase">{transaction.type}</p>
                <p className="text-xs text-zinc-600">{formatDate(transaction.transaction_date)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-100 tabular-nums">{formatValue(transaction.amount, transaction.currency)}</p>
                <p className="text-xs text-zinc-600 tabular-nums">
                  {transaction.quantity != null ? `${transaction.quantity.toLocaleString()} units` : `P&L ${formatValue(transaction.realized_pnl ?? 0, transaction.currency)}`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function Empty() {
  return <div className="px-5 py-6 text-sm text-zinc-700">No records.</div>;
}
