import { db } from '@/db';
import { accountRegistry, assetCustodyPositions, assets, ledgerEntries, transactions, type AccountRegistry, type Asset, type TransactionType } from '@/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { createLifecycleTransaction, type LifecycleTransactionInput } from './asset-lifecycle';
import { getUsdVndRate } from './settings';
import { normalizeToUsd } from './fx';

const EPSILON = 1e-8;
type Store = typeof db;
export type CryptoActivity = Extract<TransactionType, 'deposit' | 'withdraw' | 'buy' | 'sell' | 'transfer' | 'fee'>;

export interface CryptoTransactionInput {
  type: CryptoActivity;
  custodyAccountId?: number;
  fromCustodyAccountId?: number;
  toCustodyAccountId?: number;
  assetId?: number;
  date: string;
  quantity?: number;
  price?: number;
  fees?: number;
  amount?: number;
  transferFee?: number;
  currency?: string;
}

export interface CryptoOpeningPositionInput {
  custodyAccountId: number;
  assetId: number;
  quantity: number;
  costBasisMode: 'average' | 'total' | 'unknown';
  costBasisValue?: number;
  date: string;
  notes?: string;
  marketPrice?: number;
}

export async function recordCryptoOpeningPosition(input: CryptoOpeningPositionInput, database: Store = db) {
  if (!(input.quantity > 0) || !Number.isFinite(input.quantity)) throw new Error('Enter a positive quantity.');
  if (!['average','total','unknown'].includes(input.costBasisMode)) throw new Error('Choose a valid cost basis option.');
  if (input.costBasisMode !== 'unknown' && (!(input.costBasisValue! > 0) || !Number.isFinite(input.costBasisValue))) throw new Error('Enter a positive acquisition cost.');
  const [account] = await database.select().from(accountRegistry).where(eq(accountRegistry.id, input.custodyAccountId)).limit(1);
  const [asset] = await database.select().from(assets).where(eq(assets.id, input.assetId)).limit(1);
  if (!account || account.status !== 'active' || !['crypto_exchange','crypto_wallet'].includes(account.type)) throw new Error('Choose an active crypto custody source.');
  if (!asset || asset.asset_class !== 'crypto' || ['USDT','USDC'].includes(asset.symbol?.toUpperCase() ?? '')) throw new Error('Choose a crypto asset, not a stablecoin balance.');
  if (account.currency !== asset.currency) throw new Error('Custody source and asset reporting currencies must match.');
  if (input.marketPrice != null && (!Number.isFinite(input.marketPrice) || input.marketPrice < 0)) throw new Error('Market price must be finite and nonnegative.');
  const basis = input.costBasisMode === 'unknown' ? 0 : input.costBasisMode === 'average' ? input.quantity * input.costBasisValue! : input.costBasisValue!;
  const known = input.costBasisMode !== 'unknown';
  const now = new Date().toISOString();
  await database.transaction(async (tx) => {
    const existing = (await tx.select().from(assetCustodyPositions).where(and(eq(assetCustodyPositions.asset_id, asset.id), eq(assetCustodyPositions.custody_account_id, account.id))).limit(1))[0];
    const priorActivity = (await tx.select().from(transactions).where(eq(transactions.asset_id, asset.id))).some((row) => [row.custody_account_id, row.from_custody_account_id, row.to_custody_account_id].includes(account.id));
    if ((existing && existing.quantity > EPSILON) || priorActivity) throw new Error('An opening position already exists here. Use a correction before recording later activity.');
    const [transaction] = await tx.insert(transactions).values({
      asset_id: asset.id, type: 'opening_position', transaction_date: input.date, settlement_date: null,
      quantity: input.quantity, price: input.costBasisMode === 'average' ? input.costBasisValue! : null,
      amount: basis, total_amount: input.costBasisMode === 'total' ? input.costBasisValue! : null,
      gross_proceeds: null, currency: asset.currency, fees: null, tax: null, funding_account_id: null,
      execution_account_id: null, custody_account_id: account.id, receive_account_id: null,
      from_custody_account_id: null, to_custody_account_id: null, transfer_fee: null, realized_pnl: null,
      notes: [input.costBasisMode === 'unknown' ? 'Cost basis unknown.' : null, input.notes?.trim() || null].filter(Boolean).join(' '), created_at: now, updated_at: now,
    }).returning();
    if (existing) await tx.update(assetCustodyPositions).set({ quantity: input.quantity, cost_basis: basis, cost_basis_known: known, updated_at: now }).where(eq(assetCustodyPositions.id, existing.id));
    else await tx.insert(assetCustodyPositions).values({ asset_id: asset.id, custody_account_id: account.id, quantity: input.quantity, cost_basis: basis, cost_basis_known: known, updated_at: now });
    await tx.insert(ledgerEntries).values({ transaction_id: transaction.id, account_id: account.id, asset_id: asset.id, entry_type: 'asset_debit', quantity: input.quantity, amount: basis, currency: asset.currency, description: 'Opening crypto position; no cash movement.', created_at: now });
    const positions = await tx.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.asset_id, asset.id));
    const totalQuantity = positions.reduce((sum, row) => sum + row.quantity, 0);
    const totalBasis = positions.reduce((sum, row) => sum + row.cost_basis, 0);
    const allBasisKnown = positions.filter((row) => row.quantity > EPSILON).every((row) => row.cost_basis_known);
    const existingPrice = asset.quantity && asset.quantity > EPSILON ? asset.current_value / asset.quantity : input.marketPrice ?? 0;
    await tx.update(assets).set({ quantity: totalQuantity, cost_basis: totalBasis, cost_basis_known: allBasisKnown, current_value: totalQuantity * existingPrice, is_archived: false, updated_at: now }).where(eq(assets.id, asset.id));
  });
}

