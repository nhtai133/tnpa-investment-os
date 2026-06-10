'use server';

import { db } from '@/db';
import { assets } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AssetClass, AssetPurpose } from '@/db/schema';

export async function createCashFundAsset(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const accountType = ((formData.get('account_type') as string) || 'Cash').trim();
  const institution = ((formData.get('institution') as string) || '').trim();
  const currentValueRaw = formData.get('current_value') as string;
  const costBasisRaw = formData.get('cost_basis') as string;
  const interestRateRaw = ((formData.get('interest_rate') as string) || '').trim();
  const maturityDate = ((formData.get('maturity_date') as string) || '').trim();
  const currency = ((formData.get('currency') as string) || 'VND').trim();
  const purpose = ((formData.get('purpose') as string) || 'liquidity_reserve') as AssetPurpose;
  const notesRaw = ((formData.get('notes') as string) || '').trim();

  const currentValue = parseFloat(currentValueRaw) || 0;
  const costBasis = costBasisRaw ? parseFloat(costBasisRaw) : null;

  const assetClass: AssetClass =
    accountType === 'Fund' || accountType === 'ETF' ? 'funds' : 'cash';

  const metaLines: string[] = [`Type: ${accountType}`];
  if (institution) metaLines.push(`Institution: ${institution}`);
  if (interestRateRaw) metaLines.push(`Rate: ${interestRateRaw}%`);
  if (maturityDate) metaLines.push(`Maturity: ${maturityDate}`);
  const notes = [metaLines.join(' · '), notesRaw].filter(Boolean).join('\n') || null;

  const now = new Date().toISOString();

  await db.insert(assets).values({
    name,
    asset_class: assetClass,
    purpose,
    current_value: currentValue,
    currency,
    cost_basis: costBasis,
    notes,
    include_in_investment_net_worth: true,
    include_in_total_net_worth: true,
    created_at: now,
    updated_at: now,
  });

  revalidatePath('/cash-funds');
  revalidatePath('/holdings');
  revalidatePath('/');
  redirect('/cash-funds');
}
