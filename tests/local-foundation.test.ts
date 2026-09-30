import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { createClient } from '@libsql/client/sqlite3';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/db/schema';
import { initializeSchema } from '../src/db/initialize';
import { resolveLocalDatabaseUrl, DATABASE_PATH, dataRootFor } from '../src/lib/local-paths';
import { isLocalRequest } from '../src/lib/local-request';
import { normalizeToUsd, convertCurrency } from '../src/lib/fx';
import { buildPortfolioSummary, type PortfolioInput } from '../src/lib/portfolio-model';
import { readBackup, restoreBackup, validateBackup, csvCell, TABLE_NAMES } from '../src/lib/backup';
import { createLifecycleTransaction, type LifecycleTransactionInput } from '../src/lib/asset-lifecycle';
import { tr, t } from '../src/i18n';
import { NAV_GROUPS } from '../src/lib/nav';
import { accountRegistry, assets, assetCustodyPositions, ledgerEntries, transactions } from '../src/db/schema';
import { convertToVnd, getLedgerCashBalance, recordStockTransaction, setStockMarketPrice } from '../src/lib/stock-workspace';

test('primary navigation follows the wealth management domains and hides infrastructure pages', () => {
  assert.deepEqual(NAV_GROUPS.map((group) => group.label), ['Overview', 'Wealth', 'Investing', 'Reports', 'System']);
  const links = NAV_GROUPS.flatMap((group) => group.links);
  const routes = links.map(({ href }) => href.split('#')[0]);
  for (const href of ['/locations', '/holdings', '/transactions', '/accounts', '/rebalancing', '/journal', '/system/production']) {
    assert.equal(routes.includes(href), false, `${href} should stay out of primary navigation`);
  }
  assert.ok(links.some(({ label }) => tr(label) === 'Phân bổ tài sản'));
  assert.ok(links.some(({ label }) => tr(label) === 'Lịch sử gia sản'));
});

async function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'tnpa-test-'));
  const client = createClient({ url: 'file:' + join(directory, 'fixture.db') });
  const close = client.close.bind(client);
  client.close = () => { close(); rmSync(directory, { recursive: true, force: true }); };
  await initializeSchema(client);
  return { client, database: drizzle(client, { schema }) };
}

