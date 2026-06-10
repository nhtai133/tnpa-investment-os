import { createClient } from '@libsql/client';

async function run() {
  const client = createClient({ url: 'file:tnpa-investment.db' });
  await client.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await client.execute(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES ('usd_vnd_rate', '25500', datetime('now'))
  `);
  console.log('app_settings table ready with default usd_vnd_rate = 25500');
  process.exit(0);
}

run();
