import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Client } from '@libsql/client';

// Only additive, reviewed schema changes. Never seed, drop, rename or rewrite records.
export async function initializeSchema(client: Client) {
  const baseline = readFileSync(join(process.cwd(), 'src/db/migrations/0001_baseline.sql'), 'utf8');
  const statements = baseline.replace(/^--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
  const additions = [
    ['account_registry', 'bank_account_id', 'INTEGER REFERENCES bank_accounts(id)'],
    ['account_registry', 'custody_type', 'TEXT'],
    ['assets', 'cash_source_type', 'TEXT'],
    ['assets', 'cash_source_id', 'INTEGER'],
    ['assets', 'cost_basis_known', 'INTEGER NOT NULL DEFAULT 1'],
    ['assets', 'opening_date', 'TEXT'],
    ['assets', 'acquisition_date', 'TEXT'],
    ['assets', 'gold_purity', 'TEXT'],
    ['assets', 'gold_form', 'TEXT'],
    ['assets', 'gold_item_count', 'REAL'],
    ['assets', 'gold_weight', 'REAL'],
    ['assets', 'gold_weight_unit', 'TEXT'],
    ['assets', 'storage_location', 'TEXT'],
    ['assets', 'ownership_label', 'TEXT'],
    ['assets', 'property_type', 'TEXT'],
    ['assets', 'property_location', 'TEXT'],
    ['assets', 'property_area_sqm', 'REAL'],
    ['assets', 'property_width_m', 'REAL'],
    ['assets', 'property_length_m', 'REAL'],
    ['assets', 'property_legal_status', 'TEXT'],
    ['assets', 'ownership_percentage', 'REAL'],
    ['assets', 'purchase_price', 'REAL'],
    ['assets', 'acquisition_costs', 'REAL'],
    ['assets', 'property_value_per_sqm', 'REAL'],
    ['asset_custody_positions', 'cost_basis_known', 'INTEGER NOT NULL DEFAULT 1'],
  ];
  const tx = await client.transaction('write');
  try {
    const before = await tx.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    for (const sql of statements) {
      await tx.execute(sql);
      const table = sql.match(/EXISTS (\w+)/)![1];
      const columns = (await tx.execute(`PRAGMA table_info("${table}")`)).rows;
      // Recover old schemas using additive columns only. Refuse unsafe required-column backfills.
      const definitions = sql.slice(sql.indexOf('(') + 1, sql.lastIndexOf(')')).split(',').map(s => s.trim());
      for (const definition of definitions) {
        const name = definition.split(/\s/)[0];
        if (!columns.some(c => c.name === name)) {
          if (/PRIMARY KEY|UNIQUE|NOT NULL(?!.*DEFAULT)/.test(definition)) throw new Error(`Unsupported old schema: ${table}.${name}. Restore unchanged; manual migration required.`);
          await tx.execute(`ALTER TABLE "${table}" ADD COLUMN ${definition}`);
        }
      }
    }
    for (const [table, column, definition] of additions) {
      const info = await tx.execute(`PRAGMA table_info("${table}")`);
      if (!info.rows.some(row => row.name === column)) await tx.execute(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
    }
    await tx.execute('CREATE UNIQUE INDEX IF NOT EXISTS account_registry_bank_link ON account_registry(bank_account_id)');
    const integrity = await tx.execute('PRAGMA integrity_check');
    if (integrity.rows[0]?.integrity_check !== 'ok') throw new Error('Database integrity check failed.');
    const fk = await tx.execute('PRAGMA foreign_key_check');
    if (fk.rows.length) throw new Error('Existing foreign-key violations require manual reconciliation. No schema changes applied.');
    const after = await tx.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    await tx.commit();
    return { created: after.rows.filter(r => !before.rows.some(b => b.name === r.name)).map(r => String(r.name)), tables: after.rows.map(r => String(r.name)) };
  } catch (error) { await tx.rollback(); throw error; }
  finally { tx.close(); }
}