test('stock reference lifecycle keeps cash ledger driven through buy, valuation, dividend and full exit', async () => {
  const { client, database } = await fixture();
  try {
    const now = new Date().toISOString();
    const [account] = await database.insert(accountRegistry).values({
      name: 'ACBS Securities', type: 'broker_account', institution: 'ACBS', currency: 'VND',
      current_balance: 0, status: 'active', created_at: now, updated_at: now,
    }).returning();
    const [stock] = await database.insert(assets).values({
      name: 'Vietcombank', symbol: 'VCB', asset_class: 'stock', purpose: 'wealth_compounder',
      current_value: 0, currency: 'VND', quantity: 0, cost_basis: 0,
      include_in_total_net_worth: true, include_in_investment_net_worth: true,
      is_archived: false, created_at: now, updated_at: now,
    }).returning();

    await assert.rejects(recordStockTransaction({ type: 'buy', brokerAccountId: account.id, assetId: stock.id, date: '2026-09-30', currency: 'VND', quantity: 3_000, price: 60_000, fees: 200_000 }, database), /Insufficient broker cash/);
    await recordStockTransaction({ type: 'deposit', brokerAccountId: account.id, date: '2026-09-30', currency: 'VND', amount: 500_000_000 }, database);
    await recordStockTransaction({ type: 'buy', brokerAccountId: account.id, assetId: stock.id, date: '2026-09-30', currency: 'VND', quantity: 3_000, price: 60_000, fees: 200_000 }, database);
    assert.equal(await getLedgerCashBalance(account.id, database), 319_800_000);
    assert.equal((await database.select().from(accountRegistry).where(eq(accountRegistry.id, account.id)))[0].current_balance, 319_800_000);
    await assert.rejects(recordStockTransaction({ type: 'sell', brokerAccountId: account.id, assetId: stock.id, date: '2026-09-30', currency: 'VND', quantity: 3_001, price: 60_000 }, database), /Cannot sell more than the available quantity/);

    await setStockMarketPrice(stock.id, 70_000, database);
    let [updatedStock] = await database.select().from(assets).where(eq(assets.id, stock.id));
    let [position] = await database.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.asset_id, stock.id));
    assert.equal(updatedStock.current_value, 210_000_000);
    assert.equal(position.cost_basis, 180_200_000);
    assert.equal(updatedStock.current_value - position.cost_basis, 29_800_000);
    assert.equal(await getLedgerCashBalance(account.id, database), 319_800_000, 'a price change must not create cash');
    assert.equal(updatedStock.current_value + await getLedgerCashBalance(account.id, database), 529_800_000, 'workspace total is market value plus cash');
    assert.equal((await database.select().from(transactions)).filter((row) => row.realized_pnl != null).length, 0, 'a price change must not create realized P&L');

    await recordStockTransaction({ type: 'dividend', brokerAccountId: account.id, assetId: stock.id, date: '2026-09-30', currency: 'VND', amount: 5_000_000, tax: 250_000 }, database);
    assert.equal(await getLedgerCashBalance(account.id, database), 324_550_000);

    await recordStockTransaction({ type: 'sell', brokerAccountId: account.id, assetId: stock.id, date: '2026-09-30', currency: 'VND', quantity: 1_000, price: 75_000, fees: 100_000 }, database);
    [updatedStock] = await database.select().from(assets).where(eq(assets.id, stock.id));
    [position] = await database.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.asset_id, stock.id));
    assert.equal(position.quantity, 2_000);
    assert.ok(Math.abs(position.cost_basis - 120_133_333.33333333) < 0.001);
    assert.ok(Math.abs(position.cost_basis / position.quantity - 60_066.666666666664) < 0.000001);
    assert.ok(Math.abs((updatedStock.current_value / updatedStock.quantity! - 70_000) * position.quantity) < 0.001);
    assert.ok(Math.abs((await database.select().from(transactions).where(eq(transactions.type, 'sell')))[0].realized_pnl! - 14_833_333.33333333) < 0.001);
    assert.equal(await getLedgerCashBalance(account.id, database), 399_450_000);

    await recordStockTransaction({ type: 'sell', brokerAccountId: account.id, assetId: stock.id, date: '2026-09-30', currency: 'VND', quantity: 2_000, price: 72_000, fees: 100_000 }, database);
    [updatedStock] = await database.select().from(assets).where(eq(assets.id, stock.id));
    [position] = await database.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.asset_id, stock.id));
    const sellRows = await database.select().from(transactions).where(eq(transactions.type, 'sell'));
    const dividendRows = await database.select().from(transactions).where(eq(transactions.type, 'dividend'));
    const cashEntries = await database.select().from(ledgerEntries).where(eq(ledgerEntries.account_id, account.id));
    const finalCash = await getLedgerCashBalance(account.id, database);
    const totalRealized = sellRows.reduce((sum, row) => sum + (row.realized_pnl ?? 0), 0);
    const feesRecorded = cashEntries.filter((entry) => entry.entry_type === 'fee').reduce((sum, entry) => sum + (entry.amount ?? 0), 0);
    assert.equal(position.quantity, 0);
    assert.equal(updatedStock.is_archived, true);
    assert.equal(updatedStock.current_value, 0);
    assert.ok(Math.abs(totalRealized - 38_600_000) < 0.001);
    assert.equal(dividendRows[0].gross_proceeds, 5_000_000);
    assert.equal(dividendRows[0].tax, 250_000);
    assert.equal(dividendRows[0].amount, 4_750_000);
    assert.equal(feesRecorded, 400_000);
    assert.equal((await database.select().from(transactions)).length, 5, 'the full lifecycle remains in transaction history');
    assert.equal(finalCash, 543_350_000);
    assert.equal(finalCash + updatedStock.current_value, 543_350_000, 'after full exit workspace total equals broker cash');
    assert.equal(convertToVnd(updatedStock.current_value, 'VND', 25_500), 0);
  } finally { client.close(); }
});

