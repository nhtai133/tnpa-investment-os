'use server';

import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function parseAssetFormData(formData: FormData) {
  const asset_class = formData.get('asset_class') as string;
  return {
    name: (formData.get('name') as string).trim(),
    symbol: ((formData.get('symbol') as string) || '').trim() || null,
    asset_class: asset_class as 'stock' | 'crypto' | 'real_estate' | 'gold' | 'cash' | 'funds' | 'private_loan' | 'other',
    purpose: formData.get('purpose') as
      | 'wealth_compounder'
      | 'income_generator'
      | 'liquidity_reserve'
      | 'opportunity_capital'
      | 'store_of_value'
      | 'strategic_asset',
    current_value: parseFloat(formData.get('current_value') as string),
    currency: ((formData.get('currency') as string) || 'USD').trim(),
    quantity: formData.get('quantity') ? parseFloat(formData.get('quantity') as string) : null,
    cost_basis: formData.get('cost_basis') ? parseFloat(formData.get('cost_basis') as string) : null,
    notes: ((formData.get('notes') as string) || '').trim() || null,
    include_in_investment_net_worth: asset_class !== 'other',
    include_in_total_net_worth: true as const,
  };
}

export async function createAsset(formData: FormData) {
  const data = parseAssetFormData(formData);
  const now = new Date().toISOString();

  const [inserted] = await db
    .insert(assets)
    .values({ ...data, created_at: now, updated_at: now })
    .returning({ id: assets.id });

  revalidatePath('/holdings');
  revalidatePath('/');
  redirect(`/holdings/${inserted.id}`);
}

export async function updateAsset(id: number, formData: FormData) {
  const data = parseAssetFormData(formData);
  const now = new Date().toISOString();

  await db
    .update(assets)
    .set({ ...data, updated_at: now })
    .where(eq(assets.id, id));

  revalidatePath('/holdings');
  revalidatePath(`/holdings/${id}`);
  revalidatePath('/');
  redirect(`/holdings/${id}`);
}

export async function archiveAsset(id: number) {
  const now = new Date().toISOString();
  await db
    .update(assets)
    .set({ is_archived: true, updated_at: now })
    .where(eq(assets.id, id));

  revalidatePath('/holdings');
  revalidatePath(`/holdings/${id}`);
  revalidatePath('/crypto');
  revalidatePath('/stocks');
  revalidatePath('/');
  redirect('/holdings');
}
