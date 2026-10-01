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
import { buildPersonalWealthSummaryVnd, buildPortfolioSummary, type PortfolioInput } from '../src/lib/portfolio-model';
import { computeBankingSummary } from '../src/lib/banking';
import { projectSavingsDeposit } from '../src/lib/banking-projections';
import { getMaturityStatus } from '../src/lib/banking-events';
import { readBackup, restoreBackup, validateBackup, csvCell, TABLE_NAMES } from '../src/lib/backup';
import { createLifecycleTransaction, type LifecycleTransactionInput } from '../src/lib/asset-lifecycle';
import { tr, t } from '../src/i18n';
import { NAV_GROUPS } from '../src/lib/nav';
import { accountRegistry, assets, assetCustodyPositions, ledgerEntries, transactions } from '../src/db/schema';
import { convertToVnd, correctStockOpeningPosition, getLedgerCashBalance, getStockWorkspaceData, recordStockOpeningBalance, recordStockOpeningPosition, recordStockTransaction, setStockMarketPrice, supplyStockCostBasis } from '../src/lib/stock-workspace';
import { correctCryptoOpeningPosition, getCryptoWorkspaceData, recordCryptoOpeningBalance, recordCryptoOpeningPosition, recordCryptoTransaction, setCryptoMarketPrice, supplyCryptoCostBasis } from '../src/lib/crypto-workspace';

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

test('stocks opening wealth scenario A: opening cash and known-basis holding count once with no income', async () => {
  const { client, database } = await fixture();
  try {
    const stamp = new Date().toISOString();
    const [account] = await database.insert(accountRegistry).values({ name: 'ACBS TEST', type: 'broker_account', institution: 'ACBS', currency: 'VND', current_balance: 0, status: 'active', created_at: stamp, updated_at: stamp }).returning();
    const [stock] = await database.insert(assets).values({ name: 'Vietcombank', symbol: 'VCB', asset_class: 'stock', purpose: 'wealth_compounder', current_value: 0, currency: 'VND', quantity: 0, cost_basis: 0, include_in_total_net_worth: true, include_in_investment_net_worth: true, is_archived: false, created_at: stamp, updated_at: stamp }).returning();
    await recordStockOpeningBalance({ brokerAccountId: account.id, amount: 100_000_000, date: '2026-09-30' }, database);
    await recordStockOpeningPosition({ brokerAccountId: account.id, assetId: stock.id, quantity: 10_000, costBasisMode: 'average', costBasisValue: 55_000, date: '2026-09-30' }, database);
    await setStockMarketPrice(stock.id, 70_000, database);
    const workspace = await getStockWorkspaceData(database, 25_000);
    const row = workspace.positions[0];
    assert.equal(await getLedgerCashBalance(account.id, database), 100_000_000);
    assert.equal(row.quantity, 10_000);
    assert.equal(row.costBasis, 550_000_000);
    assert.equal(row.marketValue, 700_000_000);
    assert.equal(row.gainLoss, 150_000_000);
    assert.equal(workspace.totals.workspaceVnd, 800_000_000);
    assert.equal(workspace.totals.realizedPnlVnd, 0);
    assert.equal(workspace.totals.dividendIncomeVnd, 0);
    const portfolio = buildPortfolioSummary(input({ legacyAssets: await database.select().from(assets), registry: await database.select().from(accountRegistry) }));
    assert.equal(portfolio.totalNetWorth, 800_000_000 / 25_000);
    const history = await database.select().from(transactions);
    assert.equal(history.filter((item) => item.type === 'opening_position' || item.type === 'opening_balance').length, 2);
    assert.equal(history.filter((item) => item.type === 'deposit' || item.type === 'dividend' || (item.realized_pnl ?? 0) !== 0).length, 0);
    assert.equal(row.canCorrectOpening, true);
    await correctStockOpeningPosition({ brokerAccountId: account.id, assetId: stock.id, transactionId: row.openingTransactionId!, quantity: 10_000, costBasisMode: 'average', costBasisValue: 55_000, date: '2026-09-30', marketPrice: 70_000 }, database);
    assert.equal((await getStockWorkspaceData(database, 25_000)).positions[0].marketValue, 700_000_000);
  } finally { client.close(); }
});

