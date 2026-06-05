'use server';

import { db } from '@/db';
import { assetIntelligence } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function now() {
  return new Date().toISOString();
}

function parseIntelligenceForm(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key);
    return v && typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
  };
  return {
    investment_thesis: str('investment_thesis'),
    risk_notes: str('risk_notes'),
    buy_zone: str('buy_zone'),
    sell_zone: str('sell_zone'),
    accumulation_plan: str('accumulation_plan'),
    exit_plan: str('exit_plan'),
    review_cadence: str('review_cadence'),
    next_review_date: str('next_review_date'),
    dividend_notes: str('dividend_notes'),
    valuation_notes: str('valuation_notes'),
    cycle_thesis: str('cycle_thesis'),
    dca_plan: str('dca_plan'),
    legal_status: str('legal_status'),
    yield_notes: str('yield_notes'),
    loan_terms: str('loan_terms'),
    counterparty_notes: str('counterparty_notes'),
  };
}

export async function createIntelligence(assetId: number, formData: FormData) {
  const fields = parseIntelligenceForm(formData);
  const ts = now();
  await db.insert(assetIntelligence).values({
    asset_id: assetId,
    ...fields,
    created_at: ts,
    updated_at: ts,
  });
  revalidatePath(`/holdings/${assetId}`);
  redirect(`/holdings/${assetId}`);
}

export async function updateIntelligence(id: number, assetId: number, formData: FormData) {
  const fields = parseIntelligenceForm(formData);
  await db.update(assetIntelligence).set({ ...fields, updated_at: now() }).where(eq(assetIntelligence.id, id));
  revalidatePath(`/holdings/${assetId}`);
  redirect(`/holdings/${assetId}`);
}
