import type { AssetClass, AssetPurpose } from '@/db/schema';

export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatWeight(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  stock: 'Stock',
  crypto: 'Crypto',
  cash: 'Cash',
  funds: 'Funds',
  private_loan: 'Private Loan',
  other: 'Other',
};

export const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  stock: '#818CF8',
  crypto: '#A78BFA',
  cash: '#34D399',
  funds: '#60A5FA',
  private_loan: '#FBBF24',
  other: '#9CA3AF',
};

export const PURPOSE_LABELS: Record<AssetPurpose, string> = {
  wealth_compounder: 'Wealth Compounder',
  income_generator: 'Income Generator',
  liquidity_reserve: 'Liquidity Reserve',
  opportunity_capital: 'Opportunity Capital',
  store_of_value: 'Store of Value',
  strategic_asset: 'Strategic Asset',
};

export const PURPOSE_COLORS: Record<AssetPurpose, string> = {
  wealth_compounder: '#818CF8',
  income_generator: '#34D399',
  liquidity_reserve: '#60A5FA',
  opportunity_capital: '#F472B6',
  store_of_value: '#FBBF24',
  strategic_asset: '#F87171',
};

export const DECISION_TYPE_LABELS: Record<string, string> = {
  buy: 'Buy',
  sell: 'Sell',
  hold: 'Hold',
  trim: 'Trim',
  add: 'Add',
  reject: 'Reject',
  monitor: 'Monitor',
};

export const DECISION_TYPE_COLORS: Record<string, string> = {
  buy: '#34D399',
  add: '#34D399',
  sell: '#F87171',
  trim: '#FBBF24',
  hold: '#60A5FA',
  monitor: '#9CA3AF',
  reject: '#F87171',
};
