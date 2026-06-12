'use server';

import { db } from '@/db';
import { accountRegistry, transactions, type AccountType } from '@/db/schema';
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

  const now = new Date().toISOString();
  await db.insert(accountRegistry).values({
    name,
    type,
    institution: str(formData, 'institution'),
    account_number_masked: str(formData, 'account_number_masked'),
    currency: str(formData, 'currency') ?? 'USD',
    current_balance: num(formData, 'current_balance'),
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
