import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  assets,
  appSettings,
  decisionLogs,
  decisionReviews,
  watchlistItems,
  opportunities,
  researchNotes,
  transactions,
} from '@/db/schema';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  let backup: Record<string, unknown>;

  try {
    backup = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (backup.app !== 'TNPA Investment OS') {
    return NextResponse.json({ error: 'Invalid backup: wrong app identifier.' }, { status: 400 });
  }
  if (backup.backup_version !== 1 && backup.backup_version !== 2) {
    return NextResponse.json({ error: 'Invalid backup: unsupported version.' }, { status: 400 });
  }
  if (!Array.isArray(backup.assets)) {
    return NextResponse.json({ error: 'Invalid backup: assets array missing.' }, { status: 400 });
  }

  // Delete in reverse FK dependency order
  await db.delete(transactions);
  await db.delete(researchNotes);
  await db.delete(decisionReviews);
  await db.delete(decisionLogs);
  await db.delete(watchlistItems);
  await db.delete(opportunities);
  await db.delete(assets);
  await db.delete(appSettings);

  // Insert in FK dependency order
  if ((backup.assets as unknown[]).length > 0) {
    await db.insert(assets).values(backup.assets as typeof assets.$inferInsert[]);
  }

  if (Array.isArray(backup.app_settings) && backup.app_settings.length > 0) {
    await db.insert(appSettings).values(backup.app_settings as typeof appSettings.$inferInsert[]);
  }

  if (Array.isArray(backup.opportunities) && backup.opportunities.length > 0) {
    await db.insert(opportunities).values(backup.opportunities as typeof opportunities.$inferInsert[]);
  }

  if (Array.isArray(backup.watchlist_items) && backup.watchlist_items.length > 0) {
    await db.insert(watchlistItems).values(backup.watchlist_items as typeof watchlistItems.$inferInsert[]);
  }

  if (Array.isArray(backup.decision_logs) && backup.decision_logs.length > 0) {
    await db.insert(decisionLogs).values(backup.decision_logs as typeof decisionLogs.$inferInsert[]);
  }

  if (Array.isArray(backup.decision_reviews) && backup.decision_reviews.length > 0) {
    await db.insert(decisionReviews).values(backup.decision_reviews as typeof decisionReviews.$inferInsert[]);
  }

  if (Array.isArray(backup.research_notes) && backup.research_notes.length > 0) {
    await db.insert(researchNotes).values(backup.research_notes as typeof researchNotes.$inferInsert[]);
  }

  if (Array.isArray(backup.transactions) && backup.transactions.length > 0) {
    await db.insert(transactions).values(backup.transactions as typeof transactions.$inferInsert[]);
  }

  revalidatePath('/', 'layout');

  return NextResponse.json({ success: true });
}
