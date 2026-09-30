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
import { asc, desc, eq } from 'drizzle-orm';
import { createLifecycleTransaction, type LifecycleTransactionInput } from './asset-lifecycle';
import { normalizeToUsd } from './fx';
import { getUsdVndRate } from './settings';

const EPSILON = 1e-8;
type Store = typeof db;

export interface StockPositionRow {
  asset: Asset;
  broker: AccountRegistry | null;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  costBasis: number;
  marketValue: number;
  gainLoss: number;
  gainLossPct: number | null;
  weight: number;
}

export interface StockBrokerSummary {
  account: AccountRegistry;
  cash: number;
  stockValue: number;
  totalValue: number;
  realizedPnl: number;
  unrealizedPnl: number;
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

export async function getStockWorkspaceData() {
  const rate = await getUsdVndRate();
  const [brokers, positions, allAssets, allTransactions, allLedgerEntries] = await Promise.all([
    db.select().from(accountRegistry).where(eq(accountRegistry.type, 'broker_account')).orderBy(asc(accountRegistry.name)),
    db.select().from(assetCustodyPositions),
    db.select().from(assets).where(eq(assets.asset_class, 'stock')),
    db.select().from(transactions).orderBy(desc(transactions.transaction_date), desc(transactions.created_at)),
    db.select().from(ledgerEntries),
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
    const gainLoss = marketValue - position.cost_basis;
    return [{
      asset,
      broker,
      quantity: position.quantity,
      averageCost: position.cost_basis / position.quantity,
      currentPrice,
      costBasis: position.cost_basis,
      marketValue,
      gainLoss,
      gainLossPct: position.cost_basis > EPSILON ? gainLoss / position.cost_basis * 100 : null,
      weight: 0,
    }];
  });
  const custodyAssetIds = new Set(positions.map((position) => position.asset_id));
  const unassignedLegacyPositions = allAssets.filter((asset) => !asset.is_archived && (asset.quantity ?? 0) > EPSILON && !custodyAssetIds.has(asset.id));
  for (const asset of unassignedLegacyPositions) {
    const quantity = asset.quantity ?? 0;
    const costBasis = asset.cost_basis ?? 0;
    stockPositions.push({
      asset,
      broker: null,
      quantity,
      averageCost: costBasis / quantity,
      currentPrice: asset.current_value / quantity,
      costBasis,
      marketValue: asset.current_value,
      gainLoss: asset.current_value - costBasis,
      gainLossPct: costBasis > EPSILON ? (asset.current_value - costBasis) / costBasis * 100 : null,
      weight: 0,
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
    const realizedPnl = accountTxns.filter((txn) => txn.type === 'sell').reduce((sum, txn) => sum + normalizeToUsd(txn.realized_pnl ?? 0, txn.currency, rate) * (account.currency === 'VND' ? rate : 1), 0);
    const unrealizedPnl = accountPositions.reduce((sum, position) => sum + normalizeToUsd(position.gainLoss, position.asset.currency, rate) * (account.currency === 'VND' ? rate : 1), 0);
    const cash = cashByBroker.get(account.id) ?? 0;
    return { account, cash, stockValue, totalValue: cash + stockValue, realizedPnl, unrealizedPnl };
  });

  const relatedTransactions = allTransactions.filter((txn) => brokers.some((broker) => transactionBelongsToBroker(txn, broker.id))
    && (txn.asset_id == null || assetMap.has(txn.asset_id)));
  const dividendIncomeVnd = relatedTransactions.filter((txn) => txn.type === 'dividend').reduce((sum, txn) => {
    const gross = txn.gross_proceeds ?? txn.amount + (txn.tax ?? 0);
    return sum + convertToVnd(gross, txn.currency, rate);
  }, 0);
  const costBasisVnd = stockPositions.reduce((sum, position) => sum + convertToVnd(position.costBasis, position.asset.currency, rate), 0);
  const unrealizedPnlVnd = stockPositions.reduce((sum, position) => sum + convertToVnd(position.gainLoss, position.asset.currency, rate), 0);
  const realizedPnlVnd = relatedTransactions.filter((txn) => txn.type === 'sell').reduce((sum, txn) => sum + convertToVnd(txn.realized_pnl ?? 0, txn.currency, rate), 0);
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
