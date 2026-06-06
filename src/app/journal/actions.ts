'use server';

import { db } from '@/db';
import { researchNotes, decisionLogs, assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ResearchNoteType } from '@/db/schema';

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ─── Research Notes ────────────────────────────────────────────────

export async function createResearchNote(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key);
    return v && typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
  };

  const asset_id_raw = formData.get('asset_id');
  const opportunity_id_raw = formData.get('opportunity_id');
  const asset_id = asset_id_raw ? Number(asset_id_raw) : null;
  const opportunity_id = opportunity_id_raw ? Number(opportunity_id_raw) : null;
  const redirectTo = str('redirect_to') ?? (asset_id ? `/holdings/${asset_id}` : '/journal');

  const ts = now();
  await db.insert(researchNotes).values({
    asset_id: asset_id ?? undefined,
    opportunity_id: opportunity_id ?? undefined,
    note_type: (str('note_type') ?? 'research') as ResearchNoteType,
    body: str('body') ?? '',
    source_url: str('source_url'),
    source_label: str('source_label'),
    created_at: ts,
    updated_at: ts,
  });

  if (asset_id) {
    revalidatePath(`/holdings/${asset_id}`);
    revalidatePath(`/holdings/${asset_id}/notes`);
  }
  if (opportunity_id) {
    revalidatePath(`/opportunities/${opportunity_id}`);
  }
  revalidatePath('/journal');
  redirect(redirectTo);
}

// ─── Decision Log ──────────────────────────────────────────────────

export async function createDecisionLog(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key);
    return v && typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
  };

  const asset_id = Number(formData.get('asset_id'));
  const redirectTo = str('redirect_to') ?? `/holdings/${asset_id}`;

  // Look up asset_name and asset_class
  const asset = await db.select().from(assets).where(eq(assets.id, asset_id)).limit(1).then((r) => r[0]);
  if (!asset) throw new Error('Asset not found');

  const amount_raw = str('amount');
  const amount = amount_raw ? parseFloat(amount_raw) : null;

  await db.insert(decisionLogs).values({
    asset_id,
    asset_name: asset.name,
    asset_class: asset.asset_class,
    decision_type: str('decision_type') as 'buy' | 'sell' | 'hold' | 'trim' | 'add' | 'reduce' | 'reject' | 'monitor' | 'review',
    rationale: str('rationale') ?? '',
    amount: isNaN(amount as number) ? null : amount,
    decision_date: str('decision_date') ?? today(),
    created_at: now(),
  });

  revalidatePath(`/holdings/${asset_id}`);
  revalidatePath(`/holdings/${asset_id}/decisions`);
  revalidatePath('/decisions');
  revalidatePath('/journal');
  revalidatePath('/');
  redirect(redirectTo);
}