test('stock workspace withdrawals and standalone broker fees are cash-ledger movements', async () => {
  const { client, database } = await fixture();
  try {
    const now = new Date().toISOString();
    const [account] = await database.insert(accountRegistry).values({ name: 'VCBS', type: 'broker_account', institution: 'VCBS', currency: 'VND', current_balance: 0, status: 'active', created_at: now, updated_at: now }).returning();
    for (const [type, amount] of [['deposit', 1_000], ['withdraw', 100], ['fee', 25]] as const) {
      await recordStockTransaction({ type, brokerAccountId: account.id, date: '2026-09-30', currency: 'VND', amount }, database);
    }
    assert.equal(await getLedgerCashBalance(account.id, database), 875);
    const rows = await database.select().from(ledgerEntries).where(eq(ledgerEntries.account_id, account.id));
    assert.equal(rows.filter((entry) => entry.entry_type === 'fee').reduce((sum, entry) => sum + (entry.amount ?? 0), 0), 25);
    assert.equal((await database.select().from(transactions)).length, 3);
  } finally { client.close(); }
});
const now = '2026-09-28T00:00:00.000Z';
const asset = (extra = {}) => ({ id: 1, name: 'Test holding', symbol: null, asset_class: 'stock', purpose: 'wealth_compounder', current_value: 100, currency: 'USD', quantity: 10, cost_basis: 80, notes: null, is_archived: false, cash_source_type: null, cash_source_id: null, include_in_investment_net_worth: true, include_in_total_net_worth: true, created_at: now, updated_at: now, ...extra } as schema.Asset);
const registry = (extra = {}) => ({ id: 1, name: 'Fixture cash', type: 'broker_account', institution: null, bank_account_id: null, account_number_masked: null, currency: 'USD', current_balance: 200, status: 'active', notes: null, created_at: now, updated_at: now, ...extra } as schema.AccountRegistry);
const bank = (extra = {}) => ({ id: 1, bank_name: 'Fixture Bank', account_name: 'Fixture bank cash', account_number: null, account_type: 'Reserve', currency: 'VND', balance: 2500000, purpose: 'liquidity_reserve', custom_purpose: null, vip_tier: null, status: 'active', notes: null, created_at: now, updated_at: now, ...extra } as schema.BankAccount);
const input = (extra: Partial<PortfolioInput> = {}): PortfolioInput => ({ usdVndRate: 25000, legacyAssets: [], accounts: [], deposits: [], creditCards: [], creditFacilities: [], registry: [], ...extra });
const txn = (extra: Partial<LifecycleTransactionInput> = {}): LifecycleTransactionInput => ({ assetId: 1, type: 'buy', transactionDate: '2026-09-28', settlementDate: null, quantity: 10, price: 10, amount: 100, totalAmount: 100, grossProceeds: null, currency: 'USD', fees: 2, tax: 0, fundingAccountId: 1, executionAccountId: 1, custodyAccountId: 1, receiveAccountId: null, fromCustodyAccountId: null, toCustodyAccountId: null, transferFee: null, notes: null, ...extra });

test('database configuration fails closed for remote, relative, repository and legacy settings', () => {
  const testEnv = (values: Record<string, string | undefined> = {}) => ({ NODE_ENV: 'test', TNPA_ENV: 'development', TNPA_DATA_ROOT: dataRootFor('development'), ...values }) as NodeJS.ProcessEnv;
  assert.ok(resolveLocalDatabaseUrl(testEnv()).endsWith('/.tnpa-wealth-os-dev/database/wealth.db'));
  assert.ok(resolveLocalDatabaseUrl(testEnv({ DATABASE_URL: `file:${DATABASE_PATH}` })));
  for (const DATABASE_URL of ['libsql://example.invalid', 'https://example.invalid', 'file:tnpa-investment.db', 'file:/tmp/wealth.db', '', `file:${DATABASE_PATH}?syncUrl=https://example.invalid`]) assert.throws(() => resolveLocalDatabaseUrl(testEnv({ DATABASE_URL })));
  assert.throws(() => resolveLocalDatabaseUrl(testEnv({ TURSO_DATABASE_URL: 'libsql://example.invalid' })));
  assert.throws(() => resolveLocalDatabaseUrl(testEnv({ TURSO_AUTH_TOKEN: 'invalid' })));
  assert.ok(resolveLocalDatabaseUrl(testEnv({ TNPA_ENV: 'production', TNPA_DATA_ROOT: dataRootFor('production') })).endsWith('/.tnpa-wealth-os/database/wealth.db'));
  assert.throws(() => resolveLocalDatabaseUrl(testEnv({ TNPA_ENV: 'development', TNPA_DATA_ROOT: dataRootFor('production') })));
  assert.throws(() => resolveLocalDatabaseUrl({ NODE_ENV: 'test' } as NodeJS.ProcessEnv));
});