export async function correctCryptoOpeningPosition(input: CryptoOpeningPositionInput & { transactionId: number }, database: Store = db) {
  const [opening] = await database.select().from(transactions).where(eq(transactions.id, input.transactionId)).limit(1);
  if (!opening || opening.type !== 'opening_position' || opening.asset_id !== input.assetId || opening.custody_account_id !== input.custodyAccountId) throw new Error('Opening entry was not found for this position.');
  const all = await database.select().from(transactions).where(eq(transactions.asset_id, input.assetId));
  const linked = all.filter((row) => [row.custody_account_id, row.from_custody_account_id, row.to_custody_account_id].includes(input.custodyAccountId));
  if (linked.length !== 1 || linked[0].id !== opening.id) throw new Error('This opening position already has later activity. Add an auditable adjustment; the history cannot be overwritten.');
  if (!(input.quantity > 0) || !Number.isFinite(input.quantity)) throw new Error('Enter a positive quantity.');
  if (!['average','total','unknown'].includes(input.costBasisMode)) throw new Error('Choose a valid cost basis option.');
  if (input.costBasisMode !== 'unknown' && (!(input.costBasisValue! > 0) || !Number.isFinite(input.costBasisValue))) throw new Error('Enter a positive acquisition cost.');
  const [account] = await database.select().from(accountRegistry).where(eq(accountRegistry.id, input.custodyAccountId)).limit(1);
  const [asset] = await database.select().from(assets).where(eq(assets.id, input.assetId)).limit(1);
  if (!account || account.status !== 'active' || !['crypto_exchange','crypto_wallet'].includes(account.type) || !asset || asset.asset_class !== 'crypto' || account.currency !== asset.currency) throw new Error('Position custody and asset currency must match.');
  if (input.marketPrice != null && (!Number.isFinite(input.marketPrice) || input.marketPrice < 0)) throw new Error('Market price must be finite and nonnegative.');
  const basis = input.costBasisMode === 'unknown' ? 0 : input.costBasisMode === 'average' ? input.quantity * input.costBasisValue! : input.costBasisValue!;
  const known = input.costBasisMode !== 'unknown';
  const now = new Date().toISOString();
  await database.transaction(async (tx) => {
    const [position] = await tx.select().from(assetCustodyPositions).where(and(eq(assetCustodyPositions.asset_id, asset.id), eq(assetCustodyPositions.custody_account_id, account.id))).limit(1);
    if (!position || position.quantity <= EPSILON) throw new Error('The opening position is no longer open.');
    await tx.update(transactions).set({ transaction_date: input.date, quantity: input.quantity, price: input.costBasisMode === 'average' ? input.costBasisValue! : null, amount: basis, total_amount: input.costBasisMode === 'total' ? input.costBasisValue! : null, notes: [input.costBasisMode === 'unknown' ? 'Cost basis unknown.' : null, input.notes?.trim() || null].filter(Boolean).join(' '), updated_at: now }).where(eq(transactions.id, opening.id));
    await tx.update(assetCustodyPositions).set({ quantity: input.quantity, cost_basis: basis, cost_basis_known: known, updated_at: now }).where(eq(assetCustodyPositions.id, position.id));
    const [entry] = await tx.select().from(ledgerEntries).where(eq(ledgerEntries.transaction_id, opening.id));
    if (entry) await tx.update(ledgerEntries).set({ quantity: input.quantity, amount: basis, description: 'Opening crypto position; no cash movement.' }).where(eq(ledgerEntries.id, entry.id));
    const positions = await tx.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.asset_id, asset.id));
    const totalQuantity = positions.reduce((sum, row) => sum + row.quantity, 0);
    const totalBasis = positions.reduce((sum, row) => sum + row.cost_basis, 0);
    const allKnown = positions.filter((row) => row.quantity > EPSILON).every((row) => row.cost_basis_known);
    const marketPrice = asset.quantity && asset.quantity > EPSILON ? asset.current_value / asset.quantity : input.marketPrice ?? 0;
    await tx.update(assets).set({ quantity: totalQuantity, cost_basis: totalBasis, cost_basis_known: allKnown, current_value: totalQuantity * marketPrice, is_archived: false, updated_at: now }).where(eq(assets.id, asset.id));
  });
}

