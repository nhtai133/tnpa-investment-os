import Link from 'next/link';
import { db } from '@/db';
import { accountRegistry } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatValue } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function StocksBrokerAccountsPage() {
  const accounts = await db
    .select()
    .from(accountRegistry)
    .where(eq(accountRegistry.type, 'broker_account'))
    .orderBy(asc(accountRegistry.name));

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/stocks"
              className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← Stocks
            </Link>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              Broker Accounts
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              Execution venues and custody locations for stock transactions.
            </p>
          </div>
          <Link
            href="/stocks/accounts/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Broker Account
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <Card>
          <CardHeader label="Broker Accounts" action={`${accounts.length} registered`} />
          {accounts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-zinc-600 mb-3">No broker accounts registered yet.</p>
              <Link
                href="/stocks/accounts/new"
                className="inline-block text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                + Add your first broker account
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#26262B]">
                    {['Name', 'Institution', 'Account', 'Currency', 'Balance', 'Status'].map((col) => (
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
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-[#101014] transition-colors">
                      <td className="px-5 py-3 text-zinc-200 whitespace-nowrap">
                        <Link
                          href={`/accounts/${account.id}`}
                          className="hover:text-indigo-300 transition-colors"
                        >
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
                        {account.currency}
                      </td>
                      <td className="px-5 py-3 text-zinc-200 tabular-nums whitespace-nowrap">
                        {formatValue(account.current_balance, account.currency)}
                      </td>
                      <td className="px-5 py-3 text-zinc-500 whitespace-nowrap">
                        {account.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