test('environment data roots are distinct and cannot resolve across development and production', () => {
  assert.notEqual(dataRootFor('development'), dataRootFor('production'));
  assert.notEqual(dataRootFor('development', '/Users/tester'), dataRootFor('production', '/Users/tester'));
});

test('Vietnamese navigation copy wins ambiguous phrases while domain copy stays specific', () => {
  assert.equal(tr('Holdings'), 'Tài sản');
  assert.equal(t('stocks', 'Holdings'), 'Khoản đang nắm giữ');
});

test('local requests reject foreign origins, forged hosts and mutation without origin', () => {
  const good = { host: '127.0.0.1:3001', origin: 'http://127.0.0.1:3001', 'sec-fetch-site': 'same-origin' };
  assert.equal(isLocalRequest(new Headers(good), true), true);
  assert.equal(isLocalRequest(new Headers({ host: '127.0.0.1:3002', origin: 'http://127.0.0.1:3002', 'sec-fetch-site': 'same-origin' }), true, 'development'), true);
  assert.equal(isLocalRequest(new Headers({ ...good, 'x-forwarded-host': good.host }), true), true);
  for (const bad of [{ ...good, host: '192.168.1.1:3001' }, { ...good, origin: 'https://evil.invalid' }, { ...good, 'sec-fetch-site': 'cross-site' }, { ...good, 'x-forwarded-host': 'evil.invalid' }, { host: good.host }]) assert.equal(isLocalRequest(new Headers(bad), true), false);
});

test('initializer creates 21 empty tables, repeats without changing data, and never seeds', async () => {
  const { client } = await fixture();
  try {
    assert.equal(TABLE_NAMES.length, 21);
    for (const table of TABLE_NAMES) assert.equal((await client.execute(`SELECT count(*) n FROM "${table}"`)).rows[0].n, 0);
    await client.execute("INSERT INTO app_settings(key,value,updated_at) VALUES ('fixture','keep','2026-09-28')");
    assert.deepEqual((await initializeSchema(client)).created, []);
    assert.equal((await client.execute('SELECT value FROM app_settings')).rows[0].value, 'keep');
    assert.equal((await client.execute('PRAGMA integrity_check')).rows[0].integrity_check, 'ok');
  } finally { client.close(); }
});

test('FX conversions reject unsupported currency and invalid rates rather than assume USD', () => {
  assert.equal(normalizeToUsd(2500000, 'VND', 25000), 100);
  assert.equal(convertCurrency(100, 'USD', 'VND', 25000), 2500000);
  assert.throws(() => normalizeToUsd(100, 'EUR'));
  assert.throws(() => normalizeToUsd(100, 'VND', 0));
  assert.throws(() => normalizeToUsd(NaN, 'USD'));
});

test('one balance per explicit source, no name/value dedup, registry cash included once', () => {
  const result = buildPortfolioSummary(input({ accounts: [bank()], registry: [registry({ bank_account_id: 1, current_balance: 9999999 }), registry({ id: 2 })], legacyAssets: [asset(), asset({ id: 2, asset_class: 'cash', cash_source_type: 'bank_account', cash_source_id: 1, current_value: 2500000, currency: 'VND' })] }));
  assert.equal(result.totalNetWorth, 400); // bank 100 + independent broker cash 200 + stock 100
  assert.equal(result.positions.length, 3);
  const independent = buildPortfolioSummary(input({ accounts: [bank()], legacyAssets: [asset({ name: 'Fixture bank cash', asset_class: 'cash', current_value: 2500000, currency: 'VND' })] }));
  assert.equal(independent.totalNetWorth, 200); // Same name/value alone cannot establish identity.
});

