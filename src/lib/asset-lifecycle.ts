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
import { and, desc, eq, or, sql } from 'drizzle-orm';

const EPSILON = 0.00000001;

export interface LifecycleTransactionInput {
  assetId: number | null;
  type: TransactionType;
  transactionDate: string;
  settlementDate: string | null;
  quantity: number | null;
  price: number | null;
  amount: number;
  totalAmount: number | null;
  grossProceeds: number | null;
  currency: string;
  fees: number | null;
  tax: number | null;
  fundingAccountId: number | null;
  executionAccountId: number | null;
  custodyAccountId: number | null;
  receiveAccountId: number | null;
  fromCustodyAccountId: number | null;
  toCustodyAccountId: number | null;
  transferFee: number | null;
  notes: string | null;
}

export interface AssetLifecycleSummary {
  firstFundingAccount: AccountRegistry | null;
  firstExecutionAccount: AccountRegistry | null;
  currentCustody: Array<{ account: AccountRegistry; quantity: number; costBasis: number }>;
  transferHistory: Array<{
    id: number;
    date: string;
    quantity: number | null;
    from: AccountRegistry | null;
    to: AccountRegistry | null;
    fee: number | null;
  }>;
  sellHistory: Array<{
    id: number;
    date: string;
    quantity: number | null;
    grossProceeds: number | null;
    receiveAccount: AccountRegistry | null;
    realizedPnl: number | null;
  }>;
  lifetimeCashIn: number;
  lifetimeCashOut: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalReturn: number;
}

export interface AccountRegistryMetrics {
  accountId: number;
  linkedTransactionCount: number;
  linkedAssetCount: number;
  totalCustodyValue: number;
}

export interface AccountDetailSummary {
  account: AccountRegistry;
  linkedTransactions: Array<typeof transactions.$inferSelect>;
  fundedAssets: Asset[];
  executedAssets: Asset[];
  custodiedAssets: Array<{ asset: Asset; quantity: number; costBasis: number }>;
  transfersIn: Array<typeof transactions.$inferSelect>;
  transfersOut: Array<typeof transactions.$inferSelect>;
  realizedPnl: number;
}

function requireValue<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined || value === '') {
    throw new Error(message);
  }
  return value;
}

async function getAsset(assetId: number | null): Promise<Asset | null> {
  if (!assetId) return null;
  return db.select().from(assets).where(eq(assets.id, assetId)).limit(1).then((rows) => rows[0] ?? null);
}

async function assertActiveAccount(accountId: number | null, message: string) {
  if (!accountId) throw new Error(message);
  const account = await db
    .select()
    .from(accountRegistry)
    .where(eq(accountRegistry.id, accountId))
    .limit(1)
    .then((rows) => rows[0] ?? null);
  if (!account) throw new Error(`${message} Account Registry record was not found.`);
  if (account.status !== 'active') throw new Error(`${account.name} is not active in Account Registry.`);
  return account;
}

