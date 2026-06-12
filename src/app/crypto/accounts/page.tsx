import Link from 'next/link';
import { db } from '@/db';
import { accountRegistry } from '@/db/schema';
import { inArray, asc } from 'drizzle-orm';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatValue } from '@/lib/formatters';
import type { AccountRegistry } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function CryptoAccountsPage() {
  const accounts = await db
    .select()
    .from(accountRegistry)
    .where(inArray(accountRegistry.type, ['crypto_exchange', 'crypto_wallet']))
    .orderBy(asc(accountRegistry.type), asc(accountRegistry.name));

  const exchanges = accounts.filter((a) => a.type === 'crypto_exchange');
  const wallets = accounts.filter((a) => a.type === 'crypto_wallet');

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/crypto"
              className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← Crypto Portfolio
            </Link>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              Exchanges & Wallets
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              Execution venues and custody locations for crypto assets.
            </p>
          </div>
          <Link
            href="/crypto/accounts/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Exchange or Wallet
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-4">
        <AccountTable title="Exchanges" accounts={exchanges} emptyLabel="exchange" />
        <AccountTable title="Wallets" accounts={wallets} emptyLabel="wallet" />
      </main>
    </div>
  );
}

function AccountTable({
  title,
  accounts,
  emptyLabel,
}: {
  title: string;
  accounts: AccountRegistry[];
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader label={title} action={`${accounts.length} registered`} />
      {accounts.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-zinc-600 mb-3">No {emptyLabel}s registered yet.</p>
          <Link
            href="/crypto/accounts/new"
            className="inline-block text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            + Add your first {emptyLabel}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#26262B]">
                {['Name', 'Platform / Brand', 'Account', 'Currency', 'Balance', 'Status'].map((col) => (
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
                  <td className="px-5 py-3 text-zinc-500 whitespace-nowrap">{account.currency}</td>
                  <td className="px-5 py-3 text-zinc-200 tabular-nums whitespace-nowrap">
                    {formatValue(account.current_balance, account.currency)}
                  </td>
                  <td className="px-5 py-3 text-zinc-500 whitespace-nowrap">{account.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
