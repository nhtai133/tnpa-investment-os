import { Card } from '@/components/ui/Card';
import { formatCurrency, formatPercent } from '@/lib/formatters';

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
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Total Net Worth</p>
        <p className="text-2xl font-light text-zinc-50 tracking-tight mt-2">{formatCurrency(totalNetWorth)}</p>
        <p className="text-[11px] text-zinc-600 mt-1.5">Complete balance sheet</p>
      </Card>

      <Card className="p-5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Investable</p>
        <p className="text-2xl font-light text-zinc-50 tracking-tight mt-2">{formatCurrency(investableNetWorth)}</p>
        <p className="text-[11px] text-zinc-600 mt-1.5">Allocatable capital</p>
      </Card>

      <Card className="p-5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Total Gain / Loss</p>
        {totalGainLoss != null ? (
          <>
            <p className={`text-2xl font-light tracking-tight mt-2 ${totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
            </p>
            <p className={`text-[11px] mt-1.5 ${gainLossPct != null && gainLossPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {gainLossPct != null ? `${formatPercent(gainLossPct)} vs cost basis` : ''}
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl font-light text-zinc-600 tracking-tight mt-2">—</p>
            <p className="text-[11px] text-zinc-700 mt-1.5">No cost basis data</p>
          </>
        )}
      </Card>

      <Card className="p-5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Monthly Growth</p>
        <p className="text-2xl font-light text-zinc-600 tracking-tight mt-2">—</p>
        <p className="text-[11px] text-zinc-700 mt-1.5">
          FX: {usdVndRate.toLocaleString('en-US')} VND/USD
        </p>
      </Card>
    </div>
  );
}
