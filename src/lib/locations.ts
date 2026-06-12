import { db } from '@/db';
import { accountRegistry, assetCustodyPositions, assets, transactions } from '@/db/schema';
import { desc } from 'drizzle-orm';
import type { AccountRegistry } from '@/db/schema';

const EPSILON = 0.00000001;

export const ACCOUNT_TYPE_GROUP: Record<string, string> = {
  bank_account: 'Banking',
  cash_location: 'Cash Locations',
  broker_account: 'Stocks / Brokers',
  crypto_exchange: 'Crypto Exchanges',
  crypto_wallet: 'Crypto Wallets',
  gold_storage: 'Gold Storage',
  real_estate_registry: 'Real Estate',
  other_custody: 'Other',
};

export const ACCOUNT_TYPE_MODULE: Record<string, string> = {
  bank_account: 'Banking',
  cash_location: 'Banking',
  broker_account: 'Stocks',
  crypto_exchange: 'Crypto',
  crypto_wallet: 'Crypto',
  gold_storage: 'Gold',
  real_estate_registry: 'Real Estate',
  other_custody: 'System',
};

export const ACCOUNT_TYPE_MODULE_HREF: Record<string, string> = {
  bank_account: '/banking',
  cash_location: '/banking',
  broker_account: '/stocks',
  crypto_exchange: '/crypto',
  crypto_wallet: '/crypto',
  gold_storage: '/gold',
  real_estate_registry: '/real-estate',
  other_custody: '/accounts',
};

export const GROUP_ORDER = [
  'Banking',
  'Cash Locations',
  'Stocks / Brokers',
  'Crypto Exchanges',
  'Crypto Wallets',
  'Gold Storage',
  'Real Estate',
  'Other',
];

export interface LocationSummary {
  account: AccountRegistry;
  group: string;
  module: string;
  moduleHref: string;
  cashBalance: number;
  custodyValue: number;
  totalValue: number;
  realizedPnl: number;
  unrealizedPnl: number;
  positionCount: number;
  transactionCount: number;
  lastActivity: string | null;
  netWorthPct: number;
  isEmpty: boolean;
}

function transactionLinksAccount(
  t: { funding_account_id: number | null; execution_account_id: number | null; custody_account_id: number | null; receive_account_id: number | null; from_custody_account_id: number | null; to_custody_account_id: number | null },
  id: number,
) {
  return (
    t.funding_account_id === id ||
    t.execution_account_id === id ||
    t.custody_account_id === id ||
    t.receive_account_id === id ||
    t.from_custody_account_id === id ||
    t.to_custody_account_id === id
  );
}

export async function getPortfolioLocations(): Promise<{
  locations: LocationSummary[];
  totalValue: number;
  grouped: Record<string, LocationSummary[]>;
}> {
  const [accounts, positions, allAssets, allTxns] = await Promise.all([
    db.select().from(accountRegistry),
    db.select().from(assetCustodyPositions),
    db.select().from(assets),
    db.select().from(transactions).orderBy(desc(transactions.transaction_date)),
  ]);

  const assetMap = new Map(allAssets.map((a) => [a.id, a]));

  const locations: LocationSummary[] = accounts.map((account) => {
    const accountPositions = positions.filter(
      (p) => p.custody_account_id === account.id && p.quantity > EPSILON,
    );

    let custodyValue = 0;
    let unrealizedPnl = 0;

    for (const pos of accountPositions) {
      const asset = assetMap.get(pos.asset_id);
      if (!asset) continue;
      const pricePerUnit =
        asset.quantity && asset.quantity > 0 ? asset.current_value / asset.quantity : 0;
      const marketValue = pricePerUnit * pos.quantity;
      custodyValue += marketValue;
      unrealizedPnl += marketValue - pos.cost_basis;
    }

    const linkedTxns = allTxns.filter((t) => transactionLinksAccount(t, account.id));

    const realizedPnl = linkedTxns
      .filter(
        (t) =>
          t.type === 'sell' &&
          (t.execution_account_id === account.id || t.receive_account_id === account.id),
      )
      .reduce((sum, t) => sum + (t.realized_pnl ?? 0), 0);

    const lastActivity = linkedTxns.length > 0 ? linkedTxns[0].transaction_date : null;
    const cashBalance = account.current_balance;
    const totalValue = cashBalance + custodyValue;

    return {
      account,
      group: ACCOUNT_TYPE_GROUP[account.type] ?? 'Other',
      module: ACCOUNT_TYPE_MODULE[account.type] ?? 'System',
      moduleHref: ACCOUNT_TYPE_MODULE_HREF[account.type] ?? '/accounts',
      cashBalance,
      custodyValue,
      totalValue,
      realizedPnl,
      unrealizedPnl,
      positionCount: accountPositions.length,
      transactionCount: linkedTxns.length,
      lastActivity,
      netWorthPct: 0,
      isEmpty: totalValue < EPSILON && linkedTxns.length === 0,
    };
  });

  const totalValue = locations.reduce((sum, l) => sum + l.totalValue, 0);
  for (const loc of locations) {
    loc.netWorthPct = totalValue > 0 ? (loc.totalValue / totalValue) * 100 : 0;
  }

  locations.sort((a, b) => b.totalValue - a.totalValue);

  const grouped: Record<string, LocationSummary[]> = {};
  for (const loc of locations) {
    if (!grouped[loc.group]) grouped[loc.group] = [];
    grouped[loc.group].push(loc);
  }

  return { locations, totalValue, grouped };
}