test('archives and explicit cash mirrors excluded; unpaid inactive credit remains a liability', () => {
  const result = buildPortfolioSummary(input({ legacyAssets: [asset({ is_archived: true })], registry: [registry({ status: 'archived' })], creditCards: [{ id: 1, bank_name: 'Fixture', card_name: 'Fixture card', status: 'inactive', current_used: 250000 } as schema.BankCreditCard] }));
  assert.equal(result.totalNetWorth, -10);
  assert.equal(result.liabilityValueUsd, 10);
});

test('banking, settings/address book and every table round-trip, with pre-import snapshot', async () => {
  const { client, database } = await fixture();
  let recovered: ReturnType<typeof createClient> | undefined;
  let recoveryDir: string | undefined;
  try {
    await database.insert(schema.bankAccounts).values(bank());
    await database.insert(schema.bankSavingsDeposits).values({ deposit_name: 'QA synthetic term deposit', bank_account_id: 1, principal: 1000, created_at: now, updated_at: now });
    await database.insert(schema.assets).values([asset({ name: 'QA synthetic stock', symbol: 'QASTK' }), asset({ id: 2, name: 'QA synthetic crypto', symbol: 'QACRY', asset_class: 'crypto', quantity: 0.01 })]);
    await database.insert(schema.bankCreditCards).values({ bank_name: 'Fixture', card_name: 'Fixture card', current_used: 100, created_at: now, updated_at: now });
    await database.insert(schema.bankCreditFacilities).values({ bank_name: 'Fixture', facility_name: 'Fixture facility', current_used: 200, created_at: now, updated_at: now });
    await database.insert(schema.appSettings).values({ key: 'crypto_wallets', value: '[]', updated_at: now });
    const backup = await readBackup(client);
    for (const name of TABLE_NAMES) assert.ok(Array.isArray(backup[name]));
    assert.equal((backup.bank_accounts as unknown[]).length, 1);
    await validateBackup(backup);
    let protectedBefore = false;
    const path = await restoreBackup(client, backup, 'REPLACE LOCAL DATA', before => { protectedBefore = (before.bank_credit_facilities as unknown[]).length === 1; return 'in-memory-test-backup'; });
    assert.equal(path, 'in-memory-test-backup'); assert.ok(protectedBefore);
    const restored = await readBackup(client);
    for (const name of TABLE_NAMES) assert.deepEqual(restored[name], backup[name]);

    // Simulate a lost development database: initialize a separate clean SQLite file and restore the exported fixture.
    recoveryDir = mkdtempSync(join(tmpdir(), 'tnpa-dev-restore-'));
    recovered = createClient({ url: 'file:' + join(recoveryDir, 'recovered.db') });
    await initializeSchema(recovered);
    await restoreBackup(recovered, backup, 'REPLACE LOCAL DATA', () => 'dev-only-pre-restore-copy');
    const afterRecovery = await readBackup(recovered);
    for (const name of TABLE_NAMES) assert.deepEqual(afterRecovery[name], backup[name]);
    assert.equal((afterRecovery.assets as unknown[]).length, 2);
    assert.equal((afterRecovery.bank_savings_deposits as unknown[]).length, 1);
  } finally { client.close(); }
  if (recovered) { recovered.close(); if (recoveryDir) rmSync(recoveryDir, { recursive: true, force: true }); }
});

