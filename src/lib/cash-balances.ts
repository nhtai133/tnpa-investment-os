import { db } from '@/db';
import { accountRegistry, bankAccounts, bankSavingsDeposits } from '@/db/schema';
export async function getEffectiveAccounts() {
  const [accounts, banks] = await Promise.all([db.select().from(accountRegistry), db.select().from(bankAccounts)]);
  return accounts.map(a => {
    if (!a.bank_account_id) return a;
    const bank = banks.find(b => b.id === a.bank_account_id);
    if (!bank) throw new Error('Broken bank account link.');
    return { ...a, current_balance: bank.status === 'active' ? bank.balance : 0, currency: bank.currency };
  });
}

export async function getCashSourceOptions() {
  const [banks, deposits, registry] = await Promise.all([db.select().from(bankAccounts), db.select().from(bankSavingsDeposits), db.select().from(accountRegistry)]);
  return [...banks.map(b => ({ value: `bank_account:${b.id}`, label: `${b.bank_name} · ${b.account_name}` })),
    ...deposits.map(d => ({ value: `deposit:${d.id}`, label: `Deposit · ${d.deposit_name}` })),
    ...registry.map(r => ({ value: `registry:${r.id}`, label: `Account · ${r.name}` }))];
}
