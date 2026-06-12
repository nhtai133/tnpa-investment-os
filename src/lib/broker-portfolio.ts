import { db } from '@/db';
import { accountRegistry, assetCustodyPositions, assets, transactions } from '@/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import type { AccountRegistry, Asset } from '@/db/schema';

const EPSILON = 0.00000001;

export interface BrokerHolding {
  asset: Asset;
  quantity: number;
  costBasis: number;
  marketValue: number;
  gainLoss: number;
  gainLossPct: number | null;
  fundingAccountName: string | null;
  fundingAccountId: number | null;
}

export interface BrokerPortfolioRow {
  broker: AccountRegistry;
  cashBalance: number;
  stockCustodyValue: number;
  totalValue: number;
  holdingCount: number;
  transactionCount: number;
  holdings: BrokerHolding[];
  realizedPnl: number;
  unrealizedPnl: number;
}

export async function getBrokerPortfolioBreakdown(): Promise<BrokerPortfolioRow[]> {
  const [brokers, positions, allAssets, allAccounts, allTxns] = await Promise.all([
    db
      .select()
      .from(accountRegistry)
      .where(eq(accountRegistry.type, 'broker_account'))
      .orderBy(asc(accountRegistry.name)),
    db.select().from(assetCustodyPositions),
    db.select().from(assets).where(eq(assets.is_archived, false)),
    db.select().from(accountRegistry),
    db.select().from(transactions).orderBy(desc(transactions.transaction_date)),
  ]);

  const assetMap = new Map(allAssets.map((a) => [a.id, a]));
  const accountMap = new Map(allAccounts.map((a) => [a.id, a]));

  return brokers.map((broker) => {
    const brokerPositions = positions.filter(
      (p) => p.custody_account_id === broker.id && p.quantity > EPSILON,
    );
    const brokerTxns = allTxns.filter(
      (t) =>
        t.execution_account_id === broker.id ||
        t.custody_account_id === broker.id ||
        t.from_custody_account_id === broker.id ||
        t.to_custody_account_id === broker.id,
    );

    const holdings: BrokerHolding[] = brokerPositions
      .map((p) => {
        const asset = assetMap.get(p.asset_id);
        if (!asset || asset.asset_class !== 'stock') return null;

        const pricePerUnit =
          asset.quantity && asset.quantity > 0 ? asset.current_value / asset.quantity : 0;
        const marketValue = pricePerUnit * p.quantity;
        const gainLoss = marketValue - p.cost_basis;
        const gainLossPct = p.cost_basis > 0 ? (gainLoss / p.cost_basis) * 100 : null;

        const firstBuy = allTxns.find(
          (t) =>
            t.asset_id === p.asset_id &&
            t.type === 'buy' &&
            (t.custody_account_id === broker.id || t.execution_account_id === broker.id),
        );
        const fundingAccount = firstBuy
          ? accountMap.get(firstBuy.funding_account_id ?? -1)
          : null;

        return {
          asset,
          quantity: p.quantity,
          costBasis: p.cost_basis,
          marketValue,
          gainLoss,
          gainLossPct,
          fundingAccountName: fundingAccount?.name ?? null,
          fundingAccountId: fundingAccount?.id ?? null,
        };
      })
      .filter((h): h is BrokerHolding => h !== null);

    const stockCustodyValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const realizedPnl = brokerTxns
      .filter((t) => t.type === 'sell')
      .reduce((sum, t) => sum + (t.realized_pnl ?? 0), 0);
    const unrealizedPnl = holdings.reduce((sum, h) => sum + h.gainLoss, 0);

    return {
      broker,
      cashBalance: broker.current_balance,
      stockCustodyValue,
      totalValue: broker.current_balance + stockCustodyValue,
      holdingCount: holdings.length,
      transactionCount: brokerTxns.length,
      holdings,
      realizedPnl,
      unrealizedPnl,
    };
  });
}
