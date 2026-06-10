import { getModuleData } from '@/lib/moduleData';
import { hasMultipleCurrencies } from '@/lib/calculations';
import { ModulePageHeader } from '@/components/markets/ModulePageHeader';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';

export const dynamic = 'force-dynamic';

export default async function RealEstatePage() {
  const { classAssets, allAssets, investmentNW, totalNW, classValue } = await getModuleData('real_estate');
  const isMixedCurrency = hasMultipleCurrencies(allAssets);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <ModulePageHeader
        assetClass="real_estate"
        totalValue={classValue}
        count={classAssets.length}
        investmentNW={investmentNW}
        totalNW={totalNW}
        isMixedCurrency={isMixedCurrency}
      />
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <HoldingsTable assets={classAssets} totalNetWorth={totalNW} />
      </main>
    </div>
  );
}
