import { getAppSetting } from '@/lib/settings';
import {
  REBALANCING_CLASSES,
  REBALANCING_SETTINGS_KEYS,
  DEFAULT_TARGETS,
  computeRebalancing,
  type RebalancingAssetClass,
} from '@/lib/rebalancing';
import { RebalancingClient } from '@/components/rebalancing/RebalancingClient';
import { getPortfolioSummary, positionToAsset } from '@/lib/portfolio-aggregation';

export const dynamic = 'force-dynamic';

export default async function RebalancingPage() {
  const portfolio = await getPortfolioSummary();
  const allAssets = portfolio.positions.map(positionToAsset);
  const usdVndRate = portfolio.usdVndRate;

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

  const rebalancing = computeRebalancing(allAssets, classTargets, usdVndRate);


  return (
    <RebalancingClient
      rebalancing={rebalancing}
      targets={classTargets}
    />
  );
}
