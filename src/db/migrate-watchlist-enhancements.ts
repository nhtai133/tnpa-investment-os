import { createClient } from '@libsql/client';

async function run() {
  const client = createClient({ url: 'file:tnpa-investment.db' });

  const cols = [
    `ALTER TABLE watchlist_items ADD COLUMN priority TEXT`,
    `ALTER TABLE watchlist_items ADD COLUMN fair_value TEXT`,
    `ALTER TABLE watchlist_items ADD COLUMN current_price TEXT`,
    `ALTER TABLE watchlist_items ADD COLUMN currency TEXT DEFAULT 'USD'`,
  ];

  for (const sql of cols) {
    try {
      await client.execute(sql);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('duplicate column')) continue;
      throw e;
    }
  }

  console.log('watchlist_items v1.0 columns ready');
  process.exit(0);
}

run();
