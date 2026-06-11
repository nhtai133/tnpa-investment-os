import { createClient } from '@libsql/client';
import { EFFECTIVE_DB_URL, EFFECTIVE_AUTH_TOKEN } from '@/lib/env';

const client = createClient({
  url: EFFECTIVE_DB_URL,
  authToken: EFFECTIVE_AUTH_TOKEN,
});

const CREATE_WEALTH_SNAPSHOTS = `
  CREATE TABLE IF NOT EXISTS wealth_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_date TEXT NOT NULL,
    total_net_worth_usd REAL NOT NULL,
    investable_net_worth_usd REAL NOT NULL,
    total_cost_basis_usd REAL,
    total_gain_loss_usd REAL,
    usd_vnd_rate REAL NOT NULL,
    asset_allocation_json TEXT NOT NULL,
    purpose_allocation_json TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

async function migrate() {
  console.log('Running performance migration…');
  await client.execute(CREATE_WEALTH_SNAPSHOTS);
  console.log('✓ wealth_snapshots table ready');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
