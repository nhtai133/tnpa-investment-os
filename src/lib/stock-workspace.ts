import { db } from '@/db';
import {
  accountRegistry,
  assetCustodyPositions,
  assets,
  ledgerEntries,
  transactions,
  type AccountRegistry,
  type Asset,
  type TransactionType,
} from '@/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { createLifecycleTransaction, type LifecycleTransactionInput } from './asset-lifecycle';
import { normalizeToUsd } from './fx';
import { getUsdVndRate } from './settings';

const EPSILON = 1e-8;
type Store = typeof db;

export interface StockPositionRow {
  asset: Asset;
  broker: AccountRegistry | null;
  quantity: number;
  averageCost: number | null;
  currentPrice: number;
  costBasis: number | null;
  costBasisKnown: boolean;
  marketValue: number;
  gainLoss: number | null;
  gainLossPct: number | null;
  weight: number;
  openingTransactionId: number | null;
  openingDate: string;
  canCorrectOpening: boolean;
}

export interface StockBrokerSummary {
  account: AccountRegistry;
  cash: number;
  stockValue: number;
  totalValue: number;
  realizedPnl: number | null;
  unrealizedPnl: number | null;
}

export function convertToVnd(value: number, currency: string, usdVndRate: number) {
  return normalizeToUsd(value, currency, usdVndRate) * usdVndRate;
}

export async function getLedgerCashBalance(accountId: number, database: Store = db) {
  const entries = await database.select().from(ledgerEntries).where(eq(ledgerEntries.account_id, accountId));
  return entries.reduce((sum, entry) => {
    if (entry.entry_type !== 'cash_credit' && entry.entry_type !== 'cash_debit') return sum;
    return sum + (entry.amount ?? 0);
  }, 0);
}

export interface StockTransactionInput {
  type: Extract<TransactionType, 'deposit' | 'withdraw' | 'buy' | 'sell' | 'dividend' | 'fee'>;
  brokerAccountId: number;
  date: string;
  currency: string;
  assetId?: number | null;
  quantity?: number | null;
  price?: number | null;
  amount?: number;
  fees?: number;
  tax?: number;
}

export interface StockOpeningPositionInput {
  brokerAccountId: number;
  assetId: number;
  quantity: number;
  costBasisMode: 'average' | 'total' | 'unknown';
  costBasisValue?: number;
  date: string;
  marketPrice?: number;
  notes?: string;
}

function validIsoDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function transactionUsesBroker(txn: typeof transactions.$inferSelect, brokerId: number) {
  return [txn.funding_account_id, txn.execution_account_id, txn.custody_account_id, txn.receive_account_id, txn.from_custody_account_id, txn.to_custody_account_id].includes(brokerId);
}

function openingBasis(input: Pick<StockOpeningPositionInput, 'quantity' | 'costBasisMode' | 'costBasisValue'>) {
  if (!['average', 'total', 'unknown'].includes(input.costBasisMode)) throw new Error('Choose a valid cost basis option.');
  if (input.costBasisMode === 'unknown') return 0;
  if (!(input.costBasisValue! > 0) || !Number.isFinite(input.costBasisValue)) throw new Error('Enter a positive acquisition cost.');
  return input.costBasisMode === 'average' ? input.quantity * input.costBasisValue! : input.costBasisValue!;
}

