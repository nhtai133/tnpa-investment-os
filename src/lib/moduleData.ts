import { db } from '@/db';
import { assets } from '@/db/schema';
import { asc } from 'drizzle-orm';
import type { AssetClass } from '@/db/schema';
import { computeInvestmentNetWorth, computeTotalNetWorth } from '@/lib/calculations';

export async function getModuleData(assetClass: AssetClass) {
  const allAssets = await db.select().from(assets).orderBy(asc(assets.name));
  const classAssets = allAssets.filter((a) => a.asset_class === assetClass);
  const investmentNW = computeInvestmentNetWorth(allAssets);
  const totalNW = computeTotalNetWorth(allAssets);
  const classValue = classAssets.reduce((s, a) => s + a.current_value, 0);
  return { classAssets, allAssets, investmentNW, totalNW, classValue };
}
