'use server';

import { db } from '@/db';
import { transactions } from '@/db/schema';
import type { TransactionType } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return v && typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

function num(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export async function createTransaction(formData: FormData) {
  const assetIdRaw = str(formData, 'asset_id');
  const asset_id = assetIdRaw ? Number(assetIdRaw) : null;

  const amount = num(formData, 'amount');
  if (amount === null) throw new Error('Amount is required.');

  const type = str(formData, 'type') as TransactionType;
  if (!type) throw new Error('Transaction type is required.');

  const now = new Date().toISOString();
  const today = now.split('T')[0];

  await db.insert(transactions).values({
    asset_id: asset_id ?? undefined,
    type,
    transaction_date: str(formData, 'transaction_date') ?? today,
    quantity: num(formData, 'quantity'),
    price: num(formData, 'price'),
    amount,
    currency: str(formData, 'currency') ?? 'USD',
    fees: num(formData, 'fees'),
    notes: str(formData, 'notes'),
    created_at: now,
    updated_at: now,
  });

  revalidatePath('/transactions');
  revalidatePath('/');
  redirect('/transactions');
}
