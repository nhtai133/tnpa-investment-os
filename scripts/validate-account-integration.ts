import { db } from '@/db';
import {
  accountRegistry,
  assets,
  transactions,
  type AccountRegistry,
  type Asset,
} from '@/db/schema';
import {
  createLifecycleTransaction,
  getAccountDetailSummary,
  getAssetLifecycleSummary,
  getLifecycleDashboard,
} from '@/lib/asset-lifecycle';
import { and, eq } from 'drizzle-orm';

const TEST_ACCOUNT_NAME = 'TNPA Runtime Test Bank';
const TEST_ASSET_SYMBOL = 'TNPA-AIT';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function ensureTestAccount(): Promise<AccountRegistry> {
  const existing = await db
    .select()
    .from(accountRegistry)
    .where(eq(accountRegistry.name, TEST_ACCOUNT_NAME))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existing) {
    if (existing.status !== 'active') {
      await db
        .update(accountRegistry)
        .set({ status: 'active', updated_at: new Date().toISOString() })
        .where(eq(accountRegistry.id, existing.id));
      return { ...existing, status: 'active' };
    }
    return existing;
  }

  const now = new Date().toISOString();
  const [created] = await db
    .insert(accountRegistry)
    .values({
      name: TEST_ACCOUNT_NAME,
      type: 'bank_account',
      institution: 'TNPA Test Bank',
      account_number_masked: '****2424',
      currency: 'USD',
      current_balance: 100000,
      status: 'active',
      notes: 'Runtime validation account for lifecycle integration checks.',
      created_at: now,
      updated_at: now,
    })
    .returning();
  return created;
}

async function ensureTestAsset(): Promise<Asset> {
  const existing = await db
    .select()
    .from(assets)
    .where(eq(assets.symbol, TEST_ASSET_SYMBOL))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existing) return existing;

  const now = new Date().toISOString();
  const [created] = await db
    .insert(assets)
    .values({
      name: 'TNPA Account Integration Test Asset',
      symbol: TEST_ASSET_SYMBOL,
      asset_class: 'stock',
      purpose: 'wealth_compounder',
      current_value: 1250,
      currency: 'USD',
      include_in_investment_net_worth: true,
      include_in_total_net_worth: true,
      quantity: 0,
      cost_basis: 0,
      notes: 'Runtime validation asset for account integration.',
      is_archived: false,
      created_at: now,
      updated_at: now,
    })
    .returning();
  return created;
}

async function getRequiredVenue(name: string) {
  const account = await db
    .select()
    .from(accountRegistry)
    .where(eq(accountRegistry.name, name))
    .limit(1)
    .then((rows) => rows[0] ?? null);
  assert(account, `${name} account is missing from Account Registry.`);
  assert(account.status === 'active', `${name} account is not active.`);
  return account;
}

async function ensureBuy(account: AccountRegistry, asset: Asset) {
  const existing = await db
    .select()
    .from(transactions)
    .where(and(
      eq(transactions.asset_id, asset.id),
      eq(transactions.funding_account_id, account.id),
      eq(transactions.type, 'buy'),
    ))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existing) return existing;

  const vcbs = await getRequiredVenue('VCBS');
  return createLifecycleTransaction({
    assetId: asset.id,
    type: 'buy',
    transactionDate: new Date().toISOString().split('T')[0],
    settlementDate: new Date().toISOString().split('T')[0],
    quantity: 10,
    price: 100,
    amount: 1001,
    totalAmount: 1000,
    grossProceeds: null,
    currency: 'USD',
    fees: 1,
    tax: 0,
    fundingAccountId: account.id,
    executionAccountId: vcbs.id,
    custodyAccountId: vcbs.id,
    receiveAccountId: null,
    fromCustodyAccountId: null,
    toCustodyAccountId: null,
    transferFee: null,
    notes: 'Runtime validation buy using Account Registry bank account.',
  });
}

async function main() {
  const account = await ensureTestAccount();
  const asset = await ensureTestAsset();
  const buy = await ensureBuy(account, asset);

  const assetLifecycle = await getAssetLifecycleSummary(asset.id);
  assert(
    assetLifecycle.firstFundingAccount?.id === account.id,
    'Asset lifecycle did not resolve the runtime bank account as funding source.',
  );

  const accountDetail = await getAccountDetailSummary(account.id);
  assert(accountDetail, 'Account detail summary is missing.');
  assert(
    accountDetail.linkedTransactions.some((transaction) => transaction.id === buy.id),
    'Account detail does not include the linked buy transaction.',
  );
  assert(
    accountDetail.fundedAssets.some((fundedAsset) => fundedAsset.id === asset.id),
    'Account detail does not include the funded asset.',
  );

  const dashboard = await getLifecycleDashboard();
  assert(
    dashboard.cashByAccount.some((row) => row.account.id === account.id),
    'Dashboard Cash by Account does not include the runtime bank account.',
  );
  assert(
    dashboard.idleCashByBankBroker.some((row) => row.account.id === account.id),
    'Dashboard Idle Cash by Bank/Broker does not include the runtime bank account.',
  );

  console.log('Account integration runtime checks passed.');
  console.log(`  Account: ${account.name} (#${account.id})`);
  console.log(`  Asset: ${asset.name} (#${asset.id})`);
  console.log(`  Transaction: buy #${buy.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
