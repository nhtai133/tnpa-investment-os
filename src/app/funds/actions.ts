'use server';

import { db } from '@/db';
import { assets } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AssetPurpose } from '@/db/schema';

export async function createFundAsset(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const symbolRaw = ((formData.get('symbol') as string) || '').trim().toUpperCase();
  const symbol = symbolRaw || null;
  const fundType = ((formData.get('fund_type') as string) || 'ETF').trim();
  const institution = ((formData.get('institution') as string) || '').trim();
  const quantityRaw = formData.get('quantity') as string;
  const avgCostRaw = formData.get('avg_cost') as string;
  const currentValueRaw = formData.get('current_value') as string;
  const currency = ((formData.get('currency') as string) || 'VND').trim();
  const purpose = ((formData.get('purpose') as string) || 'wealth_compounder') as AssetPurpose;
  const notesRaw = ((formData.get('notes') as string) || '').trim();

  const currentValue = parseFloat(currentValueRaw) || 0;
  const quantity = quantityRaw ? parseFloat(quantityRaw) : null;
  const avgCost = avgCostRaw ? parseFloat(avgCostRaw) : null;
  const costBasis = avgCost !== null && quantity !== null ? avgCost * quantity : avgCost;

  const metaLines: string[] = [`Type: ${fundType}`];
  if (institution) metaLines.push(`Broker: ${institution}`);
  const notes = [metaLines.join(' · '), notesRaw].filter(Boolean).join('\n') || null;

  const now = new Date().toISOString();

  await db.insert(assets).values({
    name,
    symbol,
    asset_class: 'funds',
    purpose,
    current_value: currentValue,
    currency,
    quantity,
    cost_basis: costBasis,
    notes,
    include_in_investment_net_worth: true,
    include_in_total_net_worth: true,
    created_at: now,
    updated_at: now,
  });

  revalidatePath('/funds');
  revalidatePath('/holdings');
  revalidatePath('/');
  redirect('/funds');
}
