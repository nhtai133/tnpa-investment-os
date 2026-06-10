'use server';

import { db } from '@/db';
import { assets } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AssetPurpose } from '@/db/schema';

export async function createGoldAsset(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const symbolRaw = ((formData.get('symbol') as string) || '').trim().toUpperCase();
  const symbol = symbolRaw || null;
  const currentValueRaw = formData.get('current_value') as string;
  const costBasisRaw = formData.get('cost_basis') as string;
  const weightAmount = ((formData.get('weight_amount') as string) || '').trim();
  const weightUnit = ((formData.get('weight_unit') as string) || 'lượng').trim();
  const storageLocation = ((formData.get('storage_location') as string) || '').trim();
  const purpose = ((formData.get('purpose') as string) || 'store_of_value') as AssetPurpose;
  const notesRaw = ((formData.get('notes') as string) || '').trim();

  const currentValue = parseFloat(currentValueRaw) || 0;
  const costBasis = costBasisRaw ? parseFloat(costBasisRaw) : null;

  const metaLines: string[] = [];
  if (weightAmount) metaLines.push(`Weight: ${weightAmount} ${weightUnit}`);
  if (storageLocation) metaLines.push(`Storage: ${storageLocation}`);
  const notes = [metaLines.join(' · '), notesRaw].filter(Boolean).join('\n') || null;

  const now = new Date().toISOString();

  await db.insert(assets).values({
    name,
    symbol,
    asset_class: 'gold',
    purpose,
    current_value: currentValue,
    currency: 'VND',
    cost_basis: costBasis,
    notes,
    include_in_investment_net_worth: true,
    include_in_total_net_worth: true,
    created_at: now,
    updated_at: now,
  });

  revalidatePath('/gold');
  revalidatePath('/holdings');
  revalidatePath('/');
  redirect('/gold');
}