export async function supplyCryptoCostBasis(input: { custodyAccountId: number; assetId: number; totalCostBasis: number; date: string; notes?: string }, database: Store = db) {
  if (!Number.isFinite(input.totalCostBasis) || input.totalCostBasis < 0) throw new Error('Cost basis must be finite and nonnegative.');
  const now = new Date().toISOString();
  await database.transaction(async (tx) => {
    const [account] = await tx.select().from(accountRegistry).where(eq(accountRegistry.id, input.custodyAccountId)).limit(1);
    const [asset] = await tx.select().from(assets).where(eq(assets.id, input.assetId)).limit(1);
    const [position] = await tx.select().from(assetCustodyPositions).where(and(eq(assetCustodyPositions.asset_id, input.assetId), eq(assetCustodyPositions.custody_account_id, input.custodyAccountId))).limit(1);
    if (!account || account.status !== 'active' || !['crypto_exchange','crypto_wallet'].includes(account.type) || !asset || asset.asset_class !== 'crypto' || !position || position.quantity <= EPSILON) throw new Error('Choose an active open Crypto custody position.');
    if (account.currency !== asset.currency) throw new Error('Position custody and asset currency must match.');
    if (position.cost_basis_known) throw new Error('This position already has a known cost basis. Use the opening correction workflow if it has no later activity.');
    const [transaction] = await tx.insert(transactions).values({ asset_id: asset.id, type: 'basis_adjustment', transaction_date: input.date, settlement_date: null, quantity: position.quantity, price: null, amount: input.totalCostBasis, total_amount: null, gross_proceeds: null, currency: asset.currency, fees: null, tax: null, funding_account_id: null, execution_account_id: null, custody_account_id: account.id, receive_account_id: null, from_custody_account_id: null, to_custody_account_id: null, transfer_fee: null, realized_pnl: null, notes: input.notes?.trim() || 'Cost basis supplied; no quantity or cash movement.', created_at: now, updated_at: now }).returning();
    await tx.update(assetCustodyPositions).set({ cost_basis: input.totalCostBasis, cost_basis_known: true, updated_at: now }).where(eq(assetCustodyPositions.id, position.id));
    await tx.insert(ledgerEntries).values({ transaction_id: transaction.id, account_id: account.id, asset_id: asset.id, entry_type: 'basis_adjustment', amount: input.totalCostBasis - position.cost_basis, currency: asset.currency, description: 'Cost basis information supplied; no cash or quantity movement.', created_at: now });
    const positions = await tx.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.asset_id, asset.id));
    await tx.update(assets).set({ cost_basis: positions.reduce((sum, row) => sum + row.cost_basis, 0), cost_basis_known: positions.filter((row) => row.quantity > EPSILON).every((row) => row.cost_basis_known), updated_at: now }).where(eq(assets.id, asset.id));
  });
}

