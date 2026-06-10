import { db } from '@/db';
import { assets } from '@/db/schema';
import { asc, eq, and } from 'drizzle-orm';
import type { AssetClass } from '@/db/schema';
import { computeInvestmentNetWorth, computeTotalNetWorth } from '@/lib/calculations';
import { normalizeToUsd } from '@/lib/fx';
import { getUsdVndRate } from '@/lib/settings';

export async function getModuleData(assetClass: AssetClass) {
  const [allAssets, archivedClassAssets, usdVndRate] = await Promise.all([
    db.select().from(assets).where(eq(assets.is_archived, false)).orderBy(asc(assets.name)),
    db
      .select()
      .from(assets)
      .where(and(eq(assets.is_archived, true), eq(assets.asset_class, assetClass)))
      .orderBy(asc(assets.name)),
    getUsdVndRate(),
  ]);
  const classAssets = allAssets.filter((a) => a.asset_class === assetClass);
  const investmentNW = computeInvestmentNetWorth(allAssets, usdVndRate);
  const totalNW = computeTotalNetWorth(allAssets, usdVndRate);
  const classValue = classAssets.reduce((s, a) => s + a.current_value, 0);
  const classValueUsd = classAssets.reduce(
    (s, a) => s + normalizeToUsd(a.current_value, a.currency, usdVndRate),
    0,
  );
  return { classAssets, allAssets, investmentNW, totalNW, classValue, classValueUsd, archivedClassAssets, usdVndRate };
}