async function getPosition(assetId: number, custodyAccountId: number) {
  return db
    .select()
    .from(assetCustodyPositions)
    .where(and(
      eq(assetCustodyPositions.asset_id, assetId),
      eq(assetCustodyPositions.custody_account_id, custodyAccountId),
    ))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

async function upsertPosition(
  assetId: number,
  custodyAccountId: number,
  quantityDelta: number,
  costBasisDelta: number,
  now: string,
) {
  const existing = await getPosition(assetId, custodyAccountId);
  if (existing) {
    await db
      .update(assetCustodyPositions)
      .set({
        quantity: existing.quantity + quantityDelta,
        cost_basis: existing.cost_basis + costBasisDelta,
        updated_at: now,
      })
      .where(eq(assetCustodyPositions.id, existing.id));
    return;
  }

  await db.insert(assetCustodyPositions).values({
    asset_id: assetId,
    custody_account_id: custodyAccountId,
    quantity: quantityDelta,
    cost_basis: costBasisDelta,
    updated_at: now,
  });
}

async function moveCash(accountId: number, delta: number, now: string) {
  await db
    .update(accountRegistry)
    .set({
      current_balance: sql`${accountRegistry.current_balance} + ${delta}`,
      updated_at: now,
    })
    .where(eq(accountRegistry.id, accountId));
}

async function updateAssetTotals(assetId: number, quantityDelta: number, costBasisDelta: number, now: string) {
  const [asset] = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
  if (!asset) return;
  await db
    .update(assets)
    .set({
      quantity: (asset.quantity ?? 0) + quantityDelta,
      cost_basis: (asset.cost_basis ?? 0) + costBasisDelta,
      updated_at: now,
    })
    .where(eq(assets.id, assetId));
}

function validateLifecycleInput(input: LifecycleTransactionInput, asset: Asset | null) {
  if (input.type === 'buy') {
    requireValue(input.assetId, 'Buy transaction requires an asset.');
    requireValue(input.quantity, 'Buy transaction requires quantity.');
    requireValue(input.price, 'Buy transaction requires price.');
    requireValue(input.fundingAccountId, 'Buy transaction requires a funding source.');
    requireValue(input.executionAccountId, 'Buy transaction requires an execution venue.');
    requireValue(input.custodyAccountId, 'Buy transaction requires a custody location.');
    if (asset?.asset_class === 'crypto') {
      requireValue(input.executionAccountId, 'Crypto buy requires an execution venue.');
      requireValue(input.custodyAccountId, 'Crypto buy requires a custody location.');
    }
  }

  if (input.type === 'sell') {
    requireValue(input.assetId, 'Sell transaction requires an asset.');
    requireValue(input.quantity, 'Sell transaction requires quantity.');
    requireValue(input.executionAccountId, 'Sell transaction requires an execution venue.');
    requireValue(input.receiveAccountId, 'Sell transaction requires a receive destination.');
    requireValue(input.custodyAccountId ?? input.fromCustodyAccountId, 'Sell transaction requires source custody.');
  }

  if (input.type === 'transfer') {
    requireValue(input.assetId, 'Transfer requires an asset.');
    requireValue(input.quantity, 'Transfer requires quantity.');
    requireValue(input.fromCustodyAccountId, 'Transfer requires source custody.');
    requireValue(input.toCustodyAccountId, 'Transfer requires destination custody.');
    if (input.fromCustodyAccountId === input.toCustodyAccountId) {
      throw new Error('Transfer source and destination must be different.');
    }
  }
}

export async function createLifecycleTransaction(input: LifecycleTransactionInput) {
  const now = new Date().toISOString();
  const asset = await getAsset(input.assetId);
  validateLifecycleInput(input, asset);

  if (input.type === 'buy') {
    await Promise.all([
      assertActiveAccount(input.fundingAccountId, 'Buy transaction requires a funding source.'),
      assertActiveAccount(input.executionAccountId, 'Buy transaction requires an execution venue.'),
      assertActiveAccount(input.custodyAccountId, 'Buy transaction requires a custody location.'),
    ]);
  }

  if (input.type === 'sell') {
    await Promise.all([
      assertActiveAccount(input.executionAccountId, 'Sell transaction requires an execution venue.'),
      assertActiveAccount(input.receiveAccountId, 'Sell transaction requires a receive destination.'),
      assertActiveAccount(input.fromCustodyAccountId ?? input.custodyAccountId, 'Sell transaction requires source custody.'),
    ]);
  }

  if (input.type === 'transfer') {
    await Promise.all([
      assertActiveAccount(input.fromCustodyAccountId, 'Transfer requires source custody.'),
      assertActiveAccount(input.toCustodyAccountId, 'Transfer requires destination custody.'),
    ]);
  }

  const quantity = input.quantity ?? 0;
  const fees = input.fees ?? 0;
  const tax = input.tax ?? 0;
  const transferFee = input.transferFee ?? 0;
  let realizedPnl: number | null = null;

  if (input.type === 'transfer') {
    const source = await getPosition(input.assetId!, input.fromCustodyAccountId!);
    if (!source || source.quantity + EPSILON < quantity) {
      throw new Error('Cannot transfer more than the available quantity in source custody.');
    }
  }

  if (input.type === 'sell') {
    const sourceCustodyId = input.fromCustodyAccountId ?? input.custodyAccountId!;
    const source = await getPosition(input.assetId!, sourceCustodyId);
    if (!source || source.quantity + EPSILON < quantity) {
      throw new Error('Cannot sell more than the available quantity in source custody.');
    }
    const costRemoved = source.quantity > 0 ? (source.cost_basis / source.quantity) * quantity : 0;
    const proceeds = input.grossProceeds ?? input.amount;
    realizedPnl = proceeds - fees - tax - costRemoved;
  }

  const inserted = await db.insert(transactions).values({
    asset_id: input.assetId ?? undefined,
    type: input.type,
    transaction_date: input.transactionDate,
    settlement_date: input.settlementDate,
    quantity: input.quantity,
    price: input.price,
    amount: input.amount,
    total_amount: input.totalAmount,
    gross_proceeds: input.grossProceeds,
    currency: input.currency,
    fees: input.fees,
    tax: input.tax,
    funding_account_id: input.fundingAccountId,
    execution_account_id: input.executionAccountId,
    custody_account_id: input.custodyAccountId,
    receive_account_id: input.receiveAccountId,
    from_custody_account_id: input.fromCustodyAccountId,
    to_custody_account_id: input.toCustodyAccountId,
    transfer_fee: input.transferFee,
    realized_pnl: realizedPnl,
    notes: input.notes,
    created_at: now,
    updated_at: now,
  }).returning();
  const transaction = inserted[0];

  if (input.type === 'buy') {
    const cashOut = (input.totalAmount ?? input.amount) + fees + tax;
    const assetCost = cashOut;
    await moveCash(input.fundingAccountId!, -cashOut, now);
    await upsertPosition(input.assetId!, input.custodyAccountId!, quantity, assetCost, now);
    await updateAssetTotals(input.assetId!, quantity, assetCost, now);
    await db.insert(ledgerEntries).values([
      {
        transaction_id: transaction.id,
        account_id: input.fundingAccountId,
        asset_id: input.assetId,
        entry_type: 'cash_debit',
        amount: -cashOut,
        currency: input.currency,
        description: 'Funding account cash outflow.',
        created_at: now,
      },
      {
        transaction_id: transaction.id,
        account_id: input.custodyAccountId,
        asset_id: input.assetId,
        entry_type: 'asset_debit',
        quantity,
        currency: input.currency,
        description: 'Asset position acquired into custody.',
        created_at: now,
      },
    ]);
  }

  if (input.type === 'sell') {
    const sourceCustodyId = input.fromCustodyAccountId ?? input.custodyAccountId!;
    const source = await getPosition(input.assetId!, sourceCustodyId);
    const costRemoved = source && source.quantity > 0 ? (source.cost_basis / source.quantity) * quantity : 0;
    const netProceeds = (input.grossProceeds ?? input.amount) - fees - tax;
    await moveCash(input.receiveAccountId!, netProceeds, now);
    await upsertPosition(input.assetId!, sourceCustodyId, -quantity, -costRemoved, now);
    await updateAssetTotals(input.assetId!, -quantity, -costRemoved, now);
    await db.insert(ledgerEntries).values([
      {
        transaction_id: transaction.id,
        account_id: sourceCustodyId,
        asset_id: input.assetId,
        entry_type: 'asset_credit',
        quantity: -quantity,
        currency: input.currency,
        description: 'Asset position sold out of custody.',
        created_at: now,
      },
      {
        transaction_id: transaction.id,
        account_id: input.receiveAccountId,
        asset_id: input.assetId,
        entry_type: 'cash_credit',
        amount: netProceeds,
        currency: input.currency,
        description: 'Net sale proceeds received.',
        created_at: now,
      },
      {
        transaction_id: transaction.id,
        account_id: input.receiveAccountId,
        asset_id: input.assetId,
        entry_type: 'realized_pnl',
        amount: realizedPnl,
        currency: input.currency,
        description: 'Realized profit or loss.',
        created_at: now,
      },
    ]);
  }

  if (input.type === 'transfer') {
    const source = await getPosition(input.assetId!, input.fromCustodyAccountId!);
    const costMoved = source && source.quantity > 0 ? (source.cost_basis / source.quantity) * quantity : 0;
    await upsertPosition(input.assetId!, input.fromCustodyAccountId!, -quantity, -costMoved, now);
    await upsertPosition(input.assetId!, input.toCustodyAccountId!, quantity, costMoved, now);
    await db.insert(ledgerEntries).values([
      {
        transaction_id: transaction.id,
        account_id: input.fromCustodyAccountId,
        asset_id: input.assetId,
        entry_type: 'asset_credit',
        quantity: -quantity,
        currency: input.currency,
        description: 'Asset transferred out of custody.',
        created_at: now,
      },
      {
        transaction_id: transaction.id,
        account_id: input.toCustodyAccountId,
        asset_id: input.assetId,
        entry_type: 'asset_debit',
        quantity,
        currency: input.currency,
        description: 'Asset transferred into custody.',
        created_at: now,
      },
      ...(transferFee > 0
        ? [{
            transaction_id: transaction.id,
            account_id: input.fromCustodyAccountId,
            asset_id: input.assetId,
            entry_type: 'fee' as const,
            amount: transferFee,
            currency: input.currency,
            description: 'Transfer or network fee.',
            created_at: now,
          }]
        : []),
    ]);
  }

  return transaction;
}

export async function getAssetLifecycleSummary(assetId: number): Promise<AssetLifecycleSummary> {
  const [asset, txns, positions, accounts] = await Promise.all([
    db.select().from(assets).where(eq(assets.id, assetId)).limit(1).then((rows) => rows[0] ?? null),
    db.select().from(transactions).where(eq(transactions.asset_id, assetId)).orderBy(desc(transactions.transaction_date)),
    db.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.asset_id, assetId)),
    db.select().from(accountRegistry),
  ]);

  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const buys = txns.filter((txn) => txn.type === 'buy');
  const sells = txns.filter((txn) => txn.type === 'sell');

  const lifetimeCashOut = buys.reduce(
    (sum, txn) => sum + (txn.total_amount ?? txn.amount) + (txn.fees ?? 0) + (txn.tax ?? 0),
    0,
  );
  const lifetimeCashIn = sells.reduce(
    (sum, txn) => sum + (txn.gross_proceeds ?? txn.amount) - (txn.fees ?? 0) - (txn.tax ?? 0),
    0,
  );
  const realizedPnl = sells.reduce((sum, txn) => sum + (txn.realized_pnl ?? 0), 0);
  const totalPositionCost = positions.reduce((sum, position) => sum + position.cost_basis, 0);
  const unrealizedPnl = asset ? asset.current_value - totalPositionCost : 0;

  return {
    firstFundingAccount: accountMap.get(buys[buys.length - 1]?.funding_account_id ?? -1) ?? null,
    firstExecutionAccount: accountMap.get(buys[buys.length - 1]?.execution_account_id ?? -1) ?? null,
    currentCustody: positions
      .filter((position) => position.quantity > EPSILON)
      .map((position) => ({
        account: accountMap.get(position.custody_account_id)!,
        quantity: position.quantity,
        costBasis: position.cost_basis,
      }))
      .filter((row) => row.account),
    transferHistory: txns
      .filter((txn) => txn.type === 'transfer')
      .map((txn) => ({
        id: txn.id,
        date: txn.transaction_date,
        quantity: txn.quantity,
        from: accountMap.get(txn.from_custody_account_id ?? -1) ?? null,
        to: accountMap.get(txn.to_custody_account_id ?? -1) ?? null,
        fee: txn.transfer_fee,
      })),
    sellHistory: sells.map((txn) => ({
      id: txn.id,
      date: txn.transaction_date,
      quantity: txn.quantity,
      grossProceeds: txn.gross_proceeds ?? txn.amount,
      receiveAccount: accountMap.get(txn.receive_account_id ?? -1) ?? null,
      realizedPnl: txn.realized_pnl,
    })),
    lifetimeCashIn,
    lifetimeCashOut,
    realizedPnl,
    unrealizedPnl,
    totalReturn: realizedPnl + unrealizedPnl,
  };
}

