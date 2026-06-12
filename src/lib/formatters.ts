import type { AssetClass, AssetPurpose, TransactionType } from '@/db/schema';

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

export function formatValue(value: number, currency = 'USD'): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }
  return formatCurrency(value);
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
  real_estate: 'Real Estate',
  gold: 'Gold',
  cash: 'Cash',
  funds: 'Funds',
  private_loan: 'Private Loan',
  other: 'Other',
};

export const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  stock: '#818CF8',
  crypto: '#A78BFA',
  real_estate: '#F97316',
  gold: '#EAB308',
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
  retirement: 'Retirement',
};

export const PURPOSE_COLORS: Record<AssetPurpose, string> = {
  wealth_compounder: '#818CF8',
  income_generator: '#34D399',
  liquidity_reserve: '#60A5FA',
  opportunity_capital: '#F472B6',
  store_of_value: '#FBBF24',
  strategic_asset: '#F87171',
  retirement: '#FB923C',
};

export const OPPORTUNITY_SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  telegram: 'Telegram',
  ai: 'AI',
  other: 'Other',
};

export const OPPORTUNITY_SOURCE_COLORS: Record<string, string> = {
  manual: '#9CA3AF',
  telegram: '#60A5FA',
  ai: '#A78BFA',
  other: '#6B7280',
};

export const OPPORTUNITY_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  promoted: 'Promoted',
  rejected: 'Rejected',
};

export const OPPORTUNITY_STATUS_COLORS: Record<string, string> = {
  new: '#818CF8',
  reviewing: '#FBBF24',
  promoted: '#34D399',
  rejected: '#F87171',
};

export const WATCHLIST_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  archived: 'Archived',
  promoted: 'Promoted',
  rejected: 'Rejected',
};

export const DECISION_TYPE_LABELS: Record<string, string> = {
  buy: 'Buy',
  sell: 'Sell',
  hold: 'Hold',
  trim: 'Trim',
  add: 'Add',
  reduce: 'Reduce',
  rebalance: 'Rebalance',
  review: 'Review',
  reject: 'Reject',
  monitor: 'Monitor',
};

export const DECISION_TYPE_COLORS: Record<string, string> = {
  buy: '#34D399',
  add: '#34D399',
  sell: '#F87171',
  trim: '#FBBF24',
  reduce: '#FBBF24',
  rebalance: '#818CF8',
  hold: '#60A5FA',
  monitor: '#9CA3AF',
  reject: '#F87171',
  review: '#A78BFA',
};

export const DECISION_OUTCOME_LABELS: Record<string, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
};

export const DECISION_OUTCOME_COLORS: Record<string, string> = {
  positive: '#34D399',
  neutral: '#FBBF24',
  negative: '#F87171',
};

export const RESEARCH_NOTE_TYPE_LABELS: Record<string, string> = {
  research: 'Research',
  observation: 'Observation',
  earnings: 'Earnings',
  news: 'News',
  source: 'Source',
  review: 'Review',
};

export const RESEARCH_NOTE_TYPE_COLORS: Record<string, string> = {
  research: '#818CF8',
  observation: '#60A5FA',
  earnings: '#34D399',
  news: '#F472B6',
  source: '#9CA3AF',
  review: '#FBBF24',
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  buy: 'Buy',
  sell: 'Sell',
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  dividend: 'Dividend',
  interest: 'Interest',
  fee: 'Fee',
  transfer: 'Transfer',
  adjustment: 'Adjustment',
};

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  buy: '#34D399',
  sell: '#F87171',
  deposit: '#60A5FA',
  withdraw: '#F97316',
  dividend: '#A78BFA',
  interest: '#FBBF24',
  fee: '#6B7280',
  transfer: '#E879F9',
  adjustment: '#9CA3AF',
};
