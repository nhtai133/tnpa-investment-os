'use server';

import { db } from '@/db';
import { accountRegistry } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return v && typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

function num(formData: FormData, key: string): number {
  const v = str(formData, key);
  if (!v) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export async function createBrokerAccount(formData: FormData) {
  const name = str(formData, 'name');
  if (!name) throw new Error('Account name is required.');

  const now = new Date().toISOString();
  await db.insert(accountRegistry).values({
    name,
    type: 'broker_account',
    institution: str(formData, 'institution'),
    account_number_masked: str(formData, 'account_number_masked'),
    currency: str(formData, 'currency') ?? 'USD',
    current_balance: num(formData, 'current_balance'),
    status: 'active',
    notes: str(formData, 'notes'),
    created_at: now,
    updated_at: now,
  });

  revalidatePath('/stocks/accounts');
  revalidatePath('/accounts');
  revalidatePath('/transactions');
  revalidatePath('/');
  redirect('/stocks/accounts');
}
