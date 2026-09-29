import type { Asset, AssetClass, AssetPurpose, BankAccount, BankSavingsDeposit, BankCreditCard, BankCreditFacility, AccountRegistry } from '@/db/schema';
import { normalizeToUsd } from './fx';
export type PortfolioSource =
  | 'registry_cash'
  | 'legacy_holdings'
  | 'banking_accounts'
  | 'savings_deposits'
  | 'credit_cards'
  | 'credit_facilities';

export interface PortfolioPosition {
  id: string;
  numericId: number;
  name: string;
  symbol: string | null;
  assetClass: AssetClass;
  market: string;
  purpose: AssetPurpose;
  currency: string;
  value: number;
  valueUsd: number;
  isLiability: boolean;
  includeInInvestmentNetWorth: boolean;
  includeInTotalNetWorth: boolean;
  source: PortfolioSource;
  bankName?: string;
  legacyAsset?: Asset;
}

export interface SourceContribution {
  key: string;
  label: string;
  valueUsd: number;
  count: number;
}

export interface PortfolioSummary {
  usdVndRate: number;
  positions: PortfolioPosition[];
  assets: PortfolioPosition[];
  liabilities: PortfolioPosition[];
  legacyAssets: Asset[];
  archivedAssets: Asset[];
  investmentNetWorth: number;
  totalNetWorth: number;
  activeAssetValueUsd: number;
  liabilityValueUsd: number;
  sourceContributions: SourceContribution[];
}

function asNumericId(prefix: number, id: number) {
  return prefix * 1_000_000 + id;
}

function toLegacyPosition(asset: Asset, usdVndRate: number): PortfolioPosition {
  return {
    id: `asset:${asset.id}`,
    numericId: asset.id,
    name: asset.name,
    symbol: asset.symbol,
    assetClass: asset.asset_class,
    market: asset.asset_class,
    purpose: asset.purpose,
    currency: asset.currency,
    value: asset.current_value,
    valueUsd: normalizeToUsd(asset.current_value, asset.currency, usdVndRate),
    isLiability: false,
    includeInInvestmentNetWorth: asset.include_in_investment_net_worth,
    includeInTotalNetWorth: asset.include_in_total_net_worth,
    source: 'legacy_holdings',
    legacyAsset: asset,
  };
}

export function positionToAsset(position: PortfolioPosition): Asset {
  if (position.legacyAsset) return position.legacyAsset;
  const now = new Date().toISOString();
  return {
    id: position.numericId,
    name: position.name,
    symbol: position.symbol,
    asset_class: position.assetClass,
    purpose: position.purpose,
    current_value: position.value,
    currency: position.currency,
    include_in_investment_net_worth: position.includeInInvestmentNetWorth,
    include_in_total_net_worth: position.includeInTotalNetWorth,
    cash_source_type: null,
    cash_source_id: null,
    quantity: null,
    cost_basis: null,
    notes: `Portfolio aggregation source: ${position.source}`,
    is_archived: false,
    created_at: now,
    updated_at: now,
  };
}

function sourceLabel(position: PortfolioPosition) {
  if (position.source === 'registry_cash') return 'Registry Cash';
  if (position.source === 'banking_accounts') return 'Banking Accounts';
  if (position.source === 'savings_deposits') return 'Savings Deposits';
  if (position.source === 'credit_cards') return 'Credit Used';
  if (position.source === 'credit_facilities') return 'Credit Used';
  const labels: Record<string, string> = {
    stock: 'Stocks',
    crypto: 'Crypto',
    real_estate: 'Real Estate',
    gold: 'Gold',
    cash: 'Legacy Holdings',
    funds: 'Funds',
    private_loan: 'Loans',
    other: 'Legacy Holdings',
  };
  return labels[position.assetClass] ?? 'Legacy Holdings';
}

function sourceKey(position: PortfolioPosition) {
  if (position.source === 'registry_cash') return 'registry_cash';
  if (position.source === 'banking_accounts') return 'banking_accounts';
  if (position.source === 'savings_deposits') return 'savings_deposits';
  if (position.source === 'credit_cards' || position.source === 'credit_facilities') return 'credit_used';
  const keys: Record<string, string> = {
    stock: 'stocks',
    crypto: 'crypto',
    real_estate: 'real_estate',
    gold: 'gold',
    cash: 'legacy_holdings',
    funds: 'funds',
    private_loan: 'loans',
    other: 'legacy_holdings',
  };
  return keys[position.assetClass] ?? 'legacy_holdings';
}