export async function recordStockOpeningBalance(input: { brokerAccountId: number; amount: number; date: string; notes?: string }, database: Store = db) {
  if (!(input.amount > 0) || !Number.isFinite(input.amount)) throw new Error('Enter an opening cash balance greater than zero.');
  if (!validIsoDate(input.date)) throw new Error('Enter a valid opening balance date.');
  const [account] = await database.select().from(accountRegistry).where(eq(accountRegistry.id, input.brokerAccountId)).limit(1);
  if (!account || account.type !== 'broker_account' || account.status !== 'active') throw new Error('Select an active broker account.');
  await database.transaction(async (tx) => {
    const history = await tx.select().from(transactions);
    if (history.some((row) => row.type === 'opening_balance' && transactionUsesBroker(row, account.id))) throw new Error('An opening cash balance is already recorded for this broker.');
    const cashHistory = await tx.select().from(ledgerEntries).where(eq(ledgerEntries.account_id, account.id));
    if (Math.abs(account.current_balance) > EPSILON || cashHistory.some((entry) => ['cash_credit', 'cash_debit'].includes(entry.entry_type))) throw new Error('This broker already has a cash balance or cash activity. Opening cash must be initialized before deposits and trades.');
    const now = new Date().toISOString();
    const [opening] = await tx.insert(transactions).values({
      asset_id: null, type: 'opening_balance', transaction_date: input.date, settlement_date: null,
      quantity: null, price: null, amount: input.amount, total_amount: null, gross_proceeds: null,
      currency: account.currency, fees: null, tax: null, funding_account_id: null, execution_account_id: null,
      custody_account_id: account.id, receive_account_id: account.id, from_custody_account_id: null,
      to_custody_account_id: null, transfer_fee: null, realized_pnl: null,
      notes: input.notes?.trim() || 'Opening broker cash; existing wealth at tracking start.', created_at: now, updated_at: now,
    }).returning();
    await tx.insert(ledgerEntries).values({ transaction_id: opening.id, account_id: account.id, asset_id: null, entry_type: 'cash_credit', amount: input.amount, currency: account.currency, description: 'Opening broker cash. No income recognized.', created_at: now });
    await tx.update(accountRegistry).set({ current_balance: account.current_balance + input.amount, updated_at: now }).where(eq(accountRegistry.id, account.id));
  });
}

export async function recordStockOpeningPosition(input: StockOpeningPositionInput, database: Store = db): Promise<number> {
  if (!(input.quantity > 0) || !Number.isFinite(input.quantity)) throw new Error('Enter a positive share quantity.');
  if (!validIsoDate(input.date)) throw new Error('Enter a valid opening position date.');
  const basis = openingBasis(input);
  if (input.marketPrice != null && (!Number.isFinite(input.marketPrice) || input.marketPrice < 0)) throw new Error('Market price must be finite and nonnegative.');
  const [account] = await database.select().from(accountRegistry).where(eq(accountRegistry.id, input.brokerAccountId)).limit(1);
  const [asset] = await database.select().from(assets).where(eq(assets.id, input.assetId)).limit(1);
  if (!account || account.type !== 'broker_account' || account.status !== 'active') throw new Error('Select an active broker account.');
  if (!asset || asset.asset_class !== 'stock') throw new Error('Select a stock ticker.');
  if (account.currency !== asset.currency) throw new Error('Broker account and stock currencies must match.');

  return database.transaction(async (tx) => {
    const history = await tx.select().from(transactions).where(eq(transactions.asset_id, asset.id));
    if (history.some((row) => transactionUsesBroker(row, account.id))) throw new Error('This broker already has activity for this stock; an opening position cannot be added afterward.');
    const positions = await tx.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.asset_id, asset.id));
    const existingQuantity = positions.reduce((sum, row) => sum + row.quantity, 0);
    if (asset.quantity != null && Math.abs(asset.quantity - existingQuantity) > EPSILON) throw new Error('This ticker has an unassigned or inconsistent holding. Reconcile it before adding broker custody to prevent double counting.');
    const [existing] = await tx.select().from(assetCustodyPositions).where(and(eq(assetCustodyPositions.asset_id, asset.id), eq(assetCustodyPositions.custody_account_id, account.id))).limit(1);
    if (existing && existing.quantity > EPSILON) throw new Error('An opening position already exists at this broker.');
    const known = input.costBasisMode !== 'unknown';
    const now = new Date().toISOString();
    const [opening] = await tx.insert(transactions).values({
      asset_id: asset.id, type: 'opening_position', transaction_date: input.date, settlement_date: null,
      quantity: input.quantity, price: input.costBasisMode === 'average' ? input.costBasisValue! : null,
      amount: basis, total_amount: input.costBasisMode === 'total' ? input.costBasisValue! : null,
      gross_proceeds: null, currency: asset.currency, fees: null, tax: null, funding_account_id: null,
      execution_account_id: null, custody_account_id: account.id, receive_account_id: null,
      from_custody_account_id: null, to_custody_account_id: null, transfer_fee: null, realized_pnl: null,
      notes: [input.costBasisMode === 'unknown' ? 'Cost basis unknown.' : null, input.notes?.trim() || null].filter(Boolean).join(' ') || null,
      created_at: now, updated_at: now,
    }).returning();
    if (existing) await tx.update(assetCustodyPositions).set({ quantity: existing.quantity + input.quantity, cost_basis: existing.cost_basis + basis, cost_basis_known: existing.cost_basis_known && known, updated_at: now }).where(eq(assetCustodyPositions.id, existing.id));
    else await tx.insert(assetCustodyPositions).values({ asset_id: asset.id, custody_account_id: account.id, quantity: input.quantity, cost_basis: basis, cost_basis_known: known, updated_at: now });
    await tx.insert(ledgerEntries).values({ transaction_id: opening.id, account_id: account.id, asset_id: asset.id, entry_type: 'asset_debit', quantity: input.quantity, amount: basis, currency: asset.currency, description: 'Opening stock position. No cash movement.', created_at: now });
    const updatedPositions = await tx.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.asset_id, asset.id));
    const totalQuantity = updatedPositions.reduce((sum, row) => sum + row.quantity, 0);
    const totalBasis = updatedPositions.reduce((sum, row) => sum + row.cost_basis, 0);
    const basisKnown = updatedPositions.filter((row) => row.quantity > EPSILON).every((row) => row.cost_basis_known);
    const currentPrice = input.marketPrice ?? ((asset.quantity ?? 0) > EPSILON ? asset.current_value / asset.quantity! : 0);
    await tx.update(assets).set({ quantity: totalQuantity, cost_basis: totalBasis, cost_basis_known: basisKnown, current_value: totalQuantity * currentPrice, is_archived: false, updated_at: now }).where(eq(assets.id, asset.id));
    return opening.id;
  });
}

