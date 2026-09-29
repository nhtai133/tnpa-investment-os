import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { existsSync, lstatSync, mkdirSync, chmodSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

export type RuntimeEnvironment = 'development' | 'production';
function selectedEnvironment(env: NodeJS.ProcessEnv = process.env): RuntimeEnvironment {
  if (env.TNPA_ENV !== 'development' && env.TNPA_ENV !== 'production') throw new Error('TNPA_ENV must explicitly be development or production.');
  return env.TNPA_ENV;
}
export function dataRootFor(env: RuntimeEnvironment, home = homedir()) {
  return join(home, env === 'development' ? '.tnpa-wealth-os-dev' : '.tnpa-wealth-os');
}
export const TNPA_ENV = selectedEnvironment();
export const PRIVATE_ROOT = dataRootFor(TNPA_ENV);
if (process.env.TNPA_DATA_ROOT !== undefined && resolve(process.env.TNPA_DATA_ROOT) !== resolve(PRIVATE_ROOT)) {
  throw new Error(`TNPA_DATA_ROOT does not match ${TNPA_ENV}; refusing cross-environment data access.`);
}
export const DATABASE_PATH = join(PRIVATE_ROOT, 'database', 'wealth.db');
export const PRIVATE_DIRS = ['database', 'snapshots', 'exports', 'backups', 'logs'] as const;

export function resolveLocalDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const environment = selectedEnvironment(env);
  const root = dataRootFor(environment);
  if (env.TNPA_DATA_ROOT !== undefined && resolve(env.TNPA_DATA_ROOT) !== resolve(root)) throw new Error('TNPA_DATA_ROOT is invalid for TNPA_ENV.');
  if (env.TURSO_DATABASE_URL || env.TURSO_AUTH_TOKEN) throw new Error('Legacy Turso configuration is disabled. Unset TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
  const path = join(root, 'database', 'wealth.db');
  const canonical = pathToFileURL(path).href;
  if (env.DATABASE_URL !== undefined) {
    try {
      const u = new URL(env.DATABASE_URL);
      if (u.protocol !== 'file:' || u.host || u.search || u.hash || !env.DATABASE_URL.startsWith('file:/') || fileURLToPath(u) !== path) throw new Error();
    } catch { throw new Error(`DATABASE_URL must identify the ${environment} database at ${path}. No fallback is permitted.`); }
  }
  assertPrivatePath(path, root);
  return canonical;
}
export function assertPrivatePath(path: string, root = PRIVATE_ROOT) {
  const absolute = resolve(path);
  const privateRoot = resolve(root);
  if (!absolute.startsWith(privateRoot + '/') && absolute !== privateRoot) throw new Error('Path outside the selected private data root.');
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
  if (!existsSync(DATABASE_PATH) || lstatSync(DATABASE_PATH).size === 0) throw new Error(`The ${TNPA_ENV} database is missing. Run the explicit initializer for that environment.`);
}
