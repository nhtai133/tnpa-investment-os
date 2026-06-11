import { db } from '@/db';
import {
  assets,
  bankAccounts,
  bankCreditCards,
  bankCreditFacilities,
  bankSavingsDeposits,
  type Asset,
  type AssetClass,
  type AssetPurpose,
} from '@/db/schema';
import { normalizeToUsd } from '@/lib/fx';
import { getUsdVndRate } from '@/lib/settings';
import { asc, eq } from 'drizzle-orm';

export type PortfolioSource =
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

function isDuplicateMigratedBankingAsset(asset: Asset, bankAssetKeys: Set<string>) {
  if (asset.asset_class !== 'cash') return false;
  const key = `${asset.name.trim().toLowerCase()}|${Math.round(asset.current_value)}`;
  return bankAssetKeys.has(key);
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
    quantity: null,
    cost_basis: null,
    notes: `Portfolio aggregation source: ${position.source}`,
    is_archived: false,
    created_at: now,
    updated_at: now,
  };
}

function sourceLabel(position: PortfolioPosition) {
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

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const [usdVndRate, legacyAssets, accounts, deposits, creditCards, creditFacilities] = await Promise.all([
    getUsdVndRate(),
    db.select().from(assets).orderBy(asc(assets.name)),
    db.select().from(bankAccounts).orderBy(asc(bankAccounts.bank_name), asc(bankAccounts.account_name)),
    db.select().from(bankSavingsDeposits).orderBy(asc(bankSavingsDeposits.deposit_name)),
    db.select().from(bankCreditCards).orderBy(asc(bankCreditCards.bank_name), asc(bankCreditCards.card_name)),
    db.select().from(bankCreditFacilities).orderBy(asc(bankCreditFacilities.bank_name), asc(bankCreditFacilities.facility_name)),
  ]);

  const activeAccounts = accounts.filter((account) => account.status === 'active');
  const activeDeposits = deposits.filter((deposit) => deposit.status === 'active');
  const activeCreditCards = creditCards.filter((card) => card.status === 'active' && card.current_used > 0);
  const activeCreditFacilities = creditFacilities.filter((facility) => facility.status === 'active' && facility.current_used > 0);
  const accountBankById = new Map(accounts.map((account) => [account.id, account.bank_name]));

  const bankAssetKeys = new Set<string>();
  for (const account of activeAccounts) bankAssetKeys.add(`${account.account_name.trim().toLowerCase()}|${Math.round(account.balance)}`);
  for (const deposit of activeDeposits) bankAssetKeys.add(`${deposit.deposit_name.trim().toLowerCase()}|${Math.round(deposit.principal)}`);

  const activeLegacyAssets = legacyAssets.filter(
    (asset) => !asset.is_archived && !isDuplicateMigratedBankingAsset(asset, bankAssetKeys),
  );
  const archivedAssets = legacyAssets.filter((asset) => asset.is_archived);

  const positions: PortfolioPosition[] = [
    ...activeLegacyAssets.map((asset) => toLegacyPosition(asset, usdVndRate)),
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
      isLiability: false,
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

export async function getInvestmentNetWorth() {
  return (await getPortfolioSummary()).investmentNetWorth;
}

export async function getTotalNetWorth() {
  return (await getPortfolioSummary()).totalNetWorth;
}

export async function getAllocationByClass() {
  const summary = await getPortfolioSummary();
  const map = new Map<AssetClass, { value: number; count: number }>();
  for (const position of summary.positions.filter((p) => p.includeInInvestmentNetWorth)) {
    const existing = map.get(position.assetClass) ?? { value: 0, count: 0 };
    map.set(position.assetClass, { value: existing.value + position.valueUsd, count: existing.count + 1 });
  }
  return Array.from(map.entries()).map(([asset_class, row]) => ({
    asset_class,
    value: row.value,
    count: row.count,
    weight: summary.investmentNetWorth > 0 ? (row.value / summary.investmentNetWorth) * 100 : 0,
  }));
}

export async function getAllocationByMarket() {
  const summary = await getPortfolioSummary();
  const map = new Map<string, { value: number; count: number }>();
  for (const position of summary.positions) {
    const existing = map.get(position.market) ?? { value: 0, count: 0 };
    map.set(position.market, { value: existing.value + position.valueUsd, count: existing.count + 1 });
  }
  return Array.from(map.entries()).map(([market, row]) => ({
    market,
    value: row.value,
    count: row.count,
    weight: summary.totalNetWorth > 0 ? (row.value / summary.totalNetWorth) * 100 : 0,
  }));
}

export async function getLiabilitiesSummary() {
  const summary = await getPortfolioSummary();
  return {
    totalLiabilitiesUsd: summary.liabilityValueUsd,
    liabilities: summary.liabilities,
  };
}

export async function getLiquiditySummary() {
  const summary = await getPortfolioSummary();
  const cashPositions = summary.assets.filter((position) => position.assetClass === 'cash');
  return {
    liquidityUsd: cashPositions.reduce((sum, position) => sum + position.valueUsd, 0),
    positions: cashPositions,
  };
}

export async function getAggregatedAssets() {
  const summary = await getPortfolioSummary();
  return summary.positions.map(positionToAsset);
}

export async function getAggregatedActiveAssetsByClass(assetClass: AssetClass) {
  const summary = await getPortfolioSummary();
  return summary.positions
    .filter((position) => position.assetClass === assetClass && !position.isLiability)
    .map(positionToAsset);
}