export async function correctStockOpeningPosition(input: StockOpeningPositionInput & { transactionId: number }, database: Store = db) {
  const [opening] = await database.select().from(transactions).where(eq(transactions.id, input.transactionId)).limit(1);
  if (!opening || opening.type !== 'opening_position' || opening.asset_id !== input.assetId || opening.custody_account_id !== input.brokerAccountId) throw new Error('Opening entry was not found for this position.');
  if (!(input.quantity > 0) || !Number.isFinite(input.quantity) || !validIsoDate(input.date)) throw new Error('Enter a positive quantity and valid date.');
  const basis = openingBasis(input);
  if (input.marketPrice != null && (!Number.isFinite(input.marketPrice) || input.marketPrice < 0)) throw new Error('Market price must be finite and nonnegative.');
  return database.transaction(async (tx) => {
    const history = await tx.select().from(transactions).where(eq(transactions.asset_id, input.assetId));
    const linked = history.filter((row) => transactionUsesBroker(row, input.brokerAccountId));
    if (linked.length !== 1 || linked[0].id !== opening.id) throw new Error('This opening position already has later activity. Add an auditable adjustment; the history cannot be overwritten.');
    const [asset] = await tx.select().from(assets).where(eq(assets.id, input.assetId)).limit(1);
    const [position] = await tx.select().from(assetCustodyPositions).where(and(eq(assetCustodyPositions.asset_id, input.assetId), eq(assetCustodyPositions.custody_account_id, input.brokerAccountId))).limit(1);
    if (!asset || !position || position.quantity <= EPSILON) throw new Error('The opening position is no longer open.');
    const now = new Date().toISOString();
    const known = input.costBasisMode !== 'unknown';
    await tx.update(transactions).set({ transaction_date: input.date, quantity: input.quantity, price: input.costBasisMode === 'average' ? input.costBasisValue! : null, amount: basis, total_amount: input.costBasisMode === 'total' ? input.costBasisValue! : null, notes: [input.costBasisMode === 'unknown' ? 'Cost basis unknown.' : null, input.notes?.trim() || null].filter(Boolean).join(' ') || null, updated_at: now }).where(eq(transactions.id, opening.id));
    const ledger = await tx.select().from(ledgerEntries).where(eq(ledgerEntries.transaction_id, opening.id));
    const openingEntry = ledger.find((row) => row.entry_type === 'asset_debit');
    if (!openingEntry) throw new Error('Opening position audit entry was not found.');
    await tx.update(ledgerEntries).set({ quantity: input.quantity, amount: basis, description: 'Opening stock position corrected before later activity.', created_at: now }).where(eq(ledgerEntries.id, openingEntry.id));
    await tx.update(assetCustodyPositions).set({ quantity: input.quantity, cost_basis: basis, cost_basis_known: known, updated_at: now }).where(eq(assetCustodyPositions.id, position.id));
    const positions = await tx.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.asset_id, asset.id));
    const quantity = positions.reduce((sum, row) => sum + (row.id === position.id ? input.quantity : row.quantity), 0);
    const totalBasis = positions.reduce((sum, row) => sum + (row.id === position.id ? basis : row.cost_basis), 0);
    const basisKnown = positions.filter((row) => (row.id === position.id ? input.quantity : row.quantity) > EPSILON).every((row) => row.id === position.id ? known : row.cost_basis_known);
    const price = input.marketPrice ?? ((asset.quantity ?? 0) > EPSILON ? asset.current_value / asset.quantity! : 0);
    await tx.update(assets).set({ quantity, cost_basis: totalBasis, cost_basis_known: basisKnown, current_value: quantity * price, is_archived: false, updated_at: now }).where(eq(assets.id, asset.id));
  });
}

