import { parseSource, validateAssignments, validatePolicy } from './capital-allocation';
import { createClient } from '@libsql/client/sqlite3';
import type { Client, Transaction, InValue } from '@libsql/client';
import { getTableConfig, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { is } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { openSync, writeFileSync, fsyncSync, closeSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import * as schema from '@/db/schema';
import { initializeSchema } from '@/db/initialize';
import { PRIVATE_ROOT, assertPrivatePath, ensurePrivateDirectories } from './local-paths';

export const BACKUP_VERSION = 7;
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
export const TABLE_CONFIGS = (Object.values(schema) as unknown[]).filter((t): t is SQLiteTable => is(t, SQLiteTable)).map(getTableConfig);
export const TABLE_NAMES = TABLE_CONFIGS.map(t => t.name);
export type Backup = { app: string; backup_version: number; exported_at: string; [key: string]: unknown };
const quote = (s: string) => '"' + s.replaceAll('"', '""') + '"';

export async function readBackup(connection: Client | Transaction): Promise<Backup> {
  const backup: Backup = { app: 'TNPA Investment OS', backup_version: BACKUP_VERSION, exported_at: new Date().toISOString() };
  for (const table of TABLE_NAMES) backup[table] = (await connection.execute(`SELECT * FROM ${quote(table)} ORDER BY id`)).rows;
  const assets = backup.assets as { is_archived: number }[];
  backup.asset_count = assets.filter(a => !a.is_archived).length;
  backup.archived_asset_count = assets.filter(a => a.is_archived).length;
  return backup;
}
export async function snapshotBackup(client: Client) {
  const tx = await client.transaction('read');
  try { const backup = await readBackup(tx); await tx.commit(); return backup; }
  catch (e) { await tx.rollback(); throw e; } finally { tx.close(); }
}
export function savePrivateFile(directory: 'exports' | 'backups', prefix: string, contents: string, extension = 'json') {
  ensurePrivateDirectories();
  const file = join(PRIVATE_ROOT, directory, `${prefix}-${Date.now()}-${randomUUID()}.${extension}`);
  assertPrivatePath(file);
  const fd = openSync(file, 'wx', 0o600);
  try { writeFileSync(fd, contents, 'utf8'); fsyncSync(fd); } finally { closeSync(fd); }
  return file;
}

export function validateBackupShape(input: unknown): asserts input is Backup {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Backup must be an object.');
  const b = input as Backup;
  if (b.app !== 'TNPA Investment OS' || b.backup_version !== BACKUP_VERSION) {
    throw new Error('A complete v7 backup is required. Older backups omit capital classification; restore their SQLite backup with its matching release instead.');
  }
  if (typeof b.exported_at !== 'string' || !Number.isFinite(Date.parse(b.exported_at))) throw new Error('Invalid export timestamp.');
  for (const table of TABLE_CONFIGS) {
    const rows = b[table.name];
    if (!Array.isArray(rows)) throw new Error(`Missing table: ${table.name}`);
    const ids = new Set<number>();
    for (const row of rows) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error(`Invalid row in ${table.name}`);
      const value = row as Record<string, unknown>;
      if (Object.keys(value).some(key => !table.columns.some(c => c.name === key))) throw new Error(`Unknown column in ${table.name}`);
      if (!Number.isSafeInteger(value.id) || Number(value.id) <= 0 || ids.has(Number(value.id))) throw new Error(`Invalid/duplicate ID in ${table.name}`);
      ids.add(Number(value.id));
      for (const column of table.columns) {
        const v = value[column.name];
        if (v == null) { if (column.notNull) throw new Error(`Missing ${table.name}.${column.name}`); continue; }
        if (column.dataType === 'boolean') {
          if (![true, false, 0, 1].includes(v as boolean)) throw new Error(`Invalid boolean: ${table.name}.${column.name}`);
        } else if (column.dataType === 'number') {
          if (typeof v !== 'number' || !Number.isFinite(v) || (column.getSQLType() === 'integer' && !Number.isSafeInteger(v))) throw new Error(`Invalid number: ${table.name}.${column.name}`);
        } else if (typeof v !== 'string') throw new Error(`Invalid text: ${table.name}.${column.name}`);
        const allowed = column.enumValues;
        if (allowed?.length && !allowed.includes(String(v))) throw new Error(`Invalid enum: ${table.name}.${column.name}`);
        if (column.name === 'currency' && v !== 'USD' && v !== 'VND') throw new Error('Unsupported currency; only USD and VND have defined conversion.');
      }
    }
  }
  const assetRows = b.assets as Record<string, unknown>[];
  for (const a of assetRows) {
    if ((a.cash_source_type == null) !== (a.cash_source_id == null)) throw new Error('Cash source requires both type and ID.');
    if (a.cash_source_type) {
      const source = { bank_account: 'bank_accounts', deposit: 'bank_savings_deposits', registry: 'account_registry' }[String(a.cash_source_type)];
      if (a.asset_class !== 'cash' || !source || !(b[source] as Record<string, unknown>[]).some(r => r.id === a.cash_source_id)) throw new Error('Invalid cash source reference.');
    }
  }
  const purposes = b.capital_purposes as schema.CapitalPurpose[];
  for (const p of purposes) validatePolicy({ ...p, is_active: Boolean(p.is_active) });
  const groups = new Map<string, schema.CapitalAllocation[]>();
  for (const row of b.capital_allocations as schema.CapitalAllocation[]) {
    const key = `${row.source_type}:${row.source_id}`;
    const source = parseSource(key);
    const table = { asset: 'assets', registry: 'account_registry', 'bank-account': 'bank_accounts', 'savings-deposit': 'bank_savings_deposits' }[source.source_type];
    if (!table || !(b[table] as { id: number }[]).some(x => x.id === source.source_id)) throw new Error('Invalid allocation source.');
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  // Archived purposes remain valid historical references in a backup.
  for (const rows of groups.values()) validateAssignments(rows, purposes.map(p => ({ id: p.id, is_active: true })));
  const settings = b.app_settings as Record<string, unknown>[];
  const fx = settings.find(r => r.key === 'usd_vnd_rate');
  if (fx && (!Number.isFinite(Number(fx.value)) || Number(fx.value) <= 0)) throw new Error('Invalid FX setting.');
  const wallets = settings.find(r => r.key === 'crypto_wallets');
  if (wallets) validateWallets(JSON.parse(String(wallets.value)));
}

async function insertBackup(tx: Transaction, backup: Backup) {
  for (const table of TABLE_CONFIGS) {
    for (const row of backup[table.name] as Record<string, unknown>[]) {
      const columns = table.columns.filter(c => row[c.name] !== undefined);
      const values = columns.map(c => typeof row[c.name] === 'boolean' ? Number(row[c.name]) : row[c.name]) as InValue[];
      await tx.execute({ sql: `INSERT INTO ${quote(table.name)} (${columns.map(c => quote(c.name)).join(',')}) VALUES (${columns.map(() => '?').join(',')})`, args: values });
    }
  }
}

export async function validateBackup(input: unknown): Promise<Backup> {
  validateBackupShape(input);
  ensurePrivateDirectories();
  const stagingDirectory = mkdtempSync(join(PRIVATE_ROOT, 'snapshots', '.import-validation-'));
  const stage = createClient({ url: 'file:' + join(stagingDirectory, 'validation.db') });
  try {
    await initializeSchema(stage, { freshPolicy: false });
    const tx = await stage.transaction('write');
    try {
      await tx.execute('PRAGMA defer_foreign_keys=ON');
      await insertBackup(tx, input);
      if ((await tx.execute('PRAGMA foreign_key_check')).rows.length) throw new Error('Backup contains broken references.');
      await tx.commit();
    } catch (e) { await tx.rollback(); throw e; } finally { tx.close(); }
  } finally { stage.close(); rmSync(stagingDirectory, { recursive: true, force: true }); }
  return input;
}

export async function restoreBackup(client: Client, input: unknown, confirmation: unknown, save = (b: Backup) => savePrivateFile('backups', 'before-import', JSON.stringify(b, null, 2))) {
  if (confirmation !== 'REPLACE LOCAL DATA') throw new Error('Explicit replacement confirmation is required.');
  const backup = await validateBackup(input); // No production writes before full staging validation.
  const tx = await client.transaction('write');
  try {
    // Keep the write lock from snapshot through replacement so no concurrent change is lost.
    const path = save(await readBackup(tx)); // Failure aborts before deleting any record.
    await tx.execute('PRAGMA defer_foreign_keys=ON');
    for (const table of [...TABLE_NAMES].reverse()) await tx.execute(`DELETE FROM ${quote(table)}`);
    await insertBackup(tx, backup);
    if ((await tx.execute('PRAGMA foreign_key_check')).rows.length) throw new Error('Restored references failed verification.');
    await tx.commit();
    return path;
  } catch (e) { await tx.rollback(); throw e; } finally { tx.close(); }
}

export function validateWallets(input: unknown) {
  if (!Array.isArray(input) || input.length > 10000) throw new Error('Invalid wallet address book.');
  const ids = new Set();
  for (const w of input) {
    if (!w || typeof w !== 'object' || ['id','name','address','notes','createdAt','updatedAt'].some(k => typeof w[k] !== 'string') || typeof w.isActive !== 'boolean' || !['BTC','ETH','SOL','BNB','Polygon','Other'].includes(w.chain) || ids.has(w.id)) throw new Error('Invalid wallet entry.');
    ids.add(w.id);
  }
}

export function csvCell(value: unknown) {
  let text = value == null ? '' : String(value);
  if (typeof value === 'string' && /^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
