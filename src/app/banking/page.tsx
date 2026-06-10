import { getModuleData } from '@/lib/moduleData';
import { ModulePageHeader } from '@/components/markets/ModulePageHeader';
import { WorkspaceAllocationChart } from '@/components/workspace/WorkspaceAllocationChart';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';
import { ArchivedSection } from '@/components/holdings/ArchivedSection';

export const dynamic = 'force-dynamic';

export default async function BankingPage() {
  const { classAssets, investmentNW, totalNW, classValue, classValueUsd, archivedClassAssets, usdVndRate } =
    await getModuleData('cash');

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <ModulePageHeader
        assetClass="cash"
        title="Banking"
        addHref="/banking/new"
        addLabel="+ Add Bank Asset"
        currency="VND"
        totalValue={classValue}
        count={classAssets.length}
        investmentNW={investmentNW}
        totalNW={totalNW}
        classValueUsd={classValueUsd}
      />
      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-8">
        <HoldingsTable assets={classAssets} totalNetWorth={totalNW} usdVndRate={usdVndRate} />
        <WorkspaceAllocationChart
          assets={classAssets}
          usdVndRate={usdVndRate}
          label="Banking Allocation"
        />
        <ArchivedSection assets={archivedClassAssets} label="Archived Bank Accounts" usdVndRate={usdVndRate} />
      </main>
    </div>
  );
}
