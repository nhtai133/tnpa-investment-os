import { db } from '@/db';
import { accountRegistry, ACCOUNT_TYPES, type AccountType } from '@/db/schema';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatValue } from '@/lib/formatters';
import { getAccountRegistryMetrics } from '@/lib/asset-lifecycle';
import { asc } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank_account: 'Bank Accounts',
  broker_account: 'Broker Accounts',
  crypto_exchange: 'Crypto Exchanges',
  crypto_wallet: 'Crypto Wallets',
  cash_location: 'Cash Locations',
  gold_storage: 'Gold Storage',
  real_estate_registry: 'Real Estate Registries',
  other_custody: 'Other Custody',
};

export default async function AccountsPage() {
  const [accounts, metrics] = await Promise.all([
    db
      .select()
      .from(accountRegistry)
      .orderBy(asc(accountRegistry.type), asc(accountRegistry.name)),
    getAccountRegistryMetrics(),
  ]);
  const metricsMap = new Map(metrics.map((row) => [row.accountId, row]));

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">
              Lifecycle
            </p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              Account Registry
            </h1>
          </div>
          <Link
            href="/accounts/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Account
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-4">
        {ACCOUNT_TYPES.map((type) => {
          const rows = accounts.filter((account) => account.type === type);
          return (
            <Card key={type}>
              <CardHeader label={ACCOUNT_TYPE_LABELS[type]} />
              {rows.length === 0 ? (
                <div className="px-5 py-6 text-sm text-zinc-600">
                  No accounts registered.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#26262B]">
                        {['Name', 'Institution', 'Account', 'Status', 'Balance', 'Transactions', 'Assets', 'Custody Value', 'Actions'].map((col) => (
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
                      {rows.map((account) => {
                        const rowMetrics = metricsMap.get(account.id);
                        return (
                        <tr key={account.id} className="hover:bg-[#101014] transition-colors">
                          <td className="px-5 py-3 text-zinc-200 whitespace-nowrap">
                            <Link href={`/accounts/${account.id}`} className="hover:text-indigo-300 transition-colors">
                              {account.name}
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-zinc-500 whitespace-nowrap">
                            {account.institution ?? '-'}
                          </td>
                          <td className="px-5 py-3 text-zinc-500 whitespace-nowrap">
                            {account.account_number_masked ?? '-'}
                          </td>
                          <td className="px-5 py-3 text-zinc-500 whitespace-nowrap">
                            {account.status}
                          </td>
                          <td className="px-5 py-3 text-zinc-200 tabular-nums whitespace-nowrap">
                            {formatValue(account.current_balance, account.currency)}
                          </td>
                          <td className="px-5 py-3 text-zinc-500 tabular-nums whitespace-nowrap">
                            {rowMetrics?.linkedTransactionCount ?? 0}
                          </td>
                          <td className="px-5 py-3 text-zinc-500 tabular-nums whitespace-nowrap">
                            {rowMetrics?.linkedAssetCount ?? 0}
                          </td>
                          <td className="px-5 py-3 text-zinc-200 tabular-nums whitespace-nowrap">
                            {formatValue(rowMetrics?.totalCustodyValue ?? 0, account.currency)}
                          </td>
                          <td className="px-5 py-3 text-zinc-500 whitespace-nowrap">
                            <Link href={`/accounts/${account.id}`} className="text-xs hover:text-zinc-200 transition-colors">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}
      </main>
    </div>
  );
}
