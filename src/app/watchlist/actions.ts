'use server';

import { db } from '@/db';
import { watchlistItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AssetClass, ConvictionLevel } from '@/db/schema';

function now() {
  return new Date().toISOString();
}

function parseWatchlistForm(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key);
    return v && typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
  };
  const scoreRaw = formData.get('conviction_score');
  const score =
    scoreRaw && String(scoreRaw).trim() !== ''
      ? Math.min(10, Math.max(1, parseInt(String(scoreRaw), 10)))
      : null;
  const raw_class = formData.get('asset_class') as string | null;
  const raw_priority = str('priority');
  return {
    name: (formData.get('name') as string).trim(),
    symbol: str('symbol'),
    asset_class: (raw_class && raw_class !== '' ? raw_class : null) as AssetClass | null,
    note: str('note'),
    review_date: str('review_date'),
    alert_flag: formData.get('alert_flag') === 'on',
    conviction_score: isNaN(score as number) ? null : score,
    conviction_rationale: str('conviction_rationale'),
    target_entry: str('target_entry'),
    thesis: str('thesis'),
    next_action: str('next_action'),
    priority: raw_priority as ConvictionLevel | null,
    fair_value: str('fair_value'),
    current_price: str('current_price'),
    currency: str('currency') ?? 'USD',
  };
}

export async function createWatchlistItem(formData: FormData) {
  const data = parseWatchlistForm(formData);
  const ts = now();
  await db.insert(watchlistItems).values({ ...data, status: 'active', created_at: ts, updated_at: ts });
  revalidatePath('/watchlist');
  redirect('/watchlist');
}

export async function updateWatchlistItem(id: number, formData: FormData) {
  const data = parseWatchlistForm(formData);
  const statusRaw = formData.get('status') as string | null;
  const status = statusRaw && statusRaw !== '' ? statusRaw as 'active' | 'archived' | 'promoted' | 'rejected' : undefined;
  await db
    .update(watchlistItems)
    .set({ ...data, ...(status ? { status } : {}), updated_at: now() })
    .where(eq(watchlistItems.id, id));
  revalidatePath('/watchlist');
  redirect('/watchlist');
}

export async function archiveWatchlistItem(id: number) {
  await db.update(watchlistItems).set({ status: 'archived', updated_at: now() }).where(eq(watchlistItems.id, id));
  revalidatePath('/watchlist');
}
