'use server';

import { db } from '@/db';
import { assets } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AssetPurpose } from '@/db/schema';

export async function createStockAsset(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const symbolRaw = ((formData.get('symbol') as string) || '').trim().toUpperCase();
  const symbol = symbolRaw || null;
  const quantityRaw = formData.get('quantity') as string;
  const avgCostRaw = formData.get('avg_cost') as string;
  const currentValueRaw = formData.get('current_value') as string;
  const purpose = ((formData.get('purpose') as string) || 'wealth_compounder') as AssetPurpose;
  const notesRaw = ((formData.get('notes') as string) || '').trim();

  const quantity = quantityRaw ? parseFloat(quantityRaw) : null;
  const avgCost = avgCostRaw ? parseFloat(avgCostRaw) : null;
  const currentValue = parseFloat(currentValueRaw) || 0;

  const costBasis =
    avgCost !== null && quantity !== null
      ? avgCost * quantity
      : avgCost !== null
        ? avgCost
        : null;

  const now = new Date().toISOString();

  await db.insert(assets).values({
    name,
    symbol,
    asset_class: 'stock',
    purpose,
    current_value: currentValue,
    currency: 'VND',
    quantity,
    cost_basis: costBasis,
    notes: notesRaw || null,
    include_in_investment_net_worth: true,
    include_in_total_net_worth: true,
    created_at: now,
    updated_at: now,
  });

  revalidatePath('/stocks');
  revalidatePath('/holdings');
  revalidatePath('/');
  redirect('/stocks');
}
