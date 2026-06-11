export const APP_VERSION = 'v1.1';
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'TNPA Investment OS';
export const APP_ENV = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development';
export const DATABASE_URL = process.env.DATABASE_URL ?? 'file:tnpa-investment.db';

export function isLocalDb(): boolean {
  return DATABASE_URL.startsWith('file:');
}

export function dbMode(): string {
  return isLocalDb() ? 'SQLite (local file)' : 'LibSQL / Turso (remote)';
}
