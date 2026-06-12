import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  assets,
  appSettings,
  assetIntelligence,
  decisionLogs,
  decisionReviews,
  watchlistItems,
  opportunities,
  researchNotes,
  transactions,
  wealthSnapshots,
  accountRegistry,
  ledgerEntries,
  assetCustodyPositions,
} from '@/db/schema';

export async function GET() {
  const [
    assetsData,
    settingsData,
    intelligenceData,
    decisionsData,
    reviewsData,
    watchlistData,
    opportunitiesData,
    notesData,
    transactionsData,
    snapshotsData,
    accountData,
    ledgerData,
    custodyData,
  ] = await Promise.all([
    db.select().from(assets),
    db.select().from(appSettings),
    db.select().from(assetIntelligence),
    db.select().from(decisionLogs),
    db.select().from(decisionReviews),
    db.select().from(watchlistItems),
    db.select().from(opportunities),
    db.select().from(researchNotes),
    db.select().from(transactions),
    db.select().from(wealthSnapshots),
    db.select().from(accountRegistry),
    db.select().from(ledgerEntries),
    db.select().from(assetCustodyPositions),
  ]);

  const activeCount = assetsData.filter((a) => !a.is_archived).length;
  const archivedCount = assetsData.filter((a) => a.is_archived).length;

  const backup = {
    app: 'TNPA Investment OS',
    backup_version: 5,
    exported_at: new Date().toISOString(),
    asset_count: activeCount,
    archived_asset_count: archivedCount,
    assets: assetsData,
    app_settings: settingsData,
    asset_intelligence: intelligenceData,
    decision_logs: decisionsData,
    decision_reviews: reviewsData,
    watchlist_items: watchlistData,
    opportunities: opportunitiesData,
    research_notes: notesData,
    transactions: transactionsData,
    wealth_snapshots: snapshotsData,
    account_registry: accountData,
    ledger_entries: ledgerData,
    asset_custody_positions: custodyData,
  };

  const date = new Date().toISOString().split('T')[0];

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="tnpa-investment-os-backup-${date}.json"`,
    },
  });
}
