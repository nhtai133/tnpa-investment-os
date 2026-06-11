import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUsdVndRate, getAppSetting } from '@/lib/settings';
import {
  REBALANCING_CLASSES,
  REBALANCING_SETTINGS_KEYS,
  DEFAULT_TARGETS,
  computeRebalancing,
  PURPOSE_REBALANCING_PURPOSES,
  PURPOSE_REBALANCING_SETTINGS_KEYS,
  DEFAULT_PURPOSE_TARGETS,
  computePurposeRebalancing,
  type RebalancingAssetClass,
  type RebalancingPurpose,
} from '@/lib/rebalancing';
import { RebalancingClient } from '@/components/rebalancing/RebalancingClient';

export const dynamic = 'force-dynamic';

export default async function RebalancingPage() {
  const [allAssets, usdVndRate] = await Promise.all([
    db.select().from(assets).where(eq(assets.is_archived, false)),
    getUsdVndRate(),
  ]);

  // Asset class targets
  const classTargets: Record<RebalancingAssetClass, number> = { ...DEFAULT_TARGETS };
  await Promise.all(
    REBALANCING_CLASSES.map(async (cls) => {
      const val = await getAppSetting(REBALANCING_SETTINGS_KEYS[cls]);
      if (val) {
        const parsed = parseFloat(val);
        if (Number.isFinite(parsed)) classTargets[cls] = parsed;
      }
    }),
  );

  // Purpose targets
  const purposeTargets: Record<RebalancingPurpose, number> = { ...DEFAULT_PURPOSE_TARGETS };
  await Promise.all(
    PURPOSE_REBALANCING_PURPOSES.map(async (p) => {
      const val = await getAppSetting(PURPOSE_REBALANCING_SETTINGS_KEYS[p]);
      if (val) {
        const parsed = parseFloat(val);
        if (Number.isFinite(parsed)) purposeTargets[p] = parsed;
      }
    }),
  );

  const rebalancing = computeRebalancing(allAssets, classTargets, usdVndRate);
  const purposeRebalancing = computePurposeRebalancing(allAssets, purposeTargets, usdVndRate);

  return (
    <RebalancingClient
      rebalancing={rebalancing}
      targets={classTargets}
      purposeRebalancing={purposeRebalancing}
      purposeTargets={purposeTargets}
    />
  );
}