export async function getLifecycleDashboard() {
  const [accounts, positions, allAssets, recentTransactions] = await Promise.all([
    db.select().from(accountRegistry),
    db.select().from(assetCustodyPositions),
    db.select().from(assets),
    db.select().from(transactions).orderBy(desc(transactions.transaction_date), desc(transactions.created_at)).limit(12),
  ]);

  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const assetMap = new Map(allAssets.map((asset) => [asset.id, asset]));
  const activeAccounts = accounts.filter((account) => account.status === 'active');
  const cashByAccount = activeAccounts
    .filter((account) => ['bank_account', 'cash_location', 'broker_account'].includes(account.type))
    .map((account) => ({ account, balance: account.current_balance }));

  const assetsByCustody = positions
    .filter((position) => position.quantity > EPSILON)
    .map((position) => ({
      account: accountMap.get(position.custody_account_id),
      asset: assetMap.get(position.asset_id),
      quantity: position.quantity,
      costBasis: position.cost_basis,
    }))
    .filter((row) => row.account && row.asset);

  const cryptoPositions = assetsByCustody.filter((row) => row.asset?.asset_class === 'crypto');
  const cryptoByWallet = cryptoPositions
    .filter((row) => row.account?.type === 'crypto_wallet' || row.account?.type === 'crypto_exchange')
    .map((row) => ({
      account: row.account!,
      asset: row.asset!,
      quantity: row.quantity,
      costBasis: row.costBasis,
    }));
  const brokerExchangeExposure = assetsByCustody
    .filter((row) => row.account?.type === 'broker_account' || row.account?.type === 'crypto_exchange')
    .reduce<Array<{ account: AccountRegistry; costBasis: number }>>((rows, row) => {
      const account = row.account!;
      const existing = rows.find((item) => item.account.id === account.id);
      if (existing) existing.costBasis += row.costBasis;
      else rows.push({ account, costBasis: row.costBasis });
      return rows;
    }, []);
  const idleCashByBankBroker = cashByAccount.filter((row) =>
    ['bank_account', 'broker_account'].includes(row.account.type),
  );
  const cryptoTotal = cryptoPositions.reduce((sum, row) => sum + row.costBasis, 0);
  const coldStorage = cryptoPositions
    .filter((row) => row.account?.type === 'crypto_wallet')
    .reduce((sum, row) => sum + row.costBasis, 0);
  const investedCapital = positions.reduce((sum, position) => sum + position.cost_basis, 0);
  const lifetimePnl = allAssets.reduce((sum, asset) => sum + (asset.current_value - (asset.cost_basis ?? 0)), 0);

  return {
    cashByAccount,
    assetsByCustody,
    cryptoByWallet,
    brokerExchangeExposure,
    idleCashByBankBroker,
    cryptoColdStoragePct: cryptoTotal > 0 ? (coldStorage / cryptoTotal) * 100 : 0,
    idleCash: cashByAccount.reduce((sum, row) => sum + row.balance, 0),
    investedCapital,
    recentMoneyFlows: recentTransactions.filter((txn) => txn.type !== 'transfer').slice(0, 5),
    recentTransfers: recentTransactions.filter((txn) => txn.type === 'transfer').slice(0, 5),
    lifetimePnl,
  };
}

