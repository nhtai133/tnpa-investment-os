import { createClient } from '@libsql/client';

async function run() {
  const client = createClient({ url: 'file:tnpa-investment.db' });

  const cols = [
    `ALTER TABLE research_notes ADD COLUMN title TEXT`,
    `ALTER TABLE research_notes ADD COLUMN symbol TEXT`,
    `ALTER TABLE research_notes ADD COLUMN asset_class TEXT`,
    `ALTER TABLE research_notes ADD COLUMN thesis TEXT`,
    `ALTER TABLE research_notes ADD COLUMN valuation_notes TEXT`,
    `ALTER TABLE research_notes ADD COLUMN risk_notes TEXT`,
    `ALTER TABLE research_notes ADD COLUMN action_plan TEXT`,
    `ALTER TABLE research_notes ADD COLUMN conviction TEXT`,
    `ALTER TABLE research_notes ADD COLUMN research_status TEXT DEFAULT 'active'`,
  ];

  for (const sql of cols) {
    try {
      await client.execute(sql);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('duplicate column')) continue;
      throw e;
    }
  }

  console.log('research_notes v1.0 columns ready');
  process.exit(0);
}

run();