test('invalid imports, missing tables, legacy versions and backup write failure preserve original rows', async () => {
  const { client, database } = await fixture();
  try {
    await database.insert(schema.bankAccounts).values(bank());
    const backup = await readBackup(client);
    const missing = { ...backup }; delete missing.bank_accounts;
    for (const invalid of [missing, { ...backup, backup_version: 5 }, { ...backup, bank_accounts: [{ ...(backup.bank_accounts as object[])[0], currency: 'EUR' }] }, { ...backup, bank_savings_deposits: [{ id: 1 }] }]) {
      await assert.rejects(restoreBackup(client, invalid, 'REPLACE LOCAL DATA', () => { throw new Error('must not reach backup'); }));
      assert.equal((await client.execute('SELECT balance FROM bank_accounts')).rows[0].balance, 2500000);
    }
    await assert.rejects(restoreBackup(client, backup, undefined));
    await assert.rejects(restoreBackup(client, backup, 'REPLACE LOCAL DATA', () => { throw new Error('disk full'); }));
    assert.equal((await client.execute('SELECT balance FROM bank_accounts')).rows[0].balance, 2500000);
  } finally { client.close(); }
});

test('restore rolls back if a database failure occurs after deletion begins', async () => {
  const { client, database } = await fixture();
  try {
    await database.insert(schema.bankAccounts).values(bank());
    const backup = await readBackup(client);
    await client.execute("CREATE TRIGGER fail_restore BEFORE INSERT ON bank_accounts BEGIN SELECT RAISE(ABORT, 'fixture failure'); END");
    await assert.rejects(restoreBackup(client, backup, 'REPLACE LOCAL DATA', () => 'saved'));
    assert.equal((await client.execute('SELECT balance FROM bank_accounts')).rows[0].balance, 2500000);
  } finally { client.close(); }
});

test('buy/sell updates authoritative bank cash and valuation atomically, fees reduce wealth', async () => {
  const { client, database } = await fixture();
  try {
    await database.insert(schema.bankAccounts).values(bank({ currency: 'USD', balance: 1000 }));
    await database.insert(schema.accountRegistry).values(registry({ bank_account_id: 1, type: 'bank_account', current_balance: 0 }));
    await database.insert(schema.assets).values(asset({ quantity: 0, cost_basis: 0, current_value: 0 }));
    await createLifecycleTransaction(txn(), database);
    assert.equal((await client.execute('SELECT balance FROM bank_accounts')).rows[0].balance, 898);
    assert.equal((await client.execute('SELECT current_value FROM assets')).rows[0].current_value, 100);
    assert.equal((await client.execute('SELECT current_balance FROM account_registry')).rows[0].current_balance, 0);
    await createLifecycleTransaction(txn({ type: 'sell', quantity: 5, amount: 60, totalAmount: null, grossProceeds: 60, fees: 1, receiveAccountId: 1 }), database);
    assert.equal((await client.execute('SELECT balance FROM bank_accounts')).rows[0].balance, 957);
    assert.equal((await client.execute('SELECT current_value FROM assets')).rows[0].current_value, 50);
    const before = await readBackup(client);
    await assert.rejects(createLifecycleTransaction(txn({ quantity: -1 }), database));
    await assert.rejects(createLifecycleTransaction(txn({ currency: 'VND' }), database));
    const after = await readBackup(client);
    for (const name of TABLE_NAMES) assert.deepEqual(after[name], before[name]);
  } finally { client.close(); }
});

test('lifecycle rollback covers cash, holdings and transaction when ledger insertion fails', async () => {
  const { client, database } = await fixture();
  try {
    await database.insert(schema.accountRegistry).values(registry({ current_balance: 1000 }));
    await database.insert(schema.assets).values(asset({ quantity: 0, cost_basis: 0, current_value: 0 }));
    await client.execute("CREATE TRIGGER fail_ledger BEFORE INSERT ON ledger_entries BEGIN SELECT RAISE(ABORT, 'fixture failure'); END");
    await assert.rejects(createLifecycleTransaction(txn(), database));
    assert.equal((await client.execute('SELECT current_balance FROM account_registry')).rows[0].current_balance, 1000);
    assert.equal((await client.execute('SELECT count(*) n FROM transactions')).rows[0].n, 0);
    assert.equal((await client.execute('SELECT count(*) n FROM asset_custody_positions')).rows[0].n, 0);
  } finally { client.close(); }
});

test('CSV quotes are escaped and spreadsheet formulas neutralized', () => {
  assert.equal(csvCell('=1+1'), '"\'=1+1"');
  assert.equal(csvCell('a"b'), '"a""b"');
  assert.equal(csvCell(-12), '"-12"');
});
