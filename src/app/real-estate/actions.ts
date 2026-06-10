'use server';

import { db } from '@/db';
import { assets } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AssetPurpose } from '@/db/schema';

export async function createRealEstateAsset(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const propertyLocation = ((formData.get('property_location') as string) || '').trim();
  const currentValueRaw = formData.get('current_value') as string;
  const costBasisRaw = formData.get('cost_basis') as string;
  const ownershipPctRaw = ((formData.get('ownership_pct') as string) || '').trim();
  const rentalIncomeRaw = ((formData.get('rental_income') as string) || '').trim();
  const loanBalanceRaw = ((formData.get('loan_balance') as string) || '').trim();
  const purpose = ((formData.get('purpose') as string) || 'store_of_value') as AssetPurpose;
  const notesRaw = ((formData.get('notes') as string) || '').trim();

  const currentValue = parseFloat(currentValueRaw) || 0;
  const costBasis = costBasisRaw ? parseFloat(costBasisRaw) : null;

  const metaLines: string[] = [];
  if (propertyLocation) metaLines.push(`Location: ${propertyLocation}`);
  if (ownershipPctRaw) metaLines.push(`Ownership: ${ownershipPctRaw}%`);
  if (rentalIncomeRaw) {
    const ri = parseFloat(rentalIncomeRaw);
    if (ri > 0) metaLines.push(`Rental: ${ri.toLocaleString('vi-VN')} VND/mo`);
  }
  if (loanBalanceRaw) {
    const lb = parseFloat(loanBalanceRaw);
    if (lb > 0) metaLines.push(`Loan balance: ${lb.toLocaleString('vi-VN')} VND`);
  }
  const notes = [metaLines.join(' · '), notesRaw].filter(Boolean).join('\n') || null;

  const now = new Date().toISOString();

  await db.insert(assets).values({
    name,
    asset_class: 'real_estate',
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

  revalidatePath('/real-estate');
  revalidatePath('/holdings');
  revalidatePath('/');
  redirect('/real-estate');
}