test('stocks opening wealth scenario B: later BUY and SELL use combined opening cost basis', async () => {
  const { client, database } = await fixture();
  try {
    const stamp = new Date().toISOString();
    const [account] = await database.insert(accountRegistry).values({ name: 'ACBS TEST', type: 'broker_account', institution: 'ACBS', currency: 'VND', current_balance: 0, status: 'active', created_at: stamp, updated_at: stamp }).returning();
    const [stock] = await database.insert(assets).values({ name: 'Vietcombank', symbol: 'VCB', asset_class: 'stock', purpose: 'wealth_compounder', current_value: 0, currency: 'VND', quantity: 0, cost_basis: 0, include_in_total_net_worth: true, include_in_investment_net_worth: true, is_archived: false, created_at: stamp, updated_at: stamp }).returning();
    await recordStockOpeningBalance({ brokerAccountId: account.id, amount: 500_000_000, date: '2026-09-30' }, database);
    await recordStockOpeningPosition({ brokerAccountId: account.id, assetId: stock.id, quantity: 10_000, costBasisMode: 'average', costBasisValue: 55_000, date: '2026-09-30' }, database);
    await setStockMarketPrice(stock.id, 70_000, database);
    await recordStockTransaction({ type: 'buy', brokerAccountId: account.id, assetId: stock.id, date: '2026-09-30', currency: 'VND', quantity: 2_000, price: 60_000, fees: 200_000 }, database);
    let workspace = await getStockWorkspaceData(database, 25_000);
    assert.equal(await getLedgerCashBalance(account.id, database), 379_800_000);
    assert.equal(workspace.positions[0].quantity, 12_000);
    assert.equal(workspace.positions[0].costBasis, 670_200_000);
    assert.equal(workspace.positions[0].averageCost, 55_850);
    await assert.rejects(correctStockOpeningPosition({ brokerAccountId: account.id, assetId: stock.id, transactionId: workspace.positions[0].openingTransactionId!, quantity: 10_000, costBasisMode: 'average', costBasisValue: 55_000, date: '2026-09-30' }, database), /later activity/);
    await recordStockTransaction({ type: 'sell', brokerAccountId: account.id, assetId: stock.id, date: '2026-09-30', currency: 'VND', quantity: 2_000, price: 65_000, fees: 100_000 }, database);
    workspace = await getStockWorkspaceData(database, 25_000);
    assert.equal(await getLedgerCashBalance(account.id, database), 509_700_000);
    assert.equal(workspace.positions[0].quantity, 10_000);
    assert.equal(workspace.positions[0].costBasis, 558_500_000);
    assert.equal(workspace.positions[0].averageCost, 55_850);
    assert.equal(workspace.transactions.find((item) => item.type === 'sell')?.realized_pnl, 18_200_000);
    assert.equal(workspace.positions[0].gainLoss, 141_500_000);
    assert.equal(workspace.totals.workspaceVnd, 1_209_700_000);
  } finally { client.close(); }
});

test('stocks opening wealth scenario C: same ticker stays in broker custody and aggregates as one economic asset', async () => {
  const { client, database } = await fixture();
  try {
    const stamp = new Date().toISOString();
    const [acbs, vpbank] = await database.insert(accountRegistry).values([
      { name: 'ACBS TEST', type: 'broker_account', institution: 'ACBS', currency: 'VND', current_balance: 0, status: 'active', created_at: stamp, updated_at: stamp },
      { name: 'VPBankS TEST', type: 'broker_account', institution: 'VPBankS', currency: 'VND', current_balance: 0, status: 'active', created_at: stamp, updated_at: stamp },
    ]).returning();
    const [stock] = await database.insert(assets).values({ name: 'Vietcombank', symbol: 'VCB', asset_class: 'stock', purpose: 'wealth_compounder', current_value: 0, currency: 'VND', quantity: 0, cost_basis: 0, include_in_total_net_worth: true, include_in_investment_net_worth: true, is_archived: false, created_at: stamp, updated_at: stamp }).returning();
    await recordStockOpeningPosition({ brokerAccountId: acbs.id, assetId: stock.id, quantity: 10_000, costBasisMode: 'average', costBasisValue: 55_000, date: '2026-09-30' }, database);
    await setStockMarketPrice(stock.id, 70_000, database);
    await recordStockOpeningPosition({ brokerAccountId: vpbank.id, assetId: stock.id, quantity: 5_000, costBasisMode: 'average', costBasisValue: 60_000, date: '2026-09-30' }, database);
    const workspace = await getStockWorkspaceData(database, 25_000);
    const custody = workspace.positions.filter((row) => row.asset.id === stock.id);
    assert.equal(custody.length, 2);
    assert.deepEqual(custody.map((row) => [row.broker?.institution, row.quantity]).sort(), [['ACBS', 10_000], ['VPBankS', 5_000]].sort());
    assert.equal(custody.reduce((sum, row) => sum + row.quantity, 0), 15_000);
    assert.equal((await database.select().from(assets).where(eq(assets.symbol, 'VCB'))).length, 1);
    assert.equal((await database.select().from(assets).where(eq(assets.symbol, 'VCB')))[0].current_value, 1_050_000_000);
    assert.equal(workspace.totals.marketValueVnd, 1_050_000_000);
    const portfolio = buildPortfolioSummary(input({ legacyAssets: await database.select().from(assets), registry: await database.select().from(accountRegistry) }));
    assert.equal(portfolio.totalNetWorth, 1_050_000_000 / 25_000);
  } finally { client.close(); }
});

