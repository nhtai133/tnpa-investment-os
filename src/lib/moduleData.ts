import { db } from '@/db';
import { assets } from '@/db/schema';
import { asc, eq, and } from 'drizzle-orm';
import type { AssetClass } from '@/db/schema';
import { normalizeToUsd } from '@/lib/fx';
import { getPortfolioSummary, positionToAsset } from '@/lib/portfolio-aggregation';

export async function getModuleData(assetClass: AssetClass) {
  const [portfolio, archivedClassAssets] = await Promise.all([
    getPortfolioSummary(),
    db
      .select()
      .from(assets)
      .where(and(eq(assets.is_archived, true), eq(assets.asset_class, assetClass)))
      .orderBy(asc(assets.name)),
  ]);
  const usdVndRate = portfolio.usdVndRate;
  const allAssets = portfolio.positions.map(positionToAsset);
  const classAssets = allAssets.filter((a) => a.asset_class === assetClass);
  const investmentNW = portfolio.investmentNetWorth;
  const totalNW = portfolio.totalNetWorth;
  const classValue = classAssets.reduce((s, a) => s + a.current_value, 0);
  const classValueUsd = classAssets.reduce(
    (s, a) => s + normalizeToUsd(a.current_value, a.currency, usdVndRate),
    0,
  );
  return { classAssets, allAssets, investmentNW, totalNW, classValue, classValueUsd, archivedClassAssets, usdVndRate, creditLiabilityUsd: portfolio.liabilityValueUsd };
}