export async function recordCryptoOpeningBalance(input: { custodyAccountId: number; amount: number; date: string; notes?: string }, database: Store = db) {
  if (!(input.amount > 0) || !Number.isFinite(input.amount)) throw new Error('Enter an opening balance greater than zero.');
  const [account] = await database.select().from(accountRegistry).where(eq(accountRegistry.id, input.custodyAccountId)).limit(1);
  if (!account || account.status !== 'active' || !['crypto_exchange','crypto_wallet'].includes(account.type)) throw new Error('Choose an active custody source.');
  const now = new Date().toISOString();
  await database.transaction(async (tx) => {
    const priorCashActivity = (await tx.select().from(ledgerEntries).where(eq(ledgerEntries.account_id, account.id))).some((entry) => ['cash_credit','cash_debit'].includes(entry.entry_type));
    if (priorCashActivity || Math.abs(account.current_balance) > EPSILON) throw new Error('This custody source already has cash activity; use a deposit or a separately audited correction.');
    const [transaction] = await tx.insert(transactions).values({ asset_id: null, type: 'opening_balance', transaction_date: input.date, settlement_date: null, quantity: null, price: null, amount: input.amount, total_amount: null, gross_proceeds: null, currency: account.currency, fees: null, tax: null, funding_account_id: null, execution_account_id: null, custody_account_id: input.custodyAccountId, receive_account_id: input.custodyAccountId, from_custody_account_id: null, to_custody_account_id: null, transfer_fee: null, realized_pnl: null, notes: input.notes?.trim() || 'Opening stablecoin cash-equivalent balance.', created_at: now, updated_at: now }).returning();
    await tx.update(accountRegistry).set({ current_balance: account.current_balance + input.amount, updated_at: now }).where(eq(accountRegistry.id, account.id));
    await tx.insert(ledgerEntries).values({ transaction_id: transaction.id, account_id: account.id, asset_id: null, entry_type: 'cash_credit', amount: input.amount, currency: account.currency, description: 'Opening stablecoin cash-equivalent balance; not income.', created_at: now });
  });
}

