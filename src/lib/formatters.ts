import type { AssetClass, AssetPurpose, TransactionType } from '@/db/schema';
import { tr } from '@/i18n';

export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('vi-VN', {
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
  if (currency === 'USDT' || currency === 'USDC') {
    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 8 }).format(value)} ${currency}`;
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
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  stock: tr('Stock'), crypto: tr('Crypto'), real_estate: tr('Real Estate'), gold: tr('Gold'), cash: tr('Cash'), funds: tr('Funds'), private_loan: tr('Private Loan'), other: tr('Other'),
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
  wealth_compounder: tr('Wealth Compounder'), income_generator: tr('Income Generator'), liquidity_reserve: tr('Liquidity Reserve'), opportunity_capital: tr('Opportunity Capital'), store_of_value: tr('Store of Value'), strategic_asset: tr('Strategic Asset'), retirement: tr('Retirement'),
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
  manual: tr('Manual'), telegram: tr('Telegram'), ai: 'AI', other: tr('Other'),
};

export const OPPORTUNITY_SOURCE_COLORS: Record<string, string> = {
  manual: '#9CA3AF',
  telegram: '#60A5FA',
  ai: '#A78BFA',
  other: '#6B7280',
};

export const OPPORTUNITY_STATUS_LABELS: Record<string, string> = {
  new: tr('New'), reviewing: tr('Reviewing'), promoted: tr('Promoted'), rejected: tr('Rejected'),
};

export const OPPORTUNITY_STATUS_COLORS: Record<string, string> = {
  new: '#818CF8',
  reviewing: '#FBBF24',
  promoted: '#34D399',
  rejected: '#F87171',
};

export const WATCHLIST_STATUS_LABELS: Record<string, string> = {
  active: tr('Active'), archived: tr('Archived'), promoted: tr('Promoted'), rejected: tr('Rejected'),
};

export const DECISION_TYPE_LABELS: Record<string, string> = {
  buy: tr('Buy'), sell: tr('Sell'), hold: tr('Hold'), trim: tr('Trim'), add: tr('Add'), reduce: tr('Reduce'), rebalance: tr('Rebalance'), review: tr('Review'), reject: tr('Reject'), monitor: tr('Monitor'),
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
  positive: tr('Positive'), neutral: tr('Neutral'), negative: tr('Negative'),
};

export const DECISION_OUTCOME_COLORS: Record<string, string> = {
  positive: '#34D399',
  neutral: '#FBBF24',
  negative: '#F87171',
};

export const RESEARCH_NOTE_TYPE_LABELS: Record<string, string> = {
  research: tr('Research'), observation: tr('Observation'), earnings: tr('Earnings'), news: tr('News'), source: tr('Source'), review: tr('Review'),
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
  buy: tr('Buy'), sell: tr('Sell'), deposit: tr('Deposit'), withdraw: tr('Withdraw'), dividend: tr('Dividend'), interest: tr('Interest'), fee: tr('Fee'), transfer: tr('Transfer'), adjustment: tr('Adjustment'), opening_position: tr('opening_position'), opening_balance: tr('opening_balance'), basis_adjustment: tr('basis_adjustment'),
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
  opening_position: '#A78BFA',
  opening_balance: '#60A5FA',
  basis_adjustment: '#A78BFA',
};
