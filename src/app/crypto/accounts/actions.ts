'use server';

import { db } from '@/db';
import { accountRegistry } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function str(formData: FormData, key: string): string | null {
  const val = (formData.get(key) as string | null)?.trim();
  return val || null;
}

export async function createCryptoAccount(formData: FormData) {
  const name = str(formData, 'name');
  if (!name) throw new Error('Account name is required.');

  const custodyType = str(formData, 'custody_type');
  if (!['EXCHANGE','HOT_WALLET','COLD_WALLET'].includes(custodyType ?? '')) throw new Error('Choose an exchange, hot wallet, or cold wallet.');
  const currency = str(formData, 'currency') ?? 'USDT';
  if (!['USD','USDT','USDC'].includes(currency)) throw new Error('Choose USD, USDT, or USDC as the reporting currency.');

  const now = new Date().toISOString();
  await db.insert(accountRegistry).values({
    name,
    type: custodyType === 'EXCHANGE' ? 'crypto_exchange' : 'crypto_wallet',
    custody_type: custodyType as 'EXCHANGE' | 'HOT_WALLET' | 'COLD_WALLET',
    institution: str(formData, 'institution'),
    account_number_masked: null,
    currency,
    current_balance: 0,
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