export async function recordCryptoTransaction(input: CryptoTransactionInput, database: Store = db) {
  if (!['deposit','withdraw','buy','sell','transfer','fee'].includes(input.type)) throw new Error('Crypto activity type is invalid.');
  const custodyIds = [input.custodyAccountId, input.fromCustodyAccountId, input.toCustodyAccountId].filter((id): id is number => id != null);
  const custodyRows = await Promise.all(custodyIds.map(async (id) => (await database.select().from(accountRegistry).where(eq(accountRegistry.id, id)).limit(1))[0]));
  if (custodyRows.some((row) => !row || !['crypto_exchange', 'crypto_wallet'].includes(row.type) || row.status !== 'active')) throw new Error('Choose an active crypto exchange or wallet.');
  const custodyMap = new Map(custodyRows.filter((row): row is AccountRegistry => Boolean(row)).map((row) => [row.id, row]));
  const account = input.custodyAccountId ? custodyMap.get(input.custodyAccountId) : undefined;
  const source = input.fromCustodyAccountId ? custodyMap.get(input.fromCustodyAccountId) : undefined;
  const destination = input.toCustodyAccountId ? custodyMap.get(input.toCustodyAccountId) : undefined;

  let asset: Asset | null = null;
  if (input.assetId) asset = (await database.select().from(assets).where(eq(assets.id, input.assetId)).limit(1))[0] ?? null;
  if (['buy','sell','transfer'].includes(input.type) && (!asset || asset.asset_class !== 'crypto' || asset.is_archived)) throw new Error('Choose an active crypto asset.');
  if (asset && input.type !== 'deposit' && input.type !== 'withdraw' && input.type !== 'fee' && asset.currency !== input.currency && input.currency) {
    throw new Error('Transaction currency must match the crypto asset currency.');
  }
  if (asset && (input.type === 'buy' || input.type === 'sell' || input.type === 'transfer')) {
    const accountCurrencies = [account?.currency, source?.currency, destination?.currency].filter(Boolean);
    if (accountCurrencies.some((currency) => currency !== asset!.currency)) throw new Error('The asset and custody accounts must use the same reporting currency.');
  }
  const currency = asset?.currency ?? account?.currency ?? source?.currency ?? input.currency ?? 'USDT';
  if (!['USD','USDT','USDC'].includes(currency)) throw new Error('Crypto workspace reporting currency must be USD, USDT, or USDC.');
  const quantity = input.quantity ?? null;
  const price = input.price ?? null;
  const fees = input.fees ?? 0;
  const transferFee = input.transferFee ?? 0;
  const amount = input.amount ?? 0;
  for (const [label, value] of [['quantity', quantity], ['price', price], ['fee', fees], ['network fee', transferFee], ['amount', amount]] as const) {
    if (value != null && (!Number.isFinite(value) || value < 0)) throw new Error(`${label} must be finite and nonnegative.`);
  }
  if (['buy','sell'].includes(input.type) && (!(quantity! > 0) || !(price! > 0))) throw new Error('Enter a positive quantity and price.');
  if (['deposit','withdraw','fee'].includes(input.type) && !(amount > 0)) throw new Error('Enter an amount greater than zero.');
  if (input.type === 'transfer' && transferFee >= quantity!) throw new Error('Network fee must be smaller than the amount sent.');
  if (input.type === 'sell' && fees > quantity! * price!) throw new Error('Fee cannot exceed sale proceeds.');
  if (input.type === 'buy' && (!account || account.currency !== currency)) throw new Error('Choose a custody account in the asset reporting currency.');
  if (input.type === 'transfer' && source?.id === destination?.id) throw new Error('Choose two different custody sources.');

  const gross = quantity && price ? quantity * price : amount;
  const txInput: LifecycleTransactionInput = {
    assetId: asset?.id ?? null,
    type: input.type,
    transactionDate: input.date,
    settlementDate: null,
    quantity,
    price,
    amount: input.type === 'fee' ? amount : gross,
    totalAmount: input.type === 'buy' ? gross : null,
    grossProceeds: input.type === 'sell' ? gross : null,
    currency,
    fees: input.type === 'buy' || input.type === 'sell' ? fees : null,
    tax: null,
    fundingAccountId: ['buy','withdraw','fee'].includes(input.type) ? account?.id ?? null : null,
    executionAccountId: ['buy','sell'].includes(input.type) ? account?.id ?? null : null,
    custodyAccountId: ['buy','sell'].includes(input.type) ? account?.id ?? null : null,
    receiveAccountId: ['sell','deposit'].includes(input.type) ? account?.id ?? null : null,
    fromCustodyAccountId: input.type === 'transfer' ? source?.id ?? null : null,
    toCustodyAccountId: input.type === 'transfer' ? destination?.id ?? null : null,
    transferFee: input.type === 'transfer' ? transferFee : null,
    notes: input.type === 'deposit' || input.type === 'withdraw' ? `Stablecoin cash-equivalent (${currency}).` : null,
    enforceAvailableCash: true,
  };
  if (input.type === 'sell' && account) txInput.receiveAccountId = account.id;
  if (input.type === 'transfer' && asset) {
    const marketPrice = asset.quantity && asset.quantity > EPSILON ? asset.current_value / asset.quantity : price ?? 0;
    txInput.amount = transferFee * marketPrice;
    txInput.price = marketPrice;
  }
  return createLifecycleTransaction(txInput, database);
}

