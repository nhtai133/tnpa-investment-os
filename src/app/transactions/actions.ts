'use server';

import type { TransactionType } from '@/db/schema';
import { createLifecycleTransaction } from '@/lib/asset-lifecycle';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type TransactionFormState = { error: string } | null;

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

export async function createTransaction(
  _prevState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const assetIdRaw = str(formData, 'asset_id');
  const asset_id = assetIdRaw ? Number(assetIdRaw) : null;

  const type = str(formData, 'type') as TransactionType;
  if (!type) return { error: 'Transaction type is required.' };

  const now = new Date().toISOString();
  const today = now.split('T')[0];
  const quantity = num(formData, 'quantity');
  const price = num(formData, 'price');
  const fees = num(formData, 'fees') ?? 0;
  const tax = num(formData, 'tax') ?? 0;
  const totalAmount = num(formData, 'total_amount');
  const grossProceeds = num(formData, 'gross_proceeds');
  const amount = num(formData, 'amount') ?? totalAmount ?? grossProceeds ?? ((quantity ?? 0) * (price ?? 0));

  if (!Number.isFinite(amount)) return { error: 'Amount is required.' };

  try {
    await createLifecycleTransaction({
      assetId: asset_id,
      type,
      transactionDate: str(formData, 'transaction_date') ?? today,
      settlementDate: str(formData, 'settlement_date'),
      quantity,
      price,
      amount,
      totalAmount,
      grossProceeds,
      currency: str(formData, 'currency') ?? 'USD',
      fees,
      tax,
      fundingAccountId: num(formData, 'funding_account_id'),
      executionAccountId: num(formData, 'execution_account_id'),
      custodyAccountId: num(formData, 'custody_account_id'),
      receiveAccountId: num(formData, 'receive_account_id'),
      fromCustodyAccountId: num(formData, 'from_custody_account_id'),
      toCustodyAccountId: num(formData, 'to_custody_account_id'),
      transferFee: num(formData, 'transfer_fee'),
      notes: str(formData, 'notes'),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Transaction failed. Please check your inputs.' };
  }

  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/');
  redirect('/transactions');
}