export async function supplyStockCostBasis(input: { brokerAccountId: number; assetId: number; totalCostBasis: number; date: string; notes?: string }, database: Store = db) {
  if (!(input.totalCostBasis >= 0) || !Number.isFinite(input.totalCostBasis) || !validIsoDate(input.date)) throw new Error('Enter a valid nonnegative cost basis and date.');
  const [account] = await database.select().from(accountRegistry).where(eq(accountRegistry.id, input.brokerAccountId)).limit(1);
  const [asset] = await database.select().from(assets).where(eq(assets.id, input.assetId)).limit(1);
  if (!account || account.type !== 'broker_account' || !asset || asset.asset_class !== 'stock' || account.currency !== asset.currency) throw new Error('Choose a valid broker and stock in the same currency.');
  await database.transaction(async (tx) => {
    const [position] = await tx.select().from(assetCustodyPositions).where(and(eq(assetCustodyPositions.asset_id, asset.id), eq(assetCustodyPositions.custody_account_id, account.id))).limit(1);
    if (!position || position.quantity <= EPSILON) throw new Error('Choose an open stock position at this broker.');
    if (position.cost_basis_known) throw new Error('This position already has a known cost basis.');
    const now = new Date().toISOString();
    const [transaction] = await tx.insert(transactions).values({ asset_id: asset.id, type: 'basis_adjustment', transaction_date: input.date, settlement_date: null, quantity: position.quantity, price: null, amount: input.totalCostBasis, total_amount: input.totalCostBasis, gross_proceeds: null, currency: asset.currency, fees: null, tax: null, funding_account_id: null, execution_account_id: null, custody_account_id: account.id, receive_account_id: null, from_custody_account_id: null, to_custody_account_id: null, transfer_fee: null, realized_pnl: null, notes: input.notes?.trim() || 'Previously unknown stock cost basis supplied.', created_at: now, updated_at: now }).returning();
    await tx.insert(ledgerEntries).values({ transaction_id: transaction.id, account_id: account.id, asset_id: asset.id, entry_type: 'basis_adjustment', amount: input.totalCostBasis - position.cost_basis, quantity: null, currency: asset.currency, description: 'Cost basis information only; no cash or market value movement.', created_at: now });
    await tx.update(assetCustodyPositions).set({ cost_basis: input.totalCostBasis, cost_basis_known: true, updated_at: now }).where(eq(assetCustodyPositions.id, position.id));
    const positions = await tx.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.asset_id, asset.id));
    await tx.update(assets).set({ cost_basis: positions.reduce((sum, row) => sum + row.cost_basis, 0), cost_basis_known: positions.filter((row) => row.quantity > EPSILON).every((row) => row.cost_basis_known), updated_at: now }).where(eq(assets.id, asset.id));
  });
}