export async function createCryptoInstrument(input: { name: string; symbol: string; currency: string }, database: Store = db) {
  const name = input.name.trim();
  const symbol = input.symbol.trim().toUpperCase();
  const currency = input.currency.toUpperCase();
  if (!name || !/^[A-Z0-9._-]{1,20}$/.test(symbol)) throw new Error('Enter a valid token name and symbol.');
  if (['USDT','USDC'].includes(symbol)) throw new Error('Stablecoins are recorded as custody cash equivalents, not as a second token holding.');
  if (!['USD','USDT','USDC'].includes(currency)) throw new Error('Use USD, USDT, or USDC as the reporting currency.');
  const matches = await database.select().from(assets).where(eq(assets.asset_class, 'crypto'));
  const existing = matches.find((row) => row.symbol?.toUpperCase() === symbol);
  if (existing) {
    if (existing.currency !== currency) throw new Error('This token already uses a different reporting currency.');
    if (existing.is_archived) await database.update(assets).set({ is_archived: false, updated_at: new Date().toISOString() }).where(eq(assets.id, existing.id));
    return existing;
  }
  const now = new Date().toISOString();
  const [asset] = await database.insert(assets).values({
    name, symbol, asset_class: 'crypto', purpose: 'wealth_compounder', current_value: 0,
    currency, quantity: 0, cost_basis: 0, include_in_investment_net_worth: true,
    include_in_total_net_worth: true, is_archived: false, created_at: now, updated_at: now,
  }).returning();
  return asset;
}

export async function setCryptoMarketPrice(assetId: number, price: number, database: Store = db) {
  if (!Number.isFinite(price) || price < 0) throw new Error('Market price must be finite and nonnegative.');
  const [asset] = await database.select().from(assets).where(eq(assets.id, assetId)).limit(1);
  if (!asset || asset.asset_class !== 'crypto') throw new Error('Crypto asset not found.');
  await database.update(assets).set({ current_value: price * Math.max(0, asset.quantity ?? 0), updated_at: new Date().toISOString() }).where(eq(assets.id, assetId));
}