test('stocks opening wealth scenario D: unknown cost basis stays unknown and can be supplied without valuation changes', async () => {
  const { client, database } = await fixture();
  try {
    const stamp = new Date().toISOString();
    const [account] = await database.insert(accountRegistry).values({ name: 'VPBankS TEST', type: 'broker_account', institution: 'VPBankS', currency: 'VND', current_balance: 0, status: 'active', created_at: stamp, updated_at: stamp }).returning();
    const [stock] = await database.insert(assets).values({ name: 'Vinamilk', symbol: 'VNM', asset_class: 'stock', purpose: 'wealth_compounder', current_value: 0, currency: 'VND', quantity: 0, cost_basis: 0, include_in_total_net_worth: true, include_in_investment_net_worth: true, is_archived: false, created_at: stamp, updated_at: stamp }).returning();
    await recordStockOpeningPosition({ brokerAccountId: account.id, assetId: stock.id, quantity: 5_000, costBasisMode: 'unknown', date: '2026-09-30' }, database);
    await setStockMarketPrice(stock.id, 70_000, database);
    let workspace = await getStockWorkspaceData(database, 25_000);
    const before = workspace.positions[0];
    assert.equal(before.quantity, 5_000);
    assert.equal(before.marketValue, 350_000_000);
    assert.equal(before.costBasis, null);
    assert.equal(before.gainLoss, null);
    assert.equal(workspace.totals.costBasisVnd, null);
    assert.equal(workspace.totals.unrealizedPnlVnd, null);
    assert.equal(buildPortfolioSummary(input({ legacyAssets: await database.select().from(assets) })).totalNetWorth, 350_000_000 / 25_000);
    assert.equal(await getLedgerCashBalance(account.id, database), 0);
    assert.equal(workspace.totals.realizedPnlVnd, 0);
    await supplyStockCostBasis({ brokerAccountId: account.id, assetId: stock.id, totalCostBasis: 300_000_000, date: '2026-09-30' }, database);
    workspace = await getStockWorkspaceData(database, 25_000);
    assert.equal(workspace.positions[0].quantity, before.quantity);
    assert.equal(workspace.positions[0].marketValue, before.marketValue);
    assert.equal(workspace.positions[0].costBasis, 300_000_000);
    assert.equal(workspace.positions[0].gainLoss, 50_000_000);
    assert.equal(buildPortfolioSummary(input({ legacyAssets: await database.select().from(assets) })).totalNetWorth, 350_000_000 / 25_000);
    assert.equal(await getLedgerCashBalance(account.id, database), 0);
  } finally { client.close(); }
});

