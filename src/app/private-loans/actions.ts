'use server';

import { db } from '@/db';
import { assets } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AssetPurpose } from '@/db/schema';

export async function createPrivateLoanAsset(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const currentValueRaw = formData.get('current_value') as string;
  const costBasisRaw = formData.get('cost_basis') as string;
  const interestRateRaw = ((formData.get('interest_rate') as string) || '').trim();
  const startDate = ((formData.get('start_date') as string) || '').trim();
  const dueDate = ((formData.get('due_date') as string) || '').trim();
  const currency = ((formData.get('currency') as string) || 'VND').trim();
  const purpose = ((formData.get('purpose') as string) || 'income_generator') as AssetPurpose;
  const notesRaw = ((formData.get('notes') as string) || '').trim();

  const currentValue = parseFloat(currentValueRaw) || 0;
  const costBasis = costBasisRaw ? parseFloat(costBasisRaw) : null;

  const metaLines: string[] = [];
  if (costBasis !== null) metaLines.push(`Principal: ${costBasis.toLocaleString('vi-VN')}`);
  if (interestRateRaw) metaLines.push(`Rate: ${interestRateRaw}% p.a.`);
  if (startDate) metaLines.push(`Start: ${startDate}`);
  if (dueDate) metaLines.push(`Due: ${dueDate}`);
  const notes = [metaLines.join(' · '), notesRaw].filter(Boolean).join('\n') || null;

  const now = new Date().toISOString();

  await db.insert(assets).values({
    name,
    asset_class: 'private_loan',
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

  revalidatePath('/private-loans');
  revalidatePath('/holdings');
  revalidatePath('/');
  redirect('/private-loans');
}
