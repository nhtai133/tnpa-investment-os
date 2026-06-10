import Link from 'next/link';
import { Card, Badge } from '@/components/ui/Card';
import {
  formatCurrency,
  formatWeight,
  ASSET_CLASS_LABELS,
  ASSET_CLASS_COLORS,
} from '@/lib/formatters';
import type { AssetClass } from '@/db/schema';

interface ModulePageHeaderProps {
  assetClass: AssetClass;
  title?: string;
  totalValue: number;
  count: number;
  investmentNW: number;
  totalNW: number;
  isMixedCurrency?: boolean;
  classValueUsd?: number;
}

export function ModulePageHeader({
  assetClass,
  title,
  totalValue,
  count,
  investmentNW,
  totalNW,
  isMixedCurrency = false,
  classValueUsd,
}: ModulePageHeaderProps) {
  const allocValue = classValueUsd ?? totalValue;
  const inwPct = investmentNW > 0 ? (allocValue / investmentNW) * 100 : 0;
  const tnwPct = totalNW > 0 ? (allocValue / totalNW) * 100 : 0;
  const showAllocation = classValueUsd != null || !isMixedCurrency;

  return (
    <>
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">
                Markets
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-base font-semibold text-zinc-100 leading-tight">
                  {title ?? ASSET_CLASS_LABELS[assetClass]}
                </h1>
                <Badge
                  label={title ?? ASSET_CLASS_LABELS[assetClass]}
                  color={ASSET_CLASS_COLORS[assetClass]}
                />
              </div>
            </div>
          </div>
          <Link
            href="/holdings/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Asset
          </Link>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">
              Total Value
            </p>
            <p className="text-3xl font-light text-zinc-50 tracking-tight tabular-nums">
              {formatCurrency(totalValue)}
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
      </div>
    </>
  );
}