export async function getCryptoWorkspaceData(database: Store = db, usdVndRate?: number) {
  const [rate, accounts, allAssets, positions, allTransactions, entries] = await Promise.all([
    usdVndRate ?? getUsdVndRate(),
    database.select().from(accountRegistry).where(and(eq(accountRegistry.status, 'active'))).orderBy(asc(accountRegistry.name)),
    database.select().from(assets).where(eq(assets.asset_class, 'crypto')),
    database.select().from(assetCustodyPositions),
    database.select().from(transactions).orderBy(desc(transactions.transaction_date), desc(transactions.created_at)),
    database.select().from(ledgerEntries),
  ]);
  const accountRows = accounts.filter((row) => row.type === 'crypto_exchange' || row.type === 'crypto_wallet');
  const accountMap = new Map(accountRows.map((row) => [row.id, row]));
  const assetMap = new Map(allAssets.map((row) => [row.id, row]));
  const cashBySource = new Map<number, number>();
  for (const row of entries) if (row.account_id && ['cash_credit','cash_debit'].includes(row.entry_type)) cashBySource.set(row.account_id, (cashBySource.get(row.account_id) ?? 0) + (row.amount ?? 0));
  const cryptoPositions = positions.flatMap((position) => {
    const asset = assetMap.get(position.asset_id);
    const account = accountMap.get(position.custody_account_id);
    if (!asset || !account || position.quantity <= EPSILON || asset.is_archived) return [];
    const marketPrice = (asset.quantity ?? 0) > EPSILON ? asset.current_value / asset.quantity! : 0;
    const marketValue = marketPrice * position.quantity;
    const openingTransaction = allTransactions.find((transaction) => transaction.type === 'opening_position' && transaction.asset_id === asset.id && transaction.custody_account_id === account.id);
    const linkedActivity = allTransactions.filter((transaction) => transaction.asset_id === asset.id && [transaction.custody_account_id, transaction.from_custody_account_id, transaction.to_custody_account_id].includes(account.id));
    return [{ asset, account, quantity: position.quantity, averageCost: position.cost_basis_known ? position.cost_basis / position.quantity : null, costBasis: position.cost_basis, costBasisKnown: position.cost_basis_known, marketPrice, marketValue, gainLoss: position.cost_basis_known ? marketValue - position.cost_basis : null, openingTransactionId: openingTransaction?.id ?? null, openingDate: openingTransaction?.transaction_date ?? '', canCorrectOpening: Boolean(openingTransaction && linkedActivity.length === 1) }];
  });
  const assignedIds = new Set(positions.map((row) => row.asset_id));
  const legacy = allAssets.filter((asset) => !asset.is_archived && (asset.quantity ?? 0) > EPSILON && !assignedIds.has(asset.id)).map((asset) => ({ asset, account: null as AccountRegistry | null, quantity: asset.quantity ?? 0, averageCost: asset.cost_basis_known ? (asset.cost_basis ?? 0) / (asset.quantity ?? 1) : null, costBasis: asset.cost_basis ?? 0, costBasisKnown: asset.cost_basis_known, marketPrice: (asset.quantity ?? 0) > 0 ? asset.current_value / asset.quantity! : 0, marketValue: asset.current_value, gainLoss: asset.cost_basis_known ? asset.current_value - (asset.cost_basis ?? 0) : null, openingTransactionId: null as number | null, openingDate: '', canCorrectOpening: false }));
  const allPositions = [...cryptoPositions, ...legacy];
  const accountSummary = accountRows.map((account) => {
    const cash = cashBySource.get(account.id) ?? 0;
    const sourcePositions = cryptoPositions.filter((position) => position.account.id === account.id);
    const marketValue = sourcePositions.reduce((sum, row) => sum + row.marketValue, 0);
    return { account, cash, marketValue, totalValue: cash + marketValue, positions: sourcePositions };
  });
  const belongs = (transaction: typeof allTransactions[number]) => [transaction.funding_account_id, transaction.execution_account_id, transaction.custody_account_id, transaction.receive_account_id, transaction.from_custody_account_id, transaction.to_custody_account_id].some((id) => id != null && accountMap.has(id)) || (transaction.asset_id != null && assetMap.has(transaction.asset_id));
  const relatedTransactions = allTransactions.filter(belongs);
  const cashTotal = accountSummary.reduce((sum, row) => sum + normalizeToUsd(row.cash, row.account.currency, rate), 0);
  const marketValue = allPositions.reduce((sum, row) => sum + normalizeToUsd(row.marketValue, row.asset.currency, rate), 0);
  const costBasis = allPositions.reduce((sum, row) => sum + normalizeToUsd(row.costBasis, row.asset.currency, rate), 0);
  const realizedPnl = relatedTransactions.filter((row) => row.type === 'sell').reduce((sum, row) => sum + normalizeToUsd(row.realized_pnl ?? 0, row.currency, rate), 0);
  const realizedPnlKnown = relatedTransactions.filter((row) => row.type === 'sell').every((row) => row.realized_pnl != null);
  const positionsByAsset = allAssets.map((asset) => {
    const rows = allPositions.filter((row) => row.asset.id === asset.id);
    const quantity = rows.reduce((sum, row) => sum + row.quantity, 0);
    const basis = rows.reduce((sum, row) => sum + row.costBasis, 0);
    const price = quantity > EPSILON ? rows.reduce((sum, row) => sum + row.marketValue, 0) / quantity : 0;
    const value = rows.reduce((sum, row) => sum + row.marketValue, 0);
    const costBasisKnown = rows.every((row) => row.costBasisKnown);
    return { asset, quantity, basis, costBasisKnown, price, value, gainLoss: costBasisKnown ? value - basis : null, locations: rows };
  });
  return {
    rate, accounts: accountSummary, positions: allPositions, positionsByAsset,
    transactions: relatedTransactions, assets: allAssets,
    closedAssets: allAssets.filter((asset) => asset.is_archived || (asset.quantity ?? 0) <= EPSILON).filter((asset) => relatedTransactions.some((row) => row.asset_id === asset.id)),
    totals: { cash: cashTotal, marketValue, total: cashTotal + marketValue, costBasis, costBasisKnown: allPositions.every((row) => row.costBasisKnown), unrealizedPnl: allPositions.every((row) => row.costBasisKnown) ? marketValue - costBasis : null, realizedPnl: realizedPnlKnown ? realizedPnl : null },
  };
}
