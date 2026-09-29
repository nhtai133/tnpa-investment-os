import { db } from '@/db';
import { assets, bankAccounts, bankCreditCards, bankCreditFacilities, bankSavingsDeposits, accountRegistry, type AssetClass } from '@/db/schema';
import { getUsdVndRate } from './settings';
import { buildPortfolioSummary, positionToAsset } from './portfolio-model';
export * from './portfolio-model';
export async function getPortfolioSummary() {
  const [usdVndRate, legacyAssets, accounts, deposits, creditCards, creditFacilities, registry] = await Promise.all([
    getUsdVndRate(), db.select().from(assets), db.select().from(bankAccounts), db.select().from(bankSavingsDeposits),
    db.select().from(bankCreditCards), db.select().from(bankCreditFacilities), db.select().from(accountRegistry),
  ]);
  return buildPortfolioSummary({ usdVndRate, legacyAssets, accounts, deposits, creditCards, creditFacilities, registry });
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
