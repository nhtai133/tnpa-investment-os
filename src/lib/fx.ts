import type { Asset } from '@/db/schema';

export const REPORTING_CURRENCY = 'USD' as const;
export const DEFAULT_USD_VND_RATE = 25500;

export function normalizeToUsd(
  value: number,
  currency: string,
  usdVndRate = DEFAULT_USD_VND_RATE,
): number {
  if (!Number.isFinite(value) || !Number.isFinite(usdVndRate) || usdVndRate <= 0) throw new Error('Invalid amount or USD/VND rate.');
  if (currency === 'VND') return value / usdVndRate;
  if (currency === 'USD') return value;
  throw new Error(`Unsupported currency: ${currency}. No conversion rate configured.`);
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

export function convertCurrency(value: number, from: string, to: string, rate = DEFAULT_USD_VND_RATE) {
  const usd = normalizeToUsd(value, from, rate);
  if (to === 'USD') return usd;
  if (to === 'VND') return usd * rate;
  throw new Error(`Unsupported currency: ${to}`);
}