export async function recordStockTransaction(input: StockTransactionInput, database: Store = db) {
  const [account] = await database.select().from(accountRegistry).where(eq(accountRegistry.id, input.brokerAccountId)).limit(1);
  if (!account || account.type !== 'broker_account' || account.status !== 'active') throw new Error('Select an active broker account.');
  if (account.currency !== input.currency) throw new Error('Broker account and transaction currencies must match. Record any currency conversion separately.');

  let asset: Asset | null = null;
  if (input.assetId) {
    asset = (await database.select().from(assets).where(eq(assets.id, input.assetId)).limit(1))[0] ?? null;
    if (!asset || asset.asset_class !== 'stock' || asset.currency !== input.currency) throw new Error('Select a stock ticker in the broker account currency.');
  }
  if (['buy', 'sell', 'dividend'].includes(input.type) && !asset) throw new Error('Select a stock ticker.');

  const quantity = input.quantity ?? null;
  const price = input.price ?? null;
  const fees = input.fees ?? 0;
  const tax = input.tax ?? 0;
  for (const [label, value] of [['quantity', quantity], ['price', price], ['fees', fees], ['tax', tax], ['amount', input.amount ?? 0]] as const) {
    if (value !== null && (!Number.isFinite(value) || value < 0)) throw new Error(`${label} must be a finite nonnegative amount.`);
  }
  if (['buy', 'sell'].includes(input.type) && (!(quantity! > 0) || !(price! > 0))) throw new Error('Enter a positive quantity and execution price.');
  if ((input.type === 'deposit' || input.type === 'withdraw' || input.type === 'fee') && !(input.amount! > 0)) throw new Error('Enter an amount greater than zero.');
  if (input.type === 'dividend' && (!(input.amount! > 0) || tax > input.amount!)) throw new Error('Gross dividend must be greater than withholding tax.');

  const gross = quantity && price ? quantity * price : input.amount ?? 0;
  const netDividend = input.type === 'dividend' ? gross - tax : gross;
  if (input.type === 'sell' && fees + tax > gross) throw new Error('Fees and tax cannot exceed sale proceeds.');
  const cashOut = input.type === 'buy' ? gross + fees + tax
    : input.type === 'sell' ? 0
      : input.type === 'withdraw' || input.type === 'fee' ? input.amount ?? 0
        : 0;
  if (cashOut > 0) {
    const cash = await getLedgerCashBalance(account.id, database);
    if (cash + EPSILON < cashOut) throw new Error('Insufficient broker cash.');
  }

  const transactionInput: LifecycleTransactionInput = {
    assetId: asset?.id ?? null,
    type: input.type,
    transactionDate: input.date,
    settlementDate: null,
    quantity,
    price,
    amount: input.type === 'dividend' ? netDividend : gross,
    totalAmount: null,
    grossProceeds: input.type === 'sell' || input.type === 'dividend' ? gross : null,
    currency: input.currency,
    fees,
    tax,
    fundingAccountId: ['buy', 'withdraw', 'fee'].includes(input.type) ? account.id : null,
    executionAccountId: ['buy', 'sell'].includes(input.type) ? account.id : null,
    custodyAccountId: ['buy', 'sell'].includes(input.type) ? account.id : null,
    receiveAccountId: ['sell', 'deposit', 'dividend'].includes(input.type) ? account.id : null,
    fromCustodyAccountId: null,
    toCustodyAccountId: null,
    transferFee: null,
    notes: null,
    enforceAvailableCash: true,
  };
  return createLifecycleTransaction(transactionInput, database);
}

export async function setStockMarketPrice(assetId: number, price: number, database: Store = db) {
  if (!Number.isFinite(price) || price < 0) throw new Error('Market price must be a finite nonnegative amount.');
  const asset = (await database.select().from(assets).where(eq(assets.id, assetId)).limit(1))[0];
  if (!asset || asset.asset_class !== 'stock') throw new Error('Stock instrument not found.');
  const quantity = Math.max(0, asset.quantity ?? 0);
  await database.update(assets).set({ current_value: price * quantity, updated_at: new Date().toISOString() }).where(eq(assets.id, assetId));
}