function transactionUsesAccount(transaction: typeof transactions.$inferSelect, accountId: number) {
  return [
    transaction.funding_account_id,
    transaction.execution_account_id,
    transaction.custody_account_id,
    transaction.receive_account_id,
    transaction.from_custody_account_id,
    transaction.to_custody_account_id,
  ].includes(accountId);
}

export async function getAccountRegistryMetrics(): Promise<AccountRegistryMetrics[]> {
  const [allAccounts, txns, positions] = await Promise.all([
    db.select().from(accountRegistry),
    db.select().from(transactions),
    db.select().from(assetCustodyPositions),
  ]);

  return allAccounts.map((account) => {
    const linkedTransactions = txns.filter((transaction) => transactionUsesAccount(transaction, account.id));
    const linkedAssetIds = new Set<number>();
    for (const transaction of linkedTransactions) {
      if (transaction.asset_id) linkedAssetIds.add(transaction.asset_id);
    }
    for (const position of positions) {
      if (position.custody_account_id === account.id) linkedAssetIds.add(position.asset_id);
    }

    return {
      accountId: account.id,
      linkedTransactionCount: linkedTransactions.length,
      linkedAssetCount: linkedAssetIds.size,
      totalCustodyValue: positions
        .filter((position) => position.custody_account_id === account.id)
        .reduce((sum, position) => sum + position.cost_basis, 0),
    };
  });
}

