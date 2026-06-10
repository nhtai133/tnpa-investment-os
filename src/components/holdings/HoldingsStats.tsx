import { Card } from '@/components/ui/Card';
import { formatCurrency, formatWeight } from '@/lib/formatters';

interface HoldingsStatsProps {
  totalCount: number;
  filteredCount: number;
  filteredValue: number;
  investmentNetWorth: number;
  totalNetWorth: number;
  isMixedCurrency?: boolean;
}

export function HoldingsStats({
  totalCount,
  filteredCount,
  filteredValue,
  investmentNetWorth,
  totalNetWorth,
  isMixedCurrency = false,
}: HoldingsStatsProps) {
  const isFiltered = filteredCount < totalCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-5">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">
          {isFiltered ? 'Filtered Holdings' : 'Total Holdings'}
        </p>
        <p className="text-3xl font-light text-zinc-50 tracking-tight">
          {filteredCount}
          {isFiltered && (
            <span className="text-base text-zinc-600 ml-2">of {totalCount}</span>
          )}
        </p>
        {isFiltered && (
          <p className="mt-1.5 text-sm text-zinc-400 tabular-nums">
            {formatCurrency(filteredValue)}
            {!isMixedCurrency && (
              <span className="text-zinc-600 ml-1.5">
                ({formatWeight((filteredValue / totalNetWorth) * 100)} of portfolio)
              </span>
            )}
          </p>
        )}
      </Card>

      <Card className="p-5">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">
          Investment Net Worth
        </p>
        <p className="text-3xl font-light text-zinc-50 tracking-tight">
          {formatCurrency(investmentNetWorth)}
        </p>
        {isMixedCurrency ? (
          <p className="mt-1.5 text-[10px] text-amber-500/80">Mixed currencies · sum not comparable</p>
        ) : (
          <p className="mt-1.5 text-xs text-zinc-600">Stock · Crypto · Real Estate · Gold · Cash · Funds · Loan</p>
        )}
      </Card>

      <Card className="p-5">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">
          Total Net Worth
        </p>
        <p className="text-3xl font-light text-zinc-50 tracking-tight">
          {formatCurrency(totalNetWorth)}
        </p>
        {isMixedCurrency ? (
          <p className="mt-1.5 text-[10px] text-amber-500/80">Mixed currencies · sum not comparable</p>
        ) : (
          <p className="mt-1.5 text-xs text-zinc-600">
            +{formatCurrency(totalNetWorth - investmentNetWorth)} illiquid
          </p>
        )}
      </Card>
    </div>
  );
}
