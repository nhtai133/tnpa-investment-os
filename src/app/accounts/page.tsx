import { db } from '@/db';
import { accountRegistry, ACCOUNT_TYPES, type AccountType } from '@/db/schema';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatValue } from '@/lib/formatters';
import { asc } from 'drizzle-orm';

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
  const accounts = await db
    .select()
    .from(accountRegistry)
    .orderBy(asc(accountRegistry.type), asc(accountRegistry.name));

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">
            Lifecycle
          </p>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Account Registry
          </h1>
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
                        {['Name', 'Institution', 'Account', 'Currency', 'Balance', 'Notes'].map((col) => (
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
                      {rows.map((account) => (
                        <tr key={account.id} className="hover:bg-[#101014] transition-colors">
                          <td className="px-5 py-3 text-zinc-200 whitespace-nowrap">{account.name}</td>
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
                          <td className="px-5 py-3 text-zinc-500 min-w-[220px]">
                            {account.notes ?? '-'}
                          </td>
                        </tr>
                      ))}
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
