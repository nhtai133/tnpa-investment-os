import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUsdVndRate, getAppSetting } from '@/lib/settings';
import {
  REBALANCING_CLASSES,
  REBALANCING_SETTINGS_KEYS,
  DEFAULT_TARGETS,
  computeRebalancing,
  type RebalancingAssetClass,
} from '@/lib/rebalancing';
import { RebalancingClient } from '@/components/rebalancing/RebalancingClient';

export const dynamic = 'force-dynamic';

export default async function RebalancingPage() {
  const [activeAssets, usdVndRate] = await Promise.all([
    db.select().from(assets).where(eq(assets.is_archived, false)),
    getUsdVndRate(),
  ]);

  const targets: Record<RebalancingAssetClass, number> = { ...DEFAULT_TARGETS };
  await Promise.all(
    REBALANCING_CLASSES.map(async (cls) => {
      const val = await getAppSetting(REBALANCING_SETTINGS_KEYS[cls]);
      if (val) {
        const parsed = parseFloat(val);
        if (Number.isFinite(parsed)) targets[cls] = parsed;
      }
    }),
  );

  const rebalancing = computeRebalancing(activeAssets, targets, usdVndRate);

  return <RebalancingClient rebalancing={rebalancing} targets={targets} />;
}
