'use server';

import { db } from '@/db';
import { assets, appSettings, wealthSnapshots } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getUsdVndRate } from '@/lib/settings';
import {
  computeInvestmentNetWorth,
  computeTotalNetWorth,
  computeAssetClassBreakdown,
  computePurposeBreakdown,
} from '@/lib/calculations';
import { normalizeToUsd, getNormalizedCostBasisUsd } from '@/lib/fx';
import { getCreditLiabilityUsd } from '@/lib/banking';

function now() {
  return new Date().toISOString();
}

export async function createSnapshot(formData: FormData) {
  const notes = (formData.get('notes') as string | null)?.trim() || null;

  const [allAssets, allSettings] = await Promise.all([
    db.select().from(assets).where(eq(assets.is_archived, false)),
    db.select().from(appSettings),
  ]);

  const settingsMap = new Map(allSettings.map((s) => [s.key, s.value]));
  const storedRate = settingsMap.get('usd_vnd_rate');
  const usdVndRate = storedRate ? parseFloat(storedRate) : await getUsdVndRate();

  const creditLiabilityUsd = await getCreditLiabilityUsd(usdVndRate);
  const totalNW = computeTotalNetWorth(allAssets, usdVndRate, creditLiabilityUsd);
  const investableNW = computeInvestmentNetWorth(allAssets, usdVndRate);

  const assetsWithCostBasis = allAssets.filter((a) => a.cost_basis != null);
  const totalCostBasis = assetsWithCostBasis.reduce(
    (sum, a) => sum + getNormalizedCostBasisUsd(a, usdVndRate),
    0,
  );
  const totalCurrentOfCostBasisAssets = assetsWithCostBasis.reduce(
    (sum, a) => sum + normalizeToUsd(a.current_value, a.currency, usdVndRate),
    0,
  );
  const totalGainLoss = totalCostBasis > 0 ? totalCurrentOfCostBasisAssets - totalCostBasis : null;

  const assetAllocation = computeAssetClassBreakdown(allAssets, investableNW, usdVndRate);
  const purposeAllocation = computePurposeBreakdown(allAssets, totalNW, usdVndRate);

  const ts = now();
  const snapshotDate = ts.split('T')[0];

  await db.insert(wealthSnapshots).values({
    snapshot_date: snapshotDate,
    total_net_worth_usd: totalNW,
    investable_net_worth_usd: investableNW,
    total_cost_basis_usd: totalCostBasis > 0 ? totalCostBasis : null,
    total_gain_loss_usd: totalGainLoss,
    usd_vnd_rate: usdVndRate,
    asset_allocation_json: JSON.stringify(assetAllocation),
    purpose_allocation_json: JSON.stringify(purposeAllocation),
    notes,
    created_at: ts,
    updated_at: ts,
  });

  revalidatePath('/performance');
}

export async function deleteSnapshot(id: number) {
  await db.delete(wealthSnapshots).where(eq(wealthSnapshots.id, id));
  revalidatePath('/performance');
}