test('crypto workspace keeps stablecoin cash single-counted and transfers custody without disposal', async () => {
  const { client, database } = await fixture();
  try {
    const now = new Date().toISOString();
    const [binance] = await database.insert(accountRegistry).values({ name: 'Binance TEST', type: 'crypto_exchange', custody_type: 'EXCHANGE', institution: 'Binance TEST', currency: 'USDT', current_balance: 0, status: 'active', created_at: now, updated_at: now }).returning();
    const [ledger] = await database.insert(accountRegistry).values({ name: 'Ledger TEST', type: 'crypto_wallet', custody_type: 'COLD_WALLET', institution: 'Ledger TEST', currency: 'USDT', current_balance: 0, status: 'active', created_at: now, updated_at: now }).returning();
    const [btc] = await database.insert(assets).values({ name: 'Bitcoin', symbol: 'BTC', asset_class: 'crypto', purpose: 'wealth_compounder', current_value: 0, currency: 'USDT', quantity: 0, cost_basis: 0, include_in_total_net_worth: true, include_in_investment_net_worth: true, is_archived: false, created_at: now, updated_at: now }).returning();

    await recordCryptoTransaction({ type: 'deposit', custodyAccountId: binance.id, date: '2026-09-30', currency: 'USDT', amount: 50_000 }, database);
    await recordCryptoTransaction({ type: 'buy', custodyAccountId: binance.id, assetId: btc.id, date: '2026-09-30', currency: 'USDT', quantity: 0.5, price: 60_000, fees: 30 }, database);
    assert.equal(await getLedgerCashBalance(binance.id, database), 19_970);
    let [position] = await database.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.asset_id, btc.id));
    assert.equal(position.quantity, 0.5);
    assert.equal(position.cost_basis, 30_030);

    await setCryptoMarketPrice(btc.id, 75_000, database);
    let workspace = await getCryptoWorkspaceData(database, 25_500);
    assert.equal(workspace.totals.marketValue, 37_500);
    assert.equal(workspace.totals.unrealizedPnl, 7_470);
    assert.equal(workspace.totals.cash, 19_970);
    assert.equal(workspace.totals.realizedPnl, 0);
    assert.equal(workspace.totals.total, 57_470);

    const transactionCountBeforeTransfer = (await database.select().from(transactions)).length;
    await recordCryptoTransaction({ type: 'transfer', fromCustodyAccountId: binance.id, toCustodyAccountId: ledger.id, assetId: btc.id, date: '2026-09-30', currency: 'USDT', quantity: 0.2, transferFee: 0.0001 }, database);
    const transferRows = await database.select().from(transactions).where(eq(transactions.type, 'transfer'));
    const binancePosition = (await database.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.custody_account_id, binance.id)))[0];
    const ledgerPosition = (await database.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.custody_account_id, ledger.id)))[0];
    workspace = await getCryptoWorkspaceData(database, 25_500);
    assert.equal(binancePosition.quantity, 0.3);
    assert.ok(Math.abs(ledgerPosition.quantity - 0.1999) < 1e-10);
    assert.equal(binancePosition.cost_basis, 18_018);
    assert.ok(Math.abs(ledgerPosition.cost_basis - 12_005.994) < 1e-9);
    assert.ok(Math.abs(workspace.positionsByAsset.find((row) => row.asset.id === btc.id)!.quantity - 0.4999) < 1e-10);
    assert.equal(transferRows.length, 1);
    assert.equal(transferRows[0].realized_pnl, null);
    assert.equal((await database.select().from(transactions)).filter((row) => ['dividend','interest'].includes(row.type)).length, 0, 'a custody transfer must not create income');
    const networkFee = (await database.select().from(ledgerEntries)).find((entry) => entry.transaction_id === transferRows[0].id && entry.entry_type === 'fee');
    assert.ok(networkFee);
    assert.ok(Math.abs(networkFee.quantity! - 0.0001) < 1e-10);
    assert.ok(Math.abs(networkFee.amount! - 6.006) < 1e-8);
    assert.equal((await database.select().from(transactions)).length, transactionCountBeforeTransfer + 1);
    assert.equal(workspace.totals.realizedPnl, 0);
    assert.ok(Math.abs(workspace.totals.total - (57_470 - 7.5)) < 1e-8, 'only the actual token-denominated network fee reduces wealth');

    await recordCryptoTransaction({ type: 'sell', custodyAccountId: binance.id, assetId: btc.id, date: '2026-09-30', currency: 'USDT', quantity: 0.1, price: 70_000, fees: 20 }, database);
    const sales = await database.select().from(transactions).where(eq(transactions.type, 'sell'));
    const after = await getCryptoWorkspaceData(database, 25_500);
    const afterPositions = await database.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.asset_id, btc.id));
    assert.equal(await getLedgerCashBalance(binance.id, database), 26_950);
    assert.ok(Math.abs(afterPositions.find((row) => row.custody_account_id === binance.id)!.quantity - 0.2) < 1e-10);
    assert.ok(Math.abs(afterPositions.find((row) => row.custody_account_id === ledger.id)!.quantity - 0.1999) < 1e-10);
    assert.ok(Math.abs(after.totals.marketValue - 29_992.5) < 1e-8);
    assert.ok(Math.abs(after.totals.costBasis - 24_017.994) < 1e-8);
    assert.ok(Math.abs(after.totals.unrealizedPnl! - 5_974.506) < 1e-8);
    assert.ok(Math.abs(sales[0].realized_pnl! - 974) < 1e-8);
    assert.ok(Math.abs(after.totals.total - 56_942.5) < 1e-8);
    assert.equal(after.transactions.length, 4, 'deposit, buy, transfer and sell are retained in one domain history');
    assert.equal((await database.select().from(assets)).length, 1, 'USDT cash stays in the ledger and is not created again as a token asset');

    const registryRows = await database.select().from(accountRegistry);
    const cryptoAssets = await database.select().from(assets);
    const global = buildPortfolioSummary(input({ legacyAssets: cryptoAssets, registry: registryRows }));
    assert.ok(Math.abs(global.totalNetWorth - after.totals.total) < 1e-8, 'the global wealth aggregation includes crypto asset value and stablecoin cash exactly once');
  } finally { client.close(); }
});

