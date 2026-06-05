import { db } from '@/db';
import { assets } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { computeInvestmentNetWorth, computeTotalNetWorth } from '@/lib/calculations';
import { ModulePageHeader } from '@/components/markets/ModulePageHeader';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';

export const dynamic = 'force-dynamic';

export default async function CashFundsPage() {
  const allAssets = await db.select().from(assets).orderBy(asc(assets.name));
  const classAssets = allAssets.filter(
    (a) => a.asset_class === 'cash' || a.asset_class === 'funds',
  );
  const investmentNW = computeInvestmentNetWorth(allAssets);
  const totalNW = computeTotalNetWorth(allAssets);
  const classValue = classAssets.reduce((s, a) => s + a.current_value, 0);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <ModulePageHeader
        assetClass="cash"
        title="Cash & Funds"
        totalValue={classValue}
        count={classAssets.length}
        investmentNW={investmentNW}
        totalNW={totalNW}
      />
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <HoldingsTable assets={classAssets} totalNetWorth={totalNW} />
      </main>
    </div>
  );
}