export async function getStockWorkspaceData(database: Store = db, reportingRate?: number) {
  const rate = reportingRate ?? await getUsdVndRate();
  const [brokers, positions, allAssets, allTransactions, allLedgerEntries] = await Promise.all([
    database.select().from(accountRegistry).where(eq(accountRegistry.type, 'broker_account')).orderBy(asc(accountRegistry.name)),
    database.select().from(assetCustodyPositions),
    database.select().from(assets).where(eq(assets.asset_class, 'stock')),
    database.select().from(transactions).orderBy(desc(transactions.transaction_date), desc(transactions.created_at)),
    database.select().from(ledgerEntries),
  ]);
  const brokerMap = new Map(brokers.map((broker) => [broker.id, broker]));
  const assetMap = new Map(allAssets.map((asset) => [asset.id, asset]));
  const cashByBroker = new Map<number, number>();
  for (const entry of allLedgerEntries) {
    if (!entry.account_id || !['cash_credit', 'cash_debit'].includes(entry.entry_type)) continue;
    cashByBroker.set(entry.account_id, (cashByBroker.get(entry.account_id) ?? 0) + (entry.amount ?? 0));
  }

  const stockPositions: StockPositionRow[] = positions.flatMap((position) => {
    const asset = assetMap.get(position.asset_id);
    const broker = brokerMap.get(position.custody_account_id);
    if (!asset || !broker || position.quantity <= EPSILON || asset.is_archived) return [];
    const currentPrice = (asset.quantity ?? 0) > EPSILON ? asset.current_value / asset.quantity! : 0;
    const marketValue = currentPrice * position.quantity;
    const gainLoss = position.cost_basis_known ? marketValue - position.cost_basis : null;
    const openingTransaction = allTransactions.find((txn) => txn.type === 'opening_position' && txn.asset_id === asset.id && txn.custody_account_id === broker.id);
    const linkedActivity = allTransactions.filter((txn) => txn.asset_id === asset.id && transactionUsesBroker(txn, broker.id));
    return [{
      asset,
      broker,
      quantity: position.quantity,
      averageCost: position.cost_basis_known ? position.cost_basis / position.quantity : null,
      currentPrice,
      costBasis: position.cost_basis_known ? position.cost_basis : null,
      costBasisKnown: position.cost_basis_known,
      marketValue,
      gainLoss,
      gainLossPct: position.cost_basis_known && position.cost_basis > EPSILON ? gainLoss! / position.cost_basis * 100 : null,
      weight: 0,
      openingTransactionId: openingTransaction?.id ?? null,
      openingDate: openingTransaction?.transaction_date ?? '',
      canCorrectOpening: Boolean(openingTransaction && linkedActivity.length === 1),
    }];
  });
  const custodyAssetIds = new Set(positions.map((position) => position.asset_id));
  const unassignedLegacyPositions = allAssets.filter((asset) => !asset.is_archived && (asset.quantity ?? 0) > EPSILON && !custodyAssetIds.has(asset.id));
  for (const asset of unassignedLegacyPositions) {
    const quantity = asset.quantity ?? 0;
    const costBasis = asset.cost_basis ?? 0;
    const costBasisKnown = asset.cost_basis_known;
    const gainLoss = costBasisKnown ? asset.current_value - costBasis : null;
    stockPositions.push({
      asset,
      broker: null,
      quantity,
      averageCost: costBasisKnown ? costBasis / quantity : null,
      currentPrice: asset.current_value / quantity,
      costBasis: costBasisKnown ? costBasis : null,
      costBasisKnown,
      marketValue: asset.current_value,
      gainLoss,
      gainLossPct: costBasisKnown && costBasis > EPSILON ? gainLoss! / costBasis * 100 : null,
      weight: 0,
      openingTransactionId: null,
      openingDate: '',
      canCorrectOpening: false,
    });
  }
  const marketValueVnd = stockPositions.reduce((sum, position) => sum + convertToVnd(position.marketValue, position.asset.currency, rate), 0);
  for (const position of stockPositions) {
    position.weight = marketValueVnd > 0 ? convertToVnd(position.marketValue, position.asset.currency, rate) / marketValueVnd * 100 : 0;
  }

  const transactionBelongsToBroker = (txn: typeof allTransactions[number], brokerId: number) => [
    txn.funding_account_id, txn.execution_account_id, txn.custody_account_id, txn.receive_account_id,
    txn.from_custody_account_id, txn.to_custody_account_id,
  ].includes(brokerId);
  const brokerSummaries: StockBrokerSummary[] = brokers.map((account) => {
    const accountPositions = stockPositions.filter((position) => position.broker?.id === account.id);
    const stockValue = accountPositions.reduce((sum, position) => sum + normalizeToUsd(position.marketValue, position.asset.currency, rate) * (account.currency === 'VND' ? rate : 1), 0);
    const accountTxns = allTransactions.filter((txn) => transactionBelongsToBroker(txn, account.id));
    const accountSales = accountTxns.filter((txn) => txn.type === 'sell');
    const realizedPnl = accountSales.every((txn) => txn.realized_pnl != null)
      ? accountSales.reduce((sum, txn) => sum + normalizeToUsd(txn.realized_pnl ?? 0, txn.currency, rate) * (account.currency === 'VND' ? rate : 1), 0)
      : null;
    const unrealizedPnl = accountPositions.every((position) => position.gainLoss != null)
      ? accountPositions.reduce((sum, position) => sum + normalizeToUsd(position.gainLoss ?? 0, position.asset.currency, rate) * (account.currency === 'VND' ? rate : 1), 0)
      : null;
    const cash = cashByBroker.get(account.id) ?? 0;
    return { account, cash, stockValue, totalValue: cash + stockValue, realizedPnl, unrealizedPnl };
  });

  const relatedTransactions = allTransactions.filter((txn) => brokers.some((broker) => transactionBelongsToBroker(txn, broker.id))
    && (txn.asset_id == null || assetMap.has(txn.asset_id)));
  const dividendIncomeVnd = relatedTransactions.filter((txn) => txn.type === 'dividend').reduce((sum, txn) => {
    const gross = txn.gross_proceeds ?? txn.amount + (txn.tax ?? 0);
    return sum + convertToVnd(gross, txn.currency, rate);
  }, 0);
  const costBasisVnd = stockPositions.every((position) => position.costBasisKnown)
    ? stockPositions.reduce((sum, position) => sum + convertToVnd(position.costBasis ?? 0, position.asset.currency, rate), 0)
    : null;
  const unrealizedPnlVnd = stockPositions.every((position) => position.gainLoss != null)
    ? stockPositions.reduce((sum, position) => sum + convertToVnd(position.gainLoss ?? 0, position.asset.currency, rate), 0)
    : null;
  const sales = relatedTransactions.filter((txn) => txn.type === 'sell');
  const realizedPnlVnd = sales.every((txn) => txn.realized_pnl != null)
    ? sales.reduce((sum, txn) => sum + convertToVnd(txn.realized_pnl ?? 0, txn.currency, rate), 0)
    : null;
  const brokerCashVnd = brokerSummaries.reduce((sum, broker) => sum + convertToVnd(broker.cash, broker.account.currency, rate), 0);
  const openAssetIds = new Set(stockPositions.map((position) => position.asset.id));
  const closedAssets = allAssets.filter((asset) => asset.is_archived && !openAssetIds.has(asset.id));

  return {
    rate,
    brokers: brokerSummaries,
    positions: stockPositions,
    transactions: relatedTransactions,
    assets: allAssets,
    assetMap,
    brokerMap,
    totals: {
      marketValueVnd,
      cashVnd: brokerCashVnd,
      workspaceVnd: marketValueVnd + brokerCashVnd,
      costBasisVnd,
      unrealizedPnlVnd,
      realizedPnlVnd,
      dividendIncomeVnd,
    },
    closedAssets,
  };
}
