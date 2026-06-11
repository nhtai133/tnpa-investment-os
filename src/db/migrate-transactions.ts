import { createClient } from '@libsql/client';

async function run() {
  const client = createClient({ url: 'file:tnpa-investment.db' });
  await client.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER REFERENCES assets(id),
      type TEXT NOT NULL,
      transaction_date TEXT NOT NULL,
      quantity REAL,
      price REAL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      fees REAL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  console.log('transactions table ready');
  process.exit(0);
}

run();
