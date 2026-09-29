import { createClient } from '@libsql/client/sqlite3';
import { chmodSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { TABLE_NAMES, savePrivateFile } from '../src/lib/backup';
import { DATABASE_PATH, PRIVATE_ROOT, TNPA_ENV, ensurePrivateDirectories, requireInitializedDatabase } from '../src/lib/local-paths';

async function main() {
  if (TNPA_ENV !== 'production' || DATABASE_PATH.includes('.tnpa-wealth-os-dev')) throw new Error('Production backup requires the explicit production environment.');
  ensurePrivateDirectories();
  requireInitializedDatabase();
  const client = createClient({ url: `file:${DATABASE_PATH}` });
  const target = join(PRIVATE_ROOT, 'backups', `pre-deploy-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.db`);
  try {
    const integrity = await client.execute('PRAGMA integrity_check');
    if (integrity.rows[0]?.integrity_check !== 'ok') throw new Error('Production database integrity check failed; deployment stopped.');
    for (const table of TABLE_NAMES) await client.execute(`SELECT COUNT(*) FROM "${table}"`);
    await client.execute({ sql: 'VACUUM INTO ?', args: [target] });
    chmodSync(target, 0o600);
    const backup = createClient({ url: `file:${target}` });
    try {
      const checked = await backup.execute('PRAGMA integrity_check');
      if (checked.rows[0]?.integrity_check !== 'ok') throw new Error('Production backup verification failed.');
      for (const table of TABLE_NAMES) await backup.execute(`SELECT COUNT(*) FROM "${table}"`);
    } finally { backup.close(); }
    console.log(`Verified production backup: ${target}`);
  } finally { client.close(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Production backup failed'); process.exitCode = 1; });
