import { createClient } from '@libsql/client';

async function run() {
  const client = createClient({ url: 'file:tnpa-investment.db' });

  const alters = [
    `ALTER TABLE decision_logs ADD COLUMN next_review_date TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN review_cadence TEXT`,
    `ALTER TABLE watchlist_items ADD COLUMN review_cadence TEXT`,
  ];

  for (const sql of alters) {
    try {
      await client.execute(sql);
      console.log(`OK: ${sql.slice(0, 80)}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('duplicate column')) {
        console.log(`SKIP (exists): ${sql.slice(0, 80)}`);
      } else {
        throw e;
      }
    }
  }

  console.log('Calendar migration complete.');
  process.exit(0);
}

run();