export async function getAccountDetailSummary(accountId: number): Promise<AccountDetailSummary | null> {
  const [account, txns, allAssets, positions] = await Promise.all([
    db.select().from(accountRegistry).where(eq(accountRegistry.id, accountId)).limit(1).then((rows) => rows[0] ?? null),
    db.select().from(transactions).where(or(
      eq(transactions.funding_account_id, accountId),
      eq(transactions.execution_account_id, accountId),
      eq(transactions.custody_account_id, accountId),
      eq(transactions.receive_account_id, accountId),
      eq(transactions.from_custody_account_id, accountId),
      eq(transactions.to_custody_account_id, accountId),
    )).orderBy(desc(transactions.transaction_date), desc(transactions.created_at)),
    db.select().from(assets),
    db.select().from(assetCustodyPositions).where(eq(assetCustodyPositions.custody_account_id, accountId)),
  ]);

  if (!account) return null;
  const assetMap = new Map(allAssets.map((asset) => [asset.id, asset]));

  function assetsFor(predicate: (transaction: typeof txns[number]) => boolean) {
    const ids = new Set(txns.filter(predicate).map((transaction) => transaction.asset_id).filter((id): id is number => id != null));
    return Array.from(ids).map((id) => assetMap.get(id)).filter((asset): asset is Asset => Boolean(asset));
  }

  return {
    account,
    linkedTransactions: txns,
    fundedAssets: assetsFor((transaction) => transaction.funding_account_id === accountId),
    executedAssets: assetsFor((transaction) => transaction.execution_account_id === accountId),
    custodiedAssets: positions
      .map((position) => ({
        asset: assetMap.get(position.asset_id),
        quantity: position.quantity,
        costBasis: position.cost_basis,
      }))
      .filter((row): row is { asset: Asset; quantity: number; costBasis: number } => Boolean(row.asset)),
    transfersIn: txns.filter((transaction) => transaction.to_custody_account_id === accountId),
    transfersOut: txns.filter((transaction) => transaction.from_custody_account_id === accountId),
    realizedPnl: txns
      .filter((transaction) => transaction.receive_account_id === accountId || transaction.execution_account_id === accountId)
      .reduce((sum, transaction) => sum + (transaction.realized_pnl ?? 0), 0),
  };
}
