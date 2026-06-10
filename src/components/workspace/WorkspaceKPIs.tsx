import { Card } from '@/components/ui/Card';
import { formatValue, formatWeight } from '@/lib/formatters';

interface WorkspaceKPIsProps {
  totalValue: number;
  count: number;
  investmentNetWorth: number;
  totalNetWorth: number;
  currency?: string;
  isMixedCurrency?: boolean;
  classValueUsd?: number;
}

export function WorkspaceKPIs({
  totalValue,
  count,
  investmentNetWorth,
  totalNetWorth,
  currency = 'USD',
  isMixedCurrency = false,
  classValueUsd,
}: WorkspaceKPIsProps) {
  const allocValue = classValueUsd ?? totalValue;
  const inwPct = investmentNetWorth > 0 ? (allocValue / investmentNetWorth) * 100 : 0;
  const tnwPct = totalNetWorth > 0 ? (allocValue / totalNetWorth) * 100 : 0;
  const showAllocation = classValueUsd != null || !isMixedCurrency;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-5">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">
          Total Value
        </p>
        <p className="text-3xl font-light text-zinc-50 tracking-tight tabular-nums">
          {formatValue(totalValue, currency)}
        </p>
      </Card>

      <Card className="p-5">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">
          Holdings
        </p>
        <p className="text-3xl font-light text-zinc-50 tracking-tight tabular-nums">
          {count}
        </p>
        <p className="mt-1.5 text-xs text-zinc-600">
          {count === 1 ? 'position' : 'positions'}
        </p>
      </Card>

      <Card className="p-5">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">
          Allocation
        </p>
        {showAllocation ? (
          <>
            <p className="text-3xl font-light text-zinc-50 tracking-tight tabular-nums">
              {formatWeight(inwPct)}
            </p>
            <p className="mt-1.5 text-xs text-zinc-600">of Investment Net Worth</p>
            <p className="mt-0.5 text-xs text-zinc-700 tabular-nums">
              {formatWeight(tnwPct)} of Total Net Worth
            </p>
          </>
        ) : (
          <>
            <p className="text-3xl font-light text-zinc-600 tracking-tight">—</p>
            <p className="mt-1.5 text-[10px] text-amber-500/80 leading-relaxed">
              Multi-currency normalization pending
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
