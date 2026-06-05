import { getModuleData } from '@/lib/moduleData';
import { ModulePageHeader } from '@/components/markets/ModulePageHeader';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';

export const dynamic = 'force-dynamic';

export default async function CryptoPage() {
  const { classAssets, investmentNW, totalNW, classValue } = await getModuleData('crypto');

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <ModulePageHeader
        assetClass="crypto"
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
