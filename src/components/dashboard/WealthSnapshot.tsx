import { tr } from '@/i18n';
import { Card } from '@/components/ui/Card';
import { formatValue, formatPercent } from '@/lib/formatters';

interface WealthSnapshotProps {
  totalNetWorth: number;
  investableNetWorth: number;
  totalGainLoss: number | null;
  gainLossPct: number | null;
  usdVndRate: number;
}

export function WealthSnapshot({
  totalNetWorth,
  investableNetWorth,
  totalGainLoss,
  gainLossPct,
  usdVndRate,
}: WealthSnapshotProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">{tr("Total Net Worth")}</p>
        <p className="text-2xl font-light text-zinc-50 tracking-tight mt-2">{formatValue(totalNetWorth, 'VND')}</p>
        <p className="text-[11px] text-zinc-600 mt-1.5">{tr("Complete balance sheet")}</p>
      </Card>

      <Card className="p-5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">{tr("Investable")}</p>
        <p className="text-2xl font-light text-zinc-50 tracking-tight mt-2">{formatValue(investableNetWorth, 'VND')}</p>
        <p className="text-[11px] text-zinc-600 mt-1.5">{tr("Allocatable capital")}</p>
      </Card>

      <Card className="p-5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">{tr("Total Gain / Loss")}</p>
        {totalGainLoss != null ? (
          <>
            <p className={`text-2xl font-light tracking-tight mt-2 ${totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalGainLoss >= 0 ? '+' : ''}{formatValue(totalGainLoss, 'VND')}
            </p>
            <p className={`text-[11px] mt-1.5 ${gainLossPct != null && gainLossPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {gainLossPct != null ? `${formatPercent(gainLossPct)} vs cost basis` : ''}
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl font-light text-zinc-600 tracking-tight mt-2">—</p>
            <p className="text-[11px] text-zinc-700 mt-1.5">{tr("No cost basis data")}</p>
          </>
        )}
      </Card>

      <Card className="p-5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">{tr("Monthly Growth")}</p>
        <p className="text-2xl font-light text-zinc-600 tracking-tight mt-2">—</p>
        <p className="text-[11px] text-zinc-700 mt-1.5">
          {'' + tr("FX:") + ' '}{usdVndRate.toLocaleString('vi-VN')} {tr("VND/USD")}</p>
      </Card>
    </div>
  );
}
