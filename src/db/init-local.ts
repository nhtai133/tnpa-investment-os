import { createClient } from '@libsql/client/sqlite3';
import { chmodSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { initializeSchema } from './initialize';
import { DATABASE_PATH, PRIVATE_ROOT, ensurePrivateDirectories, resolveLocalDatabaseUrl } from '../lib/local-paths';

async function main() {
  process.umask(0o077);
  const url = resolveLocalDatabaseUrl();
  ensurePrivateDirectories();
  const existing = existsSync(DATABASE_PATH) && statSync(DATABASE_PATH).size > 0;
  const client = createClient({ url });
  try {
    if (existing) {
      const backup = join(PRIVATE_ROOT, 'backups', `before-schema-${Date.now()}-${randomUUID()}.db`);
      await client.execute({ sql: 'VACUUM INTO ?', args: [backup] });
      chmodSync(backup, 0o600);
      console.log(`Existing data protected at: ${backup}`);
    }
    const result = await initializeSchema(client);
    chmodSync(DATABASE_PATH, 0o600);
    console.log(`Local database: ${DATABASE_PATH}`);
    console.log(`Tables created (${result.created.length}): ${result.created.join(', ') || 'none; already initialized'}`);
    console.log(`Application tables: ${result.tables.length}. Demo records inserted: 0.`);
    for (const table of result.tables) {
      const count = await client.execute(`SELECT COUNT(*) AS count FROM "${table}"`);
      console.log(`${table}: ${count.rows[0].count} records`);
    }
  } finally { client.close(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Initialization failed'); process.exitCode = 1; });
