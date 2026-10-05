'use server';

import { db } from '@/db';
import { bankAccounts, accountRegistry, transactions, type AccountType } from '@/db/schema';
import { or, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return value && typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function num(formData: FormData, key: string): number {
  const value = str(formData, key);
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function createAccount(formData: FormData) {
  const name = str(formData, 'name');
  const type = str(formData, 'type') as AccountType | null;
  if (!name || !type) throw new Error('Account name and type are required.');

  const bankId = num(formData, 'bank_account_id') || null;
  const bank = bankId ? (await db.select().from(bankAccounts).where(eq(bankAccounts.id, bankId)))[0] : null;
  if (bankId && (!bank || type !== 'bank_account')) throw new Error('Select an existing bank account and bank_account type.');
  const now = new Date().toISOString();
  await db.insert(accountRegistry).values({
    bank_account_id: bankId,
    name,
    type,
    institution: str(formData, 'institution'),
    account_number_masked: str(formData, 'account_number_masked'),
    currency: bank?.currency ?? str(formData, 'currency') ?? 'USD',
    current_balance: bank ? 0 : num(formData, 'current_balance'),
    status: 'active',
    notes: str(formData, 'notes'),
    created_at: now,
    updated_at: now,
  });

  revalidatePath('/accounts');
  revalidatePath('/');
  redirect('/accounts');
}

export async function archiveAccount(id: number) {
  const [account] = await db.select().from(accountRegistry).where(eq(accountRegistry.id, id));
  if (account?.type === 'broker_account') {
    const { setBrokerArchived } = await import('@/lib/capital-store');
    await setBrokerArchived(id, true);
    for (const path of ['/accounts', '/stocks', '/stocks/accounts', '/']) revalidatePath(path);
    return;
  }

  const linked = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(or(
      eq(transactions.funding_account_id, id),
      eq(transactions.execution_account_id, id),
      eq(transactions.custody_account_id, id),
      eq(transactions.receive_account_id, id),
      eq(transactions.from_custody_account_id, id),
      eq(transactions.to_custody_account_id, id),
    ))
    .limit(1);

  const now = new Date().toISOString();
  await db
    .update(accountRegistry)
    .set({
      status: linked.length > 0 ? 'archived' : 'inactive',
      updated_at: now,
    })
    .where(eq(accountRegistry.id, id));

  revalidatePath('/accounts');
  revalidatePath(`/accounts/${id}`);
  revalidatePath('/');
}
