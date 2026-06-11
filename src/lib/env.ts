export const APP_VERSION = 'v1.6';
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'TNPA Investment OS';
export const APP_ENV = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'local';

// Connection resolution: Turso → DATABASE_URL → local SQLite fallback
export const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL ?? '';
export const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN ?? '';
export const DATABASE_URL = process.env.DATABASE_URL ?? 'file:tnpa-investment.db';

export const EFFECTIVE_DB_URL: string =
  TURSO_DATABASE_URL || DATABASE_URL || 'file:tnpa-investment.db';

export const EFFECTIVE_AUTH_TOKEN: string | undefined =
  TURSO_AUTH_TOKEN || undefined;

// --- Mode detection ---

export type DbMode = 'local' | 'turso' | 'custom';

export function resolveDbMode(): DbMode {
  if (TURSO_DATABASE_URL) return 'turso';
  if (EFFECTIVE_DB_URL.startsWith('file:')) return 'local';
  return 'custom';
}

export function isLocalDb(): boolean {
  return resolveDbMode() === 'local';
}

export function dbMode(): string {
  const mode = resolveDbMode();
  if (mode === 'turso') return 'Turso Cloud';
  if (mode === 'local') return 'SQLite (local file)';
  return 'Custom libSQL';
}

export function deployReadiness(): string {
  return isLocalDb() ? 'Local-only' : 'Cloud-ready';
}

export function hasAuthToken(): boolean {
  return !!EFFECTIVE_AUTH_TOKEN;
}

// Mask remote URLs — strip query params that may contain credentials.
// Local file paths are shown as-is.
export function maskedDbUrl(): string {
  if (isLocalDb()) return EFFECTIVE_DB_URL;
  try {
    const u = new URL(EFFECTIVE_DB_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    return EFFECTIVE_DB_URL.split('?')[0];
  }
}
