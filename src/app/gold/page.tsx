import { tr } from '@/i18n';
import { getModuleData } from '@/lib/moduleData';
import { ModulePageHeader } from '@/components/markets/ModulePageHeader';
import { WorkspaceAllocationChart } from '@/components/workspace/WorkspaceAllocationChart';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';
import { ArchivedSection } from '@/components/holdings/ArchivedSection';
import { ExistingGoldForm } from '@/components/workspace/ExistingGoldForm';
import { getAppSetting } from '@/lib/settings';
import { Card } from '@/components/ui/Card';
import { formatValue } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function GoldPage() {
  const { classAssets, investmentNW, totalNW, classValue, classValueUsd, archivedClassAssets, usdVndRate } =
    await getModuleData('gold');
  const openingDate = await getAppSetting('wealth_tracking_start_date') ?? new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <ModulePageHeader
        assetClass="gold"
        addHref="/gold/new"
        addLabel="+ Add existing gold"
        currency="VND"
        totalValue={classValue}
        count={classAssets.length}
        investmentNW={investmentNW}
        totalNW={totalNW}
        classValueUsd={classValueUsd}
      />
      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-8">
        <ExistingGoldForm openingDate={openingDate} />
        {classAssets.length > 0 && <Card className="p-5"><h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{tr('Physical gold details')}</h2><div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">{classAssets.map((asset) => <div key={asset.id} className="rounded-lg border border-[#26262B] bg-[#101014] p-4"><p className="text-sm font-medium text-zinc-100">{asset.name}</p><p className="mt-1 text-xs text-zinc-500">{[asset.gold_purity, asset.gold_form ? tr(asset.gold_form) : null].filter(Boolean).join(' · ')}</p><p className="mt-2 text-xs text-zinc-400">{asset.gold_item_count == null ? '' : `${asset.gold_item_count} ${tr('items')} · `}{asset.gold_weight == null ? '—' : `${new Intl.NumberFormat('vi-VN').format(asset.gold_weight)} ${asset.gold_weight_unit ?? ''}`}</p><p className="mt-1 text-xs text-zinc-500">{tr('Storage')}: {tr(asset.storage_location ?? '—')} · {tr('Ownership')}: {asset.ownership_label ?? '—'}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs"><span className="text-zinc-400">{tr('Current estimated value')}: {formatValue(asset.current_value, asset.currency)}</span><span className="text-zinc-500">{tr('Cost basis')}: {asset.cost_basis_known && asset.cost_basis != null ? formatValue(asset.cost_basis, asset.currency) : tr('Unknown cost basis')}</span><span className={asset.cost_basis_known && asset.cost_basis != null ? asset.current_value >= asset.cost_basis ? 'text-emerald-400' : 'text-red-400' : 'text-zinc-500'}>{tr('Unrealized P&L')}: {asset.cost_basis_known && asset.cost_basis != null ? formatValue(asset.current_value - asset.cost_basis, asset.currency) : tr('Unknown cost basis')}</span></div></div>)}</div></Card>}
        <HoldingsTable assets={classAssets} totalNetWorth={totalNW} usdVndRate={usdVndRate} />
        <WorkspaceAllocationChart
          assets={classAssets}
          usdVndRate={usdVndRate}
          label={tr("Gold Allocation")}
        />
        <ArchivedSection assets={archivedClassAssets} label={tr("Archived Gold")} usdVndRate={usdVndRate} />
      </main>
    </div>
  );
}
