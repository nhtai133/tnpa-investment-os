import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  assets,
  appSettings,
  decisionLogs,
  watchlistItems,
  opportunities,
  researchNotes,
} from '@/db/schema';

export async function GET() {
  const [
    assetsData,
    settingsData,
    decisionsData,
    watchlistData,
    opportunitiesData,
    notesData,
  ] = await Promise.all([
    db.select().from(assets),
    db.select().from(appSettings),
    db.select().from(decisionLogs),
    db.select().from(watchlistItems),
    db.select().from(opportunities),
    db.select().from(researchNotes),
  ]);

  const activeCount = assetsData.filter((a) => !a.is_archived).length;
  const archivedCount = assetsData.filter((a) => a.is_archived).length;

  const backup = {
    app: 'TNPA Investment OS',
    backup_version: 1,
    exported_at: new Date().toISOString(),
    asset_count: activeCount,
    archived_asset_count: archivedCount,
    assets: assetsData,
    app_settings: settingsData,
    decision_logs: decisionsData,
    watchlist_items: watchlistData,
    opportunities: opportunitiesData,
    research_notes: notesData,
  };

  const date = new Date().toISOString().split('T')[0];

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="tnpa-investment-os-backup-${date}.json"`,
    },
  });
}
