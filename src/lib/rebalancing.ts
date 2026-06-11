import type { Asset } from '@/db/schema';
import { normalizeToUsd } from '@/lib/fx';

export type RebalancingAssetClass =
  | 'stock'
  | 'crypto'
  | 'cash'
  | 'funds'
  | 'gold'
  | 'real_estate'
  | 'private_loan';

export const REBALANCING_CLASSES: RebalancingAssetClass[] = [
  'stock',
  'crypto',
  'cash',
  'funds',
  'gold',
  'real_estate',
  'private_loan',
];

export const REBALANCING_LABELS: Record<RebalancingAssetClass, string> = {
  stock: 'Stocks',
  crypto: 'Crypto',
  cash: 'Banking',
  funds: 'Funds',
  gold: 'Gold',
  real_estate: 'Real Estate',
  private_loan: 'Private Loans',
};

export const REBALANCING_COLORS: Record<RebalancingAssetClass, string> = {
  stock: '#818CF8',
  crypto: '#A78BFA',
  cash: '#34D399',
  funds: '#60A5FA',
  gold: '#EAB308',
  real_estate: '#F97316',
  private_loan: '#FBBF24',
};

export const REBALANCING_SETTINGS_KEYS: Record<RebalancingAssetClass, string> = {
  stock: 'target_stocks',
  crypto: 'target_crypto',
  cash: 'target_banking',
  funds: 'target_funds',
  gold: 'target_gold',
  real_estate: 'target_real_estate',
  private_loan: 'target_private_loans',
};

export const DEFAULT_TARGETS: Record<RebalancingAssetClass, number> = {
  stock: 40,
  crypto: 20,
  cash: 15,
  funds: 10,
  gold: 5,
  real_estate: 5,
  private_loan: 5,
};

export interface AllocationRow {
  assetClass: RebalancingAssetClass;
  label: string;
  color: string;
  currentValueUsd: number;
  currentPct: number;
  targetPct: number;
  // target - current: positive = underweight (BUY), negative = overweight (SELL)
  differencePct: number;
  targetValueUsd: number;
  differenceValueUsd: number;
  action: 'BUY' | 'SELL' | 'ON TARGET';
}

export interface RebalancingResult {
  portfolioValue: number;
  rows: AllocationRow[];
  driftScore: number;
  largestOverweight: AllocationRow | null;
  largestUnderweight: AllocationRow | null;
}

export function computeRebalancing(
  assets: Asset[],
  targets: Record<RebalancingAssetClass, number>,
  usdVndRate: number,
): RebalancingResult {
  const active = assets.filter((a) => !a.is_archived && a.include_in_investment_net_worth);

  const portfolioValue = active.reduce(
    (sum, a) => sum + normalizeToUsd(a.current_value, a.currency, usdVndRate),
    0,
  );

  const valueByClass = new Map<RebalancingAssetClass, number>();
  for (const cls of REBALANCING_CLASSES) valueByClass.set(cls, 0);

  for (const asset of active) {
    const cls = asset.asset_class as RebalancingAssetClass;
    if (REBALANCING_CLASSES.includes(cls)) {
      valueByClass.set(cls, (valueByClass.get(cls) ?? 0) + normalizeToUsd(asset.current_value, asset.currency, usdVndRate));
    }
  }

  const rows: AllocationRow[] = REBALANCING_CLASSES.map((cls) => {
    const currentValueUsd = valueByClass.get(cls) ?? 0;
    const currentPct = portfolioValue > 0 ? (currentValueUsd / portfolioValue) * 100 : 0;
    const targetPct = targets[cls];
    const differencePct = targetPct - currentPct;
    const targetValueUsd = portfolioValue * (targetPct / 100);
    const differenceValueUsd = targetValueUsd - currentValueUsd;

    let action: 'BUY' | 'SELL' | 'ON TARGET';
    if (Math.abs(differencePct) <= 1) {
      action = 'ON TARGET';
    } else {
      action = differenceValueUsd > 0 ? 'BUY' : 'SELL';
    }

    return {
      assetClass: cls,
      label: REBALANCING_LABELS[cls],
      color: REBALANCING_COLORS[cls],
      currentValueUsd,
      currentPct,
      targetPct,
      differencePct,
      targetValueUsd,
      differenceValueUsd,
      action,
    };
  });

  const driftScore = rows.reduce((sum, r) => sum + Math.abs(r.differencePct), 0);

  const overweights = rows
    .filter((r) => r.differencePct < -1)
    .sort((a, b) => a.differencePct - b.differencePct);
  const underweights = rows
    .filter((r) => r.differencePct > 1)
    .sort((a, b) => b.differencePct - a.differencePct);

  return {
    portfolioValue,
    rows,
    driftScore,
    largestOverweight: overweights[0] ?? null,
    largestUnderweight: underweights[0] ?? null,
  };
}