test('crypto existing wealth initialization supports known and unknown basis, cash opening, custody transfers, and later sales', async () => {
  const { client, database } = await fixture();
  try {
    const now = new Date().toISOString();
    const [binance] = await database.insert(accountRegistry).values({ name: 'Binance TEST', type: 'crypto_exchange', custody_type: 'EXCHANGE', currency: 'USDT', current_balance: 0, status: 'active', created_at: now, updated_at: now }).returning();
    const [ledger] = await database.insert(accountRegistry).values({ name: 'Ledger TEST', type: 'crypto_wallet', custody_type: 'COLD_WALLET', currency: 'USDT', current_balance: 0, status: 'active', created_at: now, updated_at: now }).returning();
    const [btc] = await database.insert(assets).values({ name: 'Bitcoin', symbol: 'BTC', asset_class: 'crypto', purpose: 'wealth_compounder', current_value: 0, currency: 'USDT', quantity: 0, cost_basis: 0, include_in_total_net_worth: true, include_in_investment_net_worth: true, is_archived: false, created_at: now, updated_at: now }).returning();
    const [eth] = await database.insert(assets).values({ name: 'Ethereum', symbol: 'ETH', asset_class: 'crypto', purpose: 'wealth_compounder', current_value: 0, currency: 'USDT', quantity: 0, cost_basis: 0, include_in_total_net_worth: true, include_in_investment_net_worth: true, is_archived: false, created_at: now, updated_at: now }).returning();

    await recordCryptoOpeningPosition({ custodyAccountId: ledger.id, assetId: btc.id, quantity: 1.2, costBasisMode: 'average', costBasisValue: 55_000, date: '2026-01-01' }, database);
    const ledgerOpening = (await database.select().from(transactions).where(eq(transactions.type, 'opening_position')))[0];
    await correctCryptoOpeningPosition({ transactionId: ledgerOpening.id, custodyAccountId: ledger.id, assetId: btc.id, quantity: 1.2, costBasisMode: 'average', costBasisValue: 55_000, date: '2026-01-01' }, database);
    await recordCryptoOpeningBalance({ custodyAccountId: binance.id, amount: 20_000, date: '2026-01-01' }, database);
    await recordCryptoOpeningPosition({ custodyAccountId: binance.id, assetId: btc.id, quantity: 0.3, costBasisMode: 'total', costBasisValue: 18_000, date: '2026-01-01' }, database);
    await recordCryptoOpeningPosition({ custodyAccountId: binance.id, assetId: eth.id, quantity: 2, costBasisMode: 'unknown', date: '2026-01-01' }, database);
    await setCryptoMarketPrice(btc.id, 75_000, database);
    await setCryptoMarketPrice(eth.id, 4_000, database);

    let workspace = await getCryptoWorkspaceData(database, 25_500);
    const btcEconomic = workspace.positionsByAsset.find((row) => row.asset.id === btc.id)!;
    const ethEconomic = workspace.positionsByAsset.find((row) => row.asset.id === eth.id)!;
    assert.equal(btcEconomic.quantity, 1.5);
    assert.equal(btcEconomic.basis, 84_000);
    assert.equal(btcEconomic.value, 112_500);
    assert.equal(btcEconomic.gainLoss, 28_500);
    assert.equal(ethEconomic.quantity, 2);
    assert.equal(ethEconomic.value, 8_000);
    assert.equal(ethEconomic.costBasisKnown, false);
    assert.equal(ethEconomic.gainLoss, null, 'unknown basis must not report market value as profit');
    assert.equal(workspace.totals.unrealizedPnl, null, 'portfolio unrealized P&L is unknown while any open position basis is unknown');
    assert.equal(workspace.totals.cash, 20_000);
    assert.equal(workspace.accounts.find((row) => row.account.id === ledger.id)!.cash, 0, 'opening a coin has no cash effect');
    const openingRows = (await database.select().from(transactions)).filter((row) => ['opening_position','opening_balance'].includes(row.type));
    assert.equal(openingRows.length, 4);
    assert.ok(openingRows.every((row) => row.realized_pnl == null));
    assert.equal((await database.select().from(ledgerEntries)).filter((row) => row.entry_type === 'cash_credit' && row.transaction_id != null).length, 1, 'only the opening stablecoin balance changes cash');
    assert.equal((await database.select().from(transactions)).filter((row) => ['dividend','interest'].includes(row.type)).length, 0);
    const netWorthBeforeBasis = workspace.totals.total;
    await supplyCryptoCostBasis({ custodyAccountId: binance.id, assetId: eth.id, totalCostBasis: 5_000, date: '2026-03-01' }, database);
    workspace = await getCryptoWorkspaceData(database, 25_500);
    assert.equal(workspace.positionsByAsset.find((row) => row.asset.id === eth.id)!.quantity, 2);
    assert.equal(workspace.positionsByAsset.find((row) => row.asset.id === eth.id)!.gainLoss, 3_000);
    assert.equal(workspace.totals.cash, 20_000);
    assert.equal(workspace.totals.total, netWorthBeforeBasis, 'supplying basis later changes no cash or net worth');
    assert.equal(workspace.totals.unrealizedPnl, 31_500);

    // Known-basis scenario A: 1.20 BTC at 55,000, no synthetic cash flow.
    const ledgerPosition = (await database.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.custody_account_id, ledger.id))).find((row) => row.asset_id === btc.id)!;
    assert.equal(ledgerPosition.quantity, 1.2);
    assert.equal(ledgerPosition.cost_basis, 66_000);
    assert.equal(ledgerPosition.cost_basis_known, true);
    assert.equal(ledgerPosition.cost_basis / ledgerPosition.quantity, 55_000);
    assert.equal(workspace.accounts.find((row) => row.account.id === ledger.id)!.totalValue, 90_000);
    assert.equal(workspace.positions.find((row) => row.asset.id === btc.id && row.account?.id === ledger.id)!.gainLoss, 24_000);
    const initialGlobal = buildPortfolioSummary(input({ legacyAssets: await database.select().from(assets), registry: await database.select().from(accountRegistry) }));
    assert.equal(initialGlobal.totalNetWorth, workspace.totals.total, 'opening asset market values and opening stablecoin are included once in global wealth');

    // Transfer part of the known opening lot; basis follows custody without realized P&L.
    await recordCryptoTransaction({ type: 'transfer', fromCustodyAccountId: ledger.id, toCustodyAccountId: binance.id, assetId: btc.id, date: '2026-02-01', currency: 'USDT', quantity: 0.2 }, database);
    let transferWorkspace = await getCryptoWorkspaceData(database, 25_500);
    assert.equal(transferWorkspace.positionsByAsset.find((row) => row.asset.id === btc.id)!.quantity, 1.5, 'custody transfer preserves global quantity');
    const transferredPosition = (await database.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.custody_account_id, binance.id))).find((row) => row.asset_id === btc.id)!;
    assert.equal(transferredPosition.quantity, 0.5);
    assert.equal(transferredPosition.cost_basis, 29_000, 'destination basis combines its opening 0.3 BTC and received 0.2 BTC carrying basis');
    assert.equal(transferredPosition.cost_basis_known, true);
    assert.equal(transferWorkspace.totals.realizedPnl, 0);
    await assert.rejects(correctCryptoOpeningPosition({ transactionId: ledgerOpening.id, custodyAccountId: ledger.id, assetId: btc.id, quantity: 1.2, costBasisMode: 'average', costBasisValue: 55_000, date: '2026-01-01' }, database), /later activity/);

    await recordCryptoTransaction({ type: 'sell', custodyAccountId: binance.id, assetId: btc.id, date: '2026-02-02', currency: 'USDT', quantity: 0.1, price: 70_000, fees: 0 }, database);
    workspace = await getCryptoWorkspaceData(database, 25_500);
    const btcAfterSale = workspace.positionsByAsset.find((row) => row.asset.id === btc.id)!;
    assert.equal(btcAfterSale.quantity, 1.4);
    assert.equal(btcAfterSale.basis, 78_200);
    assert.equal((await database.select().from(transactions).where(eq(transactions.type, 'sell')))[0].realized_pnl, 1_200);
    assert.equal(workspace.totals.cash, 27_000);
    assert.equal(workspace.totals.total, 27_000 + btcAfterSale.value + 8_000);
    assert.equal(workspace.totals.unrealizedPnl, 29_800);
    assert.equal(workspace.totals.realizedPnl, 1_200);
  } finally { client.close(); }
});
const now = '2026-09-28T00:00:00.000Z';
const asset = (extra = {}) => ({ id: 1, name: 'Test holding', symbol: null, asset_class: 'stock', purpose: 'wealth_compounder', current_value: 100, currency: 'USD', quantity: 10, cost_basis: 80, notes: null, is_archived: false, cash_source_type: null, cash_source_id: null, include_in_investment_net_worth: true, include_in_total_net_worth: true, created_at: now, updated_at: now, ...extra } as schema.Asset);
const registry = (extra = {}) => ({ id: 1, name: 'Fixture cash', type: 'broker_account', institution: null, bank_account_id: null, account_number_masked: null, currency: 'USD', current_balance: 200, status: 'active', notes: null, created_at: now, updated_at: now, ...extra } as schema.AccountRegistry);
const bank = (extra = {}) => ({ id: 1, bank_name: 'Fixture Bank', account_name: 'Fixture bank cash', account_number: null, account_type: 'Reserve', currency: 'VND', balance: 2500000, purpose: 'liquidity_reserve', custom_purpose: null, vip_tier: null, status: 'active', notes: null, created_at: now, updated_at: now, ...extra } as schema.BankAccount);
const input = (extra: Partial<PortfolioInput> = {}): PortfolioInput => ({ usdVndRate: 25000, legacyAssets: [], accounts: [], deposits: [], creditCards: [], creditFacilities: [], registry: [], ...extra });

