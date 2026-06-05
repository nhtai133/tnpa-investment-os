'use server';

import { db } from '@/db';
import { opportunities, assets, decisionLogs, watchlistItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { OpportunitySource, AssetClass } from '@/db/schema';

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function parseOpportunityForm(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key);
    return v && typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
  };
  const raw_class = formData.get('asset_class') as string | null;
  return {
    name: (formData.get('name') as string).trim(),
    symbol: str('symbol'),
    asset_class: (raw_class && raw_class !== '' ? raw_class : null) as AssetClass | null,
    source: (formData.get('source') as OpportunitySource) ?? 'manual',
    raw_note: str('raw_note'),
    parsed_thesis: str('parsed_thesis'),
  };
}

export async function createOpportunity(formData: FormData) {
  const data = parseOpportunityForm(formData);
  const ts = now();
  const [inserted] = await db
    .insert(opportunities)
    .values({ ...data, status: 'new', created_at: ts, updated_at: ts })
    .returning({ id: opportunities.id });
  revalidatePath('/pipeline');
  redirect(`/opportunities/${inserted.id}`);
}

export async function updateOpportunity(id: number, formData: FormData) {
  const data = parseOpportunityForm(formData);
  await db.update(opportunities).set({ ...data, updated_at: now() }).where(eq(opportunities.id, id));
  revalidatePath('/pipeline');
  revalidatePath(`/opportunities/${id}`);
  redirect(`/opportunities/${id}`);
}

export async function setOpportunityStatus(
  id: number,
  status: 'new' | 'reviewing' | 'promoted' | 'rejected',
) {
  await db.update(opportunities).set({ status, updated_at: now() }).where(eq(opportunities.id, id));
  revalidatePath('/pipeline');
  revalidatePath(`/opportunities/${id}`);
}

export async function addOpportunityToWatchlist(id: number) {
  const opp = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!opp) throw new Error('Opportunity not found');

  const ts = now();
  const [inserted] = await db
    .insert(watchlistItems)
    .values({
      name: opp.name,
      symbol: opp.symbol,
      asset_class: opp.asset_class ?? undefined,
      note: opp.parsed_thesis ?? opp.raw_note ?? undefined,
      thesis: opp.parsed_thesis ?? undefined,
      opportunity_id: opp.id,
      status: 'active',
      alert_flag: false,
      created_at: ts,
      updated_at: ts,
    })
    .returning({ id: watchlistItems.id });

  // Link watchlist back to opportunity (plain int, no FK constraint)
  await db
    .update(opportunities)
    .set({ watchlist_id: inserted.id, status: 'reviewing', updated_at: now() })
    .where(eq(opportunities.id, id));

  revalidatePath('/pipeline');
  revalidatePath('/watchlist');
  redirect('/watchlist');
}

export async function promoteOpportunityToHolding(id: number) {
  const opp = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!opp) throw new Error('Opportunity not found');

  const ts = now();
  const assetClass = opp.asset_class ?? 'other';

  const [newAsset] = await db
    .insert(assets)
    .values({
      name: opp.name,
      symbol: opp.symbol,
      asset_class: assetClass,
      purpose: 'wealth_compounder',
      current_value: 0,
      currency: 'USD',
      include_in_investment_net_worth: assetClass !== 'other',
      include_in_total_net_worth: true,
      notes: opp.parsed_thesis ?? opp.raw_note ?? null,
      created_at: ts,
      updated_at: ts,
    })
    .returning({ id: assets.id });

  await db.insert(decisionLogs).values({
    asset_id: newAsset.id,
    asset_name: opp.name,
    asset_class: assetClass,
    decision_type: 'buy',
    rationale: opp.parsed_thesis ?? opp.raw_note ?? 'Promoted from opportunity pipeline',
    decision_date: today(),
    created_at: ts,
  });

  await db
    .update(opportunities)
    .set({ status: 'promoted', updated_at: now() })
    .where(eq(opportunities.id, id));

  revalidatePath('/holdings');
  revalidatePath('/pipeline');
  revalidatePath('/');
  redirect(`/holdings/${newAsset.id}`);
}
