import type { Asset, AssetClass, AssetPurpose } from '@/db/schema';
import { normalizeToUsd } from '@/lib/fx';

export interface AssetClassBreakdown {
  asset_class: AssetClass;
  value: number;
  weight: number;
  count: number;
}

export interface PurposeBreakdown {
  purpose: AssetPurpose;
  value: number;
  weight: number;
  count: number;
}

export function computeInvestmentNetWorth(assets: Asset[], usdVndRate: number): number {
  return assets
    .filter((a) => a.include_in_investment_net_worth)
    .reduce((sum, a) => sum + normalizeToUsd(a.current_value, a.currency, usdVndRate), 0);
}

export function computeTotalNetWorth(assets: Asset[], usdVndRate: number, liabilitiesUsd = 0): number {
  const assetValue = assets
    .filter((a) => a.include_in_total_net_worth)
    .reduce((sum, a) => sum + normalizeToUsd(a.current_value, a.currency, usdVndRate), 0);
  return assetValue - liabilitiesUsd;
}

export function computeAssetClassBreakdown(
  assets: Asset[],
  investmentNetWorth: number,
  usdVndRate: number,
): AssetClassBreakdown[] {
  const investableAssets = assets.filter((a) => a.include_in_investment_net_worth);
  const map = new Map<AssetClass, { value: number; count: number }>();

  for (const asset of investableAssets) {
    const existing = map.get(asset.asset_class) ?? { value: 0, count: 0 };
    map.set(asset.asset_class, {
      value: existing.value + normalizeToUsd(asset.current_value, asset.currency, usdVndRate),
      count: existing.count + 1,
    });
  }

  return Array.from(map.entries()).map(([asset_class, { value, count }]) => ({
    asset_class,
    value,
    weight: investmentNetWorth > 0 ? (value / investmentNetWorth) * 100 : 0,
    count,
  }));
}

export function computePurposeBreakdown(
  assets: Asset[],
  totalNetWorth: number,
  usdVndRate: number,
): PurposeBreakdown[] {
  const map = new Map<AssetPurpose, { value: number; count: number }>();

  for (const asset of assets.filter((a) => a.include_in_total_net_worth)) {
    const existing = map.get(asset.purpose) ?? { value: 0, count: 0 };
    map.set(asset.purpose, {
      value: existing.value + normalizeToUsd(asset.current_value, asset.currency, usdVndRate),
      count: existing.count + 1,
    });
  }

  return Array.from(map.entries())
    .map(([purpose, { value, count }]) => ({
      purpose,
      value,
      weight: totalNetWorth > 0 ? (value / totalNetWorth) * 100 : 0,
      count,
    }))
    .sort((a, b) => b.value - a.value);
}

export function hasMultipleCurrencies(assets: Asset[]): boolean {
  const currencies = new Set(assets.map((a) => a.currency));
  return currencies.size > 1;
}

export function computeTopHoldings(assets: Asset[], totalNetWorth: number, usdVndRate: number) {
  return [...assets]
    .filter((a) => a.include_in_total_net_worth)
    .sort(
      (a, b) =>
        normalizeToUsd(b.current_value, b.currency, usdVndRate) -
        normalizeToUsd(a.current_value, a.currency, usdVndRate),
    )
    .slice(0, 8)
    .map((asset) => ({
      ...asset,
      weight:
        totalNetWorth > 0
          ? (normalizeToUsd(asset.current_value, asset.currency, usdVndRate) / totalNetWorth) * 100
          : 0,
      unrealized_gain:
        asset.cost_basis != null ? asset.current_value - asset.cost_basis : null,
      unrealized_gain_pct:
        asset.cost_basis != null && asset.cost_basis > 0
          ? ((asset.current_value - asset.cost_basis) / asset.cost_basis) * 100
          : null,
    }));
}
