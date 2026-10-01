import { tr } from '@/i18n';
import { getModuleData } from '@/lib/moduleData';
import { ModulePageHeader } from '@/components/markets/ModulePageHeader';
import { WorkspaceAllocationChart } from '@/components/workspace/WorkspaceAllocationChart';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';
import { ArchivedSection } from '@/components/holdings/ArchivedSection';
import { ExistingLandForm } from '@/components/workspace/ExistingLandForm';
import { getAppSetting } from '@/lib/settings';
import { Card } from '@/components/ui/Card';
import { formatValue } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function RealEstatePage() {
  const { classAssets, investmentNW, totalNW, classValue, classValueUsd, archivedClassAssets, usdVndRate } =
    await getModuleData('real_estate');
  const openingDate = await getAppSetting('wealth_tracking_start_date') ?? new Date().toISOString().slice(0, 10);
  const attributedAssets = classAssets.map((asset) => {
    const share = (asset.ownership_percentage ?? 100) / 100;
    return { ...asset, current_value: asset.current_value * share, cost_basis: asset.cost_basis == null ? null : asset.cost_basis * share };
  });

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <ModulePageHeader
        assetClass="real_estate"
        addHref="/real-estate/new"
        addLabel="+ Add existing property"
        currency="VND"
        totalValue={classValue}
        count={classAssets.length}
        investmentNW={investmentNW}
        totalNW={totalNW}
        classValueUsd={classValueUsd}
      />
      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-8">
        <ExistingLandForm openingDate={openingDate} />
        {classAssets.length > 0 && <Card className="p-5"><h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{tr('Land details')}</h2><div className="mt-3 grid grid-cols-1 gap-3">{classAssets.map((asset) => { const share = (asset.ownership_percentage ?? 100) / 100; const attributableValue = asset.current_value * share; const attributableBasis = asset.cost_basis == null ? null : asset.cost_basis * share; const gain = asset.cost_basis_known && attributableBasis != null ? attributableValue - attributableBasis : null; return <div key={asset.id} className="rounded-lg border border-[#26262B] bg-[#101014] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-medium text-zinc-100">{asset.name}</p><p className="mt-1 text-xs text-zinc-500">{tr(asset.property_type ?? 'land')} · {asset.property_location ?? '—'} · {tr(asset.property_legal_status ?? '—')}</p><p className="mt-1 text-xs text-zinc-500">{asset.property_area_sqm ?? '—'} m² · {asset.property_width_m ?? '—'} m × {asset.property_length_m ?? '—'} m · {asset.ownership_percentage ?? 100}% {tr('ownership')}</p></div><div className="text-right text-xs"><p className="text-zinc-300">{tr('Whole-property estimated value')}: {formatValue(asset.current_value, asset.currency)}</p><p className="mt-1 font-medium text-zinc-100">{tr('Household attributable value')}: {formatValue(attributableValue, asset.currency)}</p></div></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs"><span className="text-zinc-500">{tr('Whole-property cost basis')}: {asset.cost_basis_known && asset.cost_basis != null ? formatValue(asset.cost_basis, asset.currency) : tr('Unknown cost basis')}</span><span className="text-zinc-500">{tr('Attributable cost basis')}: {asset.cost_basis_known && attributableBasis != null ? formatValue(attributableBasis, asset.currency) : tr('Unknown cost basis')}</span><span className={gain == null ? 'text-zinc-500' : gain >= 0 ? 'text-emerald-400' : 'text-red-400'}>{tr('Unrealized P&L')}: {gain == null ? tr('Unknown cost basis') : formatValue(gain, asset.currency)}</span><span className="text-zinc-500">{tr('Purchase price')}: {asset.purchase_price == null ? '—' : formatValue(asset.purchase_price, asset.currency)} · {tr('Acquisition costs')}: {formatValue(asset.acquisition_costs ?? 0, asset.currency)}</span></div>{asset.notes && <p className="mt-2 text-xs text-zinc-600">{asset.notes}</p>}</div>; })}</div></Card>}
        <HoldingsTable assets={attributedAssets} totalNetWorth={totalNW} usdVndRate={usdVndRate} />
        <WorkspaceAllocationChart
          assets={classAssets}
          usdVndRate={usdVndRate}
          label={tr("Real Estate Allocation")}
        />
        <ArchivedSection assets={archivedClassAssets} label={tr("Archived Real Estate")} usdVndRate={usdVndRate} />
      </main>
    </div>
  );
}
