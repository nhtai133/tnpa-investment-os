import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { existsSync, lstatSync, mkdirSync, chmodSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
export const PRIVATE_ROOT = join(homedir(), '.tnpa-wealth-os');
export const DATABASE_PATH = join(PRIVATE_ROOT, 'database', 'wealth.db');
export const PRIVATE_DIRS = ['database', 'snapshots', 'exports', 'backups', 'logs'] as const;
export function resolveLocalDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.TURSO_DATABASE_URL || env.TURSO_AUTH_TOKEN) throw new Error('Legacy Turso configuration is disabled. Unset TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
  const canonical = pathToFileURL(DATABASE_PATH).href;
  if (env.DATABASE_URL !== undefined) {
    try {
      const u = new URL(env.DATABASE_URL);
      if (u.protocol !== 'file:' || u.host || u.search || u.hash || !env.DATABASE_URL.startsWith('file:/') || fileURLToPath(u) !== DATABASE_PATH) throw new Error();
    } catch { throw new Error('DATABASE_URL must be the absolute local file URL for ~/.tnpa-wealth-os/database/wealth.db. No fallback is permitted.'); }
  }
  assertPrivatePath(DATABASE_PATH);
  return canonical;
}
export function assertPrivatePath(path: string) {
  const absolute = resolve(path);
  if (!absolute.startsWith(PRIVATE_ROOT + '/') && absolute !== PRIVATE_ROOT) throw new Error('Path outside private data root.');
  let current = absolute;
  while (current !== dirname(current)) {
    try { if (lstatSync(current).isSymbolicLink()) throw new Error('Symlinks are not permitted in private data paths.'); }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
    current = dirname(current);
  }
}
export function ensurePrivateDirectories() {
  assertPrivatePath(DATABASE_PATH);
  for (const path of [PRIVATE_ROOT, ...PRIVATE_DIRS.map((dir) => join(PRIVATE_ROOT, dir))]) {
    mkdirSync(path, { recursive: true, mode: 0o700 }); chmodSync(path, 0o700);
  }
}
export function requireInitializedDatabase() {
  assertPrivatePath(DATABASE_PATH);
  if (!existsSync(DATABASE_PATH) || lstatSync(DATABASE_PATH).size === 0) throw new Error('Local database missing. Run npm run db:init-local first.');
}
