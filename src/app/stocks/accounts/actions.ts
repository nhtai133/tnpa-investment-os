'use server';

import { db } from '@/db';
import { accountRegistry } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return v && typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
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
    current_balance: 0,
    status: 'active',
    notes: str(formData, 'notes'),
    created_at: now,
    updated_at: now,
  });

  revalidatePath('/stocks/accounts');
  revalidatePath('/stocks');
  revalidatePath('/accounts');
  revalidatePath('/transactions');
  revalidatePath('/');
  redirect('/stocks');
}
