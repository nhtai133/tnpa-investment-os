import { createClient } from '@libsql/client';

async function run() {
  const client = createClient({ url: 'file:tnpa-investment.db' });

  const alters = [
    `ALTER TABLE decision_logs ADD COLUMN title TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN purpose TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN expected_return TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN time_horizon TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN risks TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN invalidation_conditions TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN confidence INTEGER`,
    `ALTER TABLE decision_logs ADD COLUMN extended_notes TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN transaction_id INTEGER`,
    `ALTER TABLE decision_logs ADD COLUMN is_reviewed INTEGER NOT NULL DEFAULT 0`,
  ];

  for (const sql of alters) {
    try {
      await client.execute(sql);
      console.log(`OK: ${sql.slice(0, 70)}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('duplicate column')) {
        console.log(`SKIP (exists): ${sql.slice(0, 70)}`);
      } else {
        throw e;
      }
    }
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS decision_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      decision_id INTEGER NOT NULL REFERENCES decision_logs(id),
      review_date TEXT NOT NULL,
      outcome TEXT NOT NULL,
      current_result TEXT,
      thesis_still_valid INTEGER,
      lessons_learned TEXT,
      next_action TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  console.log('decision_reviews table ready');
  process.exit(0);
}

run();
