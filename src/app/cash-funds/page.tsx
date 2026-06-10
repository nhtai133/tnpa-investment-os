import { db } from '@/db';
import { assets } from '@/db/schema';
import { asc, eq, and, or } from 'drizzle-orm';
import { computeInvestmentNetWorth, computeTotalNetWorth } from '@/lib/calculations';
import { normalizeToUsd } from '@/lib/fx';
import { getUsdVndRate } from '@/lib/settings';
import { ModulePageHeader } from '@/components/markets/ModulePageHeader';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';
import { ArchivedSection } from '@/components/holdings/ArchivedSection';

export const dynamic = 'force-dynamic';

export default async function CashFundsPage() {
  const [allAssets, archivedClassAssets, usdVndRate] = await Promise.all([
    db.select().from(assets).where(eq(assets.is_archived, false)).orderBy(asc(assets.name)),
    db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.is_archived, true),
          or(eq(assets.asset_class, 'cash'), eq(assets.asset_class, 'funds')),
        ),
      )
      .orderBy(asc(assets.name)),
    getUsdVndRate(),
  ]);

  const classAssets = allAssets.filter(
    (a) => a.asset_class === 'cash' || a.asset_class === 'funds',
  );
  const investmentNW = computeInvestmentNetWorth(allAssets, usdVndRate);
  const totalNW = computeTotalNetWorth(allAssets, usdVndRate);
  const classValue = classAssets.reduce((s, a) => s + a.current_value, 0);
  const classValueUsd = classAssets.reduce(
    (s, a) => s + normalizeToUsd(a.current_value, a.currency, usdVndRate),
    0,
  );

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <ModulePageHeader
        assetClass="cash"
        title="Cash & Funds"
        totalValue={classValue}
        count={classAssets.length}
        investmentNW={investmentNW}
        totalNW={totalNW}
        classValueUsd={classValueUsd}
      />
      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-8">
        <HoldingsTable assets={classAssets} totalNetWorth={totalNW} usdVndRate={usdVndRate} />
        <ArchivedSection assets={archivedClassAssets} label="Archived Cash & Funds" usdVndRate={usdVndRate} />
      </main>
    </div>
  );
}
