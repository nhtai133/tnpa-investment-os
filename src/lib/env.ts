import { resolveLocalDatabaseUrl, TNPA_ENV } from './local-paths';
export const APP_VERSION = 'v2.1.5.1';
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'TNPA Wealth OS';
export const APP_ENV = TNPA_ENV;
export const EFFECTIVE_DB_URL = resolveLocalDatabaseUrl();
export const DATABASE_URL = EFFECTIVE_DB_URL;
// Legacy compatibility names; remote configuration is rejected above.
export const TURSO_DATABASE_URL = '';
export const TURSO_AUTH_TOKEN = '';
export const EFFECTIVE_AUTH_TOKEN = undefined;
export function resolveDbMode(): 'local' | 'turso' | 'custom' { return 'local'; }
export function isLocalDb() { return true; }
export function dbMode() { return 'SQLite / libSQL (local only)'; }
export function deployReadiness() { return 'Private Mac only'; }
export function hasAuthToken() { return false; }
export function maskedDbUrl() { return EFFECTIVE_DB_URL; }
