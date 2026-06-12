'use server';

import { db } from '@/db';
import { accountRegistry } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function str(formData: FormData, key: string): string | null {
  const val = (formData.get(key) as string | null)?.trim();
  return val || null;
}

function num(formData: FormData, key: string): number {
  const val = formData.get(key) as string;
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}

export async function createCryptoAccount(formData: FormData) {
  const name = str(formData, 'name');
  if (!name) throw new Error('Account name is required.');

  const type = str(formData, 'type');
  if (type !== 'crypto_exchange' && type !== 'crypto_wallet') {
    throw new Error('Account type must be exchange or wallet.');
  }

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

  revalidatePath('/crypto/accounts');
  revalidatePath('/crypto');
  revalidatePath('/accounts');
  revalidatePath('/transactions');
  revalidatePath('/');

  const returnUrl = str(formData, 'return_url');
  redirect(returnUrl ?? '/crypto/accounts');
}
