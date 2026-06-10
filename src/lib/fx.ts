import type { Asset } from '@/db/schema';

export const REPORTING_CURRENCY = 'USD' as const;
export const DEFAULT_USD_VND_RATE = 25500;

export function normalizeToUsd(
  value: number,
  currency: string,
  usdVndRate = DEFAULT_USD_VND_RATE,
): number {
  if (currency === 'VND') return value / usdVndRate;
  return value;
}

export function getNormalizedValueUsd(
  asset: Pick<Asset, 'current_value' | 'currency'>,
  usdVndRate = DEFAULT_USD_VND_RATE,
): number {
  return normalizeToUsd(asset.current_value, asset.currency, usdVndRate);
}

export function getNormalizedCostBasisUsd(
  asset: Pick<Asset, 'cost_basis' | 'currency'>,
  usdVndRate = DEFAULT_USD_VND_RATE,
): number {
  if (asset.cost_basis == null) return 0;
  return normalizeToUsd(asset.cost_basis, asset.currency, usdVndRate);
}