test('banking cutover balances, multiple deposits, expected interest and net worth stay separate', async () => {
  const { client, database } = await fixture();
  try {
  const accounts = [bank({ bank_name: 'Vietcombank (VCB)', account_name: 'Current', balance: 200_000_000 })];
  const deposit = (id: number, principal: number) => ({
    id, bank_account_id: 1, bank_name: 'Vietcombank (VCB)', deposit_name: `Opening deposit ${id}`, principal,
    interest_rate: 4, term_months: 12, start_date: '2026-01-01', maturity_date: '2027-01-01',
    interest_payout_type: 'at_maturity', auto_renew: false, status: 'active', notes: null,
    created_at: now, updated_at: now,
  } as schema.BankSavingsDeposit);
  const deposits = [deposit(1, 600_000_000), deposit(2, 400_000_000)];
  const firstProjection = projectSavingsDeposit(deposits[0], '2026-01-01');
  assert.equal(firstProjection.termDays, 365);
  assert.equal(firstProjection.expectedInterest, 24_000_000);
  assert.equal(firstProjection.expectedMaturityValue, 624_000_000);
  assert.equal(firstProjection.daysRemaining, 365);
  const monthlyProjection = projectSavingsDeposit({ ...deposits[0], interest_payout_type: 'monthly' }, '2026-01-01');
  assert.equal(monthlyProjection.expectedInterest, 24_000_000);
  assert.equal(monthlyProjection.expectedMaturityValue, 600_000_000, 'periodically paid interest is not silently compounded or included at maturity');
  assert.equal(getMaturityStatus(-1), 'Matured');
  assert.equal(getMaturityStatus(0), 'Due Today');
  assert.equal(getMaturityStatus(7), 'Due in 7 days');
  assert.equal(getMaturityStatus(30), 'Due in 30 days');

  const summary = computeBankingSummary({ accounts, deposits, creditCards: [], creditFacilities: [], legacyAssets: [] }, 25_500);
  assert.equal(summary.checkingBalance, 200_000_000);
  assert.equal(summary.savingsBalance, 1_000_000_000);
  assert.equal(summary.totalBankingValue, 1_200_000_000, 'liquid cash and deposit principal count once each');
  assert.equal(summary.expectedInterest, 40_000_000, 'multiple same-bank deposits aggregate');
  assert.equal(summary.expectedMaturityValue, 1_040_000_000);
  assert.equal(summary.institutionBreakdown.length, 1);
  assert.equal(summary.institutionBreakdown[0].liquidCash + summary.institutionBreakdown[0].savingsPrincipal, 1_200_000_000);

  const linkedRegistry = registry({ bank_account_id: 1, current_balance: 99_000_000_000 });
  const global = buildPortfolioSummary(input({ usdVndRate: 25_500, accounts, deposits, registry: [linkedRegistry] }));
  assert.equal(global.totalNetWorth, 1_200_000_000 / 25_500, 'linked registry projection is omitted; expected future interest is not Net Worth');
  assert.equal(global.activeAssetValueUsd, global.totalNetWorth);
  await database.insert(schema.bankAccounts).values({ bank_name: 'Vietcombank (VCB)', account_name: 'Opening cash', currency: 'VND', balance: 200_000_000, created_at: now, updated_at: now });
  await database.insert(schema.bankSavingsDeposits).values(deposits.map(({ id: _id, ...row }) => row));
  assert.equal((await database.select().from(transactions)).length, 0, 'opening bank cash and existing deposit records do not create income or transactions');
  assert.equal((await database.select().from(schema.ledgerEntries)).length, 0);
  } finally { client.close(); }
});
const txn = (extra: Partial<LifecycleTransactionInput> = {}): LifecycleTransactionInput => ({ assetId: 1, type: 'buy', transactionDate: '2026-09-28', settlementDate: null, quantity: 10, price: 10, amount: 100, totalAmount: 100, grossProceeds: null, currency: 'USD', fees: 2, tax: 0, fundingAccountId: 1, executionAccountId: 1, custodyAccountId: 1, receiveAccountId: null, fromCustodyAccountId: null, toCustodyAccountId: null, transferFee: null, notes: null, ...extra });