export interface PortfolioInput {
  usdVndRate: number; legacyAssets: Asset[]; accounts: BankAccount[]; deposits: BankSavingsDeposit[];
  creditCards: BankCreditCard[]; creditFacilities: BankCreditFacility[]; registry: AccountRegistry[];
}
export function buildPortfolioSummary({ usdVndRate, legacyAssets, accounts, deposits, creditCards, creditFacilities, registry }: PortfolioInput): PortfolioSummary {
  const activeAccounts = accounts.filter((account) => account.status === 'active');
  const activeDeposits = deposits.filter((deposit) => deposit.status === 'active');
  const activeCreditCards = creditCards.filter((card) => card.current_used > 0);
  const activeCreditFacilities = creditFacilities.filter((facility) => facility.current_used > 0);
  const accountBankById = new Map(accounts.map((account) => [account.id, account.bank_name]));

  // Source links are identity, never fuzzy name/value matching.
  for (const account of registry.filter(r => r.status === 'active' && !r.bank_account_id && r.type === 'bank_account')) {
    if (activeAccounts.some(b => b.account_name.trim().toLowerCase() === account.name.trim().toLowerCase() && b.bank_name === account.institution)) {
      throw new Error('Ambiguous bank cash: link the Account Registry entry to its Banking account before using totals.');
    }
  }

  const activeLegacyAssets = legacyAssets.filter(
    (asset) => !asset.is_archived && !asset.cash_source_type,
  );
  const archivedAssets = legacyAssets.filter((asset) => asset.is_archived);

  const positions: PortfolioPosition[] = [
    ...activeLegacyAssets.map((asset) => toLegacyPosition(asset, usdVndRate)),
    ...registry.filter(r => r.status === 'active' && !r.bank_account_id).map(r => ({
      id: `registry:${r.id}`, numericId: asNumericId(14, r.id), name: r.name + ' · Cash', symbol: null,
      assetClass: 'cash' as AssetClass, market: 'banking', purpose: 'liquidity_reserve' as AssetPurpose,
      currency: r.currency, value: r.current_balance, valueUsd: normalizeToUsd(r.current_balance, r.currency, usdVndRate),
      isLiability: r.current_balance < 0, includeInInvestmentNetWorth: true, includeInTotalNetWorth: true,
      source: 'registry_cash' as PortfolioSource,
    })),
    ...activeAccounts.map((account) => ({
      id: `bank-account:${account.id}`,
      numericId: asNumericId(10, account.id),
      name: `${account.bank_name} · ${account.account_name}`,
      symbol: null,
      assetClass: 'cash' as AssetClass,
      market: 'banking',
      purpose: account.purpose,
      currency: account.currency,
      value: account.balance,
      valueUsd: normalizeToUsd(account.balance, account.currency, usdVndRate),
      isLiability: account.balance < 0,
      includeInInvestmentNetWorth: true,
      includeInTotalNetWorth: true,
      source: 'banking_accounts' as PortfolioSource,
      bankName: account.bank_name,
    })),
    ...activeDeposits.map((deposit) => ({
      id: `savings-deposit:${deposit.id}`,
      numericId: asNumericId(11, deposit.id),
      name: deposit.deposit_name,
      symbol: null,
      assetClass: 'cash' as AssetClass,
      market: 'banking',
      purpose: 'liquidity_reserve' as AssetPurpose,
      currency: 'VND',
      value: deposit.principal,
      valueUsd: normalizeToUsd(deposit.principal, 'VND', usdVndRate),
      isLiability: false,
      includeInInvestmentNetWorth: true,
      includeInTotalNetWorth: true,
      source: 'savings_deposits' as PortfolioSource,
      bankName: deposit.bank_name ?? (deposit.bank_account_id ? accountBankById.get(deposit.bank_account_id) : undefined) ?? 'Unassigned',
    })),
    ...activeCreditCards.map((card) => ({
      id: `credit-card:${card.id}`,
      numericId: asNumericId(12, card.id),
      name: `${card.bank_name} · ${card.card_name}`,
      symbol: null,
      assetClass: 'cash' as AssetClass,
      market: 'banking',
      purpose: 'liquidity_reserve' as AssetPurpose,
      currency: 'VND',
      value: -card.current_used,
      valueUsd: -normalizeToUsd(card.current_used, 'VND', usdVndRate),
      isLiability: true,
      includeInInvestmentNetWorth: true,
      includeInTotalNetWorth: true,
      source: 'credit_cards' as PortfolioSource,
      bankName: card.bank_name,
    })),
    ...activeCreditFacilities.map((facility) => ({
      id: `credit-facility:${facility.id}`,
      numericId: asNumericId(13, facility.id),
      name: `${facility.bank_name} · ${facility.facility_name}`,
      symbol: null,
      assetClass: 'cash' as AssetClass,
      market: 'banking',
      purpose: 'liquidity_reserve' as AssetPurpose,
      currency: 'VND',
      value: -facility.current_used,
      valueUsd: -normalizeToUsd(facility.current_used, 'VND', usdVndRate),
      isLiability: true,
      includeInInvestmentNetWorth: true,
      includeInTotalNetWorth: true,
      source: 'credit_facilities' as PortfolioSource,
      bankName: facility.bank_name,
    })),
  ];

  const activeAssetValueUsd = positions.filter((p) => !p.isLiability).reduce((sum, p) => sum + p.valueUsd, 0);
  const liabilityValueUsd = Math.abs(positions.filter((p) => p.isLiability).reduce((sum, p) => sum + p.valueUsd, 0));
  const investmentNetWorth = positions
    .filter((p) => p.includeInInvestmentNetWorth)
    .reduce((sum, p) => sum + p.valueUsd, 0);
  const totalNetWorth = positions
    .filter((p) => p.includeInTotalNetWorth)
    .reduce((sum, p) => sum + p.valueUsd, 0);

  const sourceMap = new Map<string, SourceContribution>();
  for (const position of positions) {
    const key = sourceKey(position);
    const current = sourceMap.get(key) ?? { key, label: sourceLabel(position), valueUsd: 0, count: 0 };
    current.valueUsd += position.valueUsd;
    current.count += 1;
    sourceMap.set(key, current);
  }

  return {
    usdVndRate,
    positions,
    assets: positions.filter((p) => !p.isLiability),
    liabilities: positions.filter((p) => p.isLiability),
    legacyAssets: activeLegacyAssets,
    archivedAssets,
    investmentNetWorth,
    totalNetWorth,
    activeAssetValueUsd,
    liabilityValueUsd,
    sourceContributions: Array.from(sourceMap.values()),
  };
}
