import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/formatters';

interface NetWorthCardsProps {
  investmentNetWorth: number;
  totalNetWorth: number;
  investableRatio: number;
  isMixedCurrency?: boolean;
}

export function NetWorthCards({
  investmentNetWorth,
  totalNetWorth,
  investableRatio,
  isMixedCurrency = false,
}: NetWorthCardsProps) {
  const nonInvestable = totalNetWorth - investmentNetWorth;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Investment Net Worth */}
      <Card className="p-6">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">
          Investment Net Worth
        </p>
        <p className="text-3xl font-light text-zinc-50 tracking-tight">
          {formatCurrency(investmentNetWorth)}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Actively allocatable capital
        </p>
        <div className="mt-4 pt-4 border-t border-[#26262B]">
          {isMixedCurrency ? (
            <p className="text-[10px] text-amber-500/80">Mixed currencies · sum not comparable</p>
          ) : (
            <p className="text-[11px] text-zinc-600">Stock · Crypto · Cash · Funds · Private Loan</p>
          )}
        </div>
      </Card>

      {/* Total Net Worth */}
      <Card className="p-6">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">
          Total Net Worth
        </p>
        <p className="text-3xl font-light text-zinc-50 tracking-tight">
          {formatCurrency(totalNetWorth)}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Complete wealth balance sheet
        </p>
        <div className="mt-4 pt-4 border-t border-[#26262B]">
          {isMixedCurrency ? (
            <p className="text-[10px] text-amber-500/80">Mixed currencies · sum not comparable</p>
          ) : (
            <p className="text-[11px] text-zinc-600">
              +{formatCurrency(nonInvestable)} illiquid assets
            </p>
          )}
        </div>
      </Card>

      {/* Investable Assets Ratio */}
      <Card className="p-6">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">
          Investable Assets Ratio
        </p>
        {isMixedCurrency ? (
          <>
            <p className="text-3xl font-light text-zinc-600 tracking-tight">—</p>
            <p className="mt-2 text-[10px] text-amber-500/80 leading-relaxed">
              Multi-currency normalization pending
            </p>
          </>
        ) : (
          <>
            <p className="text-3xl font-light text-zinc-50 tracking-tight">
              {(investableRatio * 100).toFixed(1)}%
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              of total wealth is actively allocatable
            </p>
            <div className="mt-4 pt-4 border-t border-[#26262B]">
              <div className="w-full h-1.5 bg-[#26262B] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-400"
                  style={{ width: `${investableRatio * 100}%` }}
                />
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
