'use server';

import { db } from '@/db';
import { researchNotes } from '@/db/schema';
import type { AssetClass, ConvictionLevel, ResearchStatus, ResearchNoteType } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function now() {
  return new Date().toISOString();
}

function parseForm(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key);
    return v && typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
  };
  const assetIdRaw = formData.get('asset_id');
  const asset_id =
    assetIdRaw && String(assetIdRaw).trim() !== '' ? Number(assetIdRaw) : undefined;

  return {
    asset_id,
    title: str('title'),
    symbol: str('symbol'),
    asset_class: str('asset_class') as AssetClass | null,
    note_type: (str('note_type') ?? 'research') as ResearchNoteType,
    thesis: str('thesis'),
    valuation_notes: str('valuation_notes'),
    risk_notes: str('risk_notes'),
    action_plan: str('action_plan'),
    body: str('body') ?? '',
    conviction: str('conviction') as ConvictionLevel | null,
    research_status: (str('research_status') ?? 'active') as ResearchStatus,
    source_url: str('source_url'),
    source_label: str('source_label'),
  };
}

export async function createResearchNote(formData: FormData) {
  const data = parseForm(formData);
  const ts = now();
  const [inserted] = await db
    .insert(researchNotes)
    .values({ ...data, created_at: ts, updated_at: ts })
    .returning({ id: researchNotes.id });

  revalidatePath('/research');
  revalidatePath('/journal');
  redirect(`/research/${inserted.id}`);
}

export async function updateResearchNote(id: number, formData: FormData) {
  const data = parseForm(formData);
  await db
    .update(researchNotes)
    .set({ ...data, updated_at: now() })
    .where(eq(researchNotes.id, id));

  revalidatePath('/research');
  revalidatePath('/journal');
  redirect(`/research/${id}`);
}

export async function archiveResearchNote(id: number) {
  await db
    .update(researchNotes)
    .set({ research_status: 'archived', updated_at: now() })
    .where(eq(researchNotes.id, id));

  revalidatePath('/research');
}

export async function unarchiveResearchNote(id: number) {
  await db
    .update(researchNotes)
    .set({ research_status: 'active', updated_at: now() })
    .where(eq(researchNotes.id, id));

  revalidatePath('/research');
}
