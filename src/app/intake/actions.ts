'use server';

import { db } from '@/db';
import { opportunities } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { parseRawNote } from '@/lib/parser';
import type { OpportunitySource, AssetClass } from '@/db/schema';

function now() {
  return new Date().toISOString();
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return v && typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

export async function createIntake(formData: FormData) {
  const raw_note = str(formData, 'raw_note') ?? '';
  const source = (str(formData, 'source') ?? 'manual') as OpportunitySource;
  const hint_symbol = str(formData, 'symbol');
  const hint_class = (str(formData, 'asset_class') ?? null) as AssetClass | null;
  const hint_name = str(formData, 'name');
  const hint_thesis = str(formData, 'parsed_thesis');

  const parsed = parseRawNote(raw_note, { symbol: hint_symbol, asset_class: hint_class });

  const symbol = hint_symbol ?? parsed.symbol;
  const asset_class = hint_class ?? parsed.asset_class;
  const parsed_thesis = hint_thesis ?? parsed.parsed_thesis;
  // Derive name: explicit > symbol > first 60 chars of raw_note
  const name =
    hint_name ??
    (symbol ? symbol : null) ??
    raw_note.slice(0, 60).replace(/\s+/g, ' ').trim();

  const ts = now();
  const [row] = await db
    .insert(opportunities)
    .values({
      name,
      symbol: symbol ?? undefined,
      asset_class: asset_class ?? undefined,
      source,
      raw_note: raw_note || undefined,
      parsed_thesis: parsed_thesis || undefined,
      status: 'new',
      created_at: ts,
      updated_at: ts,
    })
    .returning({ id: opportunities.id });

  revalidatePath('/intake');
  revalidatePath('/pipeline');
  redirect(`/opportunities/${row.id}`);
}