test('personal wealth MVP aggregation combines five domains, liabilities, FX and ownership exactly once', async () => {
  const { client, database } = await fixture();
  try {
    // Synthetic fixture values only; no owner property or portfolio data.
    const stamp = new Date().toISOString();
    await database.insert(schema.bankAccounts).values({ bank_name: 'Vietcombank (VCB)', account_name: 'Liquid cash', account_type: 'Reserve', currency: 'VND', balance: 200_000_000, purpose: 'liquidity_reserve', status: 'active', created_at: stamp, updated_at: stamp });
    await database.insert(schema.bankSavingsDeposits).values({ bank_name: 'Vietcombank (VCB)', deposit_name: 'Existing savings', principal: 1_000_000_000, interest_rate: 4, term_months: 12, start_date: '2026-01-01', maturity_date: '2027-01-01', interest_payout_type: 'at_maturity', auto_renew: false, status: 'active', created_at: stamp, updated_at: stamp });
    await database.insert(accountRegistry).values([
      { name: 'ACBS TEST', type: 'broker_account', institution: 'ACBS', currency: 'VND', current_balance: 100_000_000, status: 'active', created_at: stamp, updated_at: stamp },
      { name: 'Cold Wallet TEST', type: 'crypto_wallet', custody_type: 'COLD_WALLET', institution: 'Cold Wallet TEST', currency: 'USDT', current_balance: 20_000, status: 'active', created_at: stamp, updated_at: stamp },
    ]);
    await database.insert(assets).values([
      { name: 'VCB', symbol: 'VCB', asset_class: 'stock', purpose: 'wealth_compounder', current_value: 700_000_000, currency: 'VND', quantity: 10_000, cost_basis: 550_000_000, cost_basis_known: true, include_in_total_net_worth: true, include_in_investment_net_worth: true, is_archived: false, created_at: stamp, updated_at: stamp },
      { name: 'Bitcoin TEST', symbol: 'BTC', asset_class: 'crypto', purpose: 'wealth_compounder', current_value: 80_000, currency: 'USD', quantity: 1, cost_basis: 60_000, include_in_total_net_worth: true, include_in_investment_net_worth: true, is_archived: false, created_at: stamp, updated_at: stamp },
      { name: 'Synthetic Gold Fixture', asset_class: 'gold', purpose: 'store_of_value', current_value: 300_000_000, currency: 'VND', cost_basis: 0, cost_basis_known: false, gold_purity: '9999 / 24K', gold_form: 'ring', gold_weight: 3, gold_weight_unit: 'lượng', ownership_label: 'Gia đình', include_in_total_net_worth: true, include_in_investment_net_worth: true, is_archived: false, created_at: stamp, updated_at: stamp },
      { name: 'Synthetic Land Fixture', asset_class: 'real_estate', property_type: 'land', purpose: 'store_of_value', current_value: 2_000_000_000, currency: 'VND', quantity: 100, cost_basis: 1_500_000_000, ownership_percentage: 100, purchase_price: 1_450_000_000, acquisition_costs: 50_000_000, property_area_sqm: 100, property_width_m: 5, property_length_m: 20, property_value_per_sqm: 20_000_000, include_in_total_net_worth: true, include_in_investment_net_worth: true, is_archived: false, created_at: stamp, updated_at: stamp },
    ]);
    await database.insert(schema.bankCreditCards).values({ bank_name: 'VCB', card_name: 'Fixture liability', current_used: 200_000_000, status: 'active', created_at: stamp, updated_at: stamp });
    const portfolio = buildPortfolioSummary(input({ usdVndRate: 25_000, legacyAssets: await database.select().from(assets), accounts: await database.select().from(schema.bankAccounts), deposits: await database.select().from(schema.bankSavingsDeposits), creditCards: await database.select().from(schema.bankCreditCards), registry: await database.select().from(accountRegistry) }));
    const actual = buildPersonalWealthSummaryVnd(portfolio);
    const depositProjection = projectSavingsDeposit((await database.select().from(schema.bankSavingsDeposits))[0], '2026-01-01');
    assert.equal(depositProjection.expectedInterest, 40_000_000);
    assert.equal(actual.banking, 1_200_000_000);
    assert.equal(actual.stocks, 800_000_000);
    assert.equal(actual.crypto, 2_500_000_000);
    assert.equal(actual.gold, 300_000_000);
    const goldFixture = (await database.select().from(assets)).find((row) => row.asset_class === 'gold')!;
    assert.equal(goldFixture.cost_basis_known, false, 'unknown gold basis remains unknown while market value counts');
    assert.equal(actual.realEstate, 2_000_000_000);
    assert.equal(actual.totalAssets, 6_800_000_000);
    assert.equal(actual.liabilities, 200_000_000);
    assert.equal(actual.netWorth, 6_600_000_000);
    const halfShare = buildPortfolioSummary(input({ usdVndRate: 25_000, legacyAssets: (await database.select().from(assets)).map((row) => row.asset_class === 'real_estate' ? { ...row, ownership_percentage: 50 } : row) }));
    assert.equal(buildPersonalWealthSummaryVnd(halfShare).realEstate, 1_000_000_000, 'ownership applies once to whole-property market value');
    assert.equal(2_000_000_000 * 0.5 - 1_500_000_000 * 0.5, 250_000_000, 'whole-property cost basis is attributed with the same ownership share once');
    assert.ok((await client.execute('PRAGMA table_info(assets)')).rows.some((column) => column.name === 'gold_purity'));
    assert.equal((await client.execute('PRAGMA integrity_check')).rows[0].integrity_check, 'ok');
  } finally { client.close(); }
});

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
  assert.equal(isLocalRequest(new Headers({ host: 'localhost:3100', origin: 'http://localhost:3100', 'sec-fetch-site': 'same-origin' }), true, 'development'), true);
  assert.equal(isLocalRequest(new Headers({ host: '127.0.0.1:3100', origin: 'http://127.0.0.1:3100', 'sec-fetch-site': 'same-origin' }), true, 'development'), true);
  assert.equal(isLocalRequest(new Headers({ host: 'localhost:3100', origin: 'http://127.0.0.1:3100', 'sec-fetch-site': 'same-origin' }), true, 'development'), false);
  assert.equal(isLocalRequest(new Headers({ ...good, 'x-forwarded-host': good.host }), true), true);
  for (const bad of [{ ...good, host: '192.168.1.1:3001' }, { ...good, origin: 'https://evil.invalid' }, { ...good, 'sec-fetch-site': 'cross-site' }, { ...good, 'x-forwarded-host': 'evil.invalid' }, { host: good.host }]) assert.equal(isLocalRequest(new Headers(bad), true), false);
  for (const bad of [
    { host: 'localhost:3002', origin: 'http://localhost:3002', 'sec-fetch-site': 'same-origin' },
    { host: 'localhost:3100', origin: 'http://evil.invalid:3100', 'sec-fetch-site': 'cross-site' },
    { host: 'wealth.example:3100', origin: 'http://wealth.example:3100', 'sec-fetch-site': 'same-origin' },
    { host: '192.168.1.20:3100', origin: 'http://192.168.1.20:3100', 'sec-fetch-site': 'same-origin' },
  ]) assert.equal(isLocalRequest(new Headers(bad), true, 'development'), false);
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
    assert.ok((await client.execute('PRAGMA table_info(account_registry)')).rows.some((column) => column.name === 'custody_type'));
  } finally { client.close(); }
});

test('FX conversions reject unsupported currency and invalid rates rather than assume USD', () => {
  assert.equal(normalizeToUsd(2500000, 'VND', 25000), 100);
  assert.equal(convertCurrency(100, 'USD', 'VND', 25000), 2500000);
  assert.equal(normalizeToUsd(100, 'USDT'), 100);
  assert.equal(normalizeToUsd(100, 'USDC'), 100);
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
