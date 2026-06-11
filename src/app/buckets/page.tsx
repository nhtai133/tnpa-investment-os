import Link from 'next/link';
import { db } from '@/db';
import { assets } from '@/db/schema';
import { ASSET_PURPOSES } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card } from '@/components/ui/Card';
import { getUsdVndRate } from '@/lib/settings';
import { normalizeToUsd, getNormalizedCostBasisUsd } from '@/lib/fx';
import { PURPOSE_LABELS, PURPOSE_COLORS, formatCurrency, formatPercent, formatWeight } from '@/lib/formatters';
import type { AssetPurpose } from '@/db/schema';

export const dynamic = 'force-dynamic';

interface BucketStat {
  purpose: AssetPurpose;
  value: number;
  costBasis: number;
  gainLoss: number;
  returnPct: number | null;
  weight: number;
  count: number;
}

export default async function BucketsPage() {
  const [allAssets, usdVndRate] = await Promise.all([
    db.select().from(assets).where(eq(assets.is_archived, false)),
    getUsdVndRate(),
  ]);

  const totalValue = allAssets.reduce(
    (sum, a) => sum + normalizeToUsd(a.current_value, a.currency, usdVndRate),
    0,
  );

  const stats: BucketStat[] = ASSET_PURPOSES.map((purpose) => {
    const bucket = allAssets.filter((a) => a.purpose === purpose);
    const value = bucket.reduce(
      (sum, a) => sum + normalizeToUsd(a.current_value, a.currency, usdVndRate),
      0,
    );
    const costBasis = bucket.reduce(
      (sum, a) => sum + getNormalizedCostBasisUsd(a, usdVndRate),
      0,
    );
    const gainLoss = value - costBasis;
    const returnPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : null;
    const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
    return { purpose, value, costBasis, gainLoss, returnPct, weight, count: bucket.length };
  });

  const activeBuckets = stats.filter((s) => s.count > 0);
  const emptyBuckets = stats.filter((s) => s.count === 0);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">Portfolio</p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              Portfolio Buckets
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-600">
              {activeBuckets.length} active buckets · {allAssets.length} assets
            </span>
            <Link
              href="/holdings/new"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Add Asset
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">

        {/* What is a bucket */}
        <p className="text-[11px] text-zinc-700 px-1">
          Asset Class answers <span className="text-zinc-500">what it is</span>. Bucket answers <span className="text-zinc-500">why you own it</span>.
        </p>

        {/* Active buckets grid */}
        {activeBuckets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeBuckets.map((s) => {
              const color = PURPOSE_COLORS[s.purpose];
              const isPositive = s.gainLoss >= 0;
              return (
                <Link key={s.purpose} href={`/buckets/${s.purpose}`}>
                  <Card className="p-5 hover:border-zinc-600 transition-colors cursor-pointer h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm font-semibold text-zinc-100">
                          {PURPOSE_LABELS[s.purpose]}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-600">
                        {s.count} asset{s.count !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Value */}
                    <p className="text-xl font-bold tabular-nums text-zinc-100 mb-1">
                      {formatCurrency(s.value)}
                    </p>
                    <p className="text-[11px] text-zinc-600 mb-4">
                      {formatWeight(s.weight)} of portfolio
                    </p>

                    {/* P&L row */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#26262B]">
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">Cost Basis</p>
                        <p className="text-xs text-zinc-400 tabular-nums">
                          {s.costBasis > 0 ? formatCurrency(s.costBasis) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">Gain / Loss</p>
                        {s.costBasis > 0 ? (
                          <p className={`text-xs tabular-nums font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(s.gainLoss)}
                            {s.returnPct !== null && (
                              <span className="ml-1 text-[10px]">({formatPercent(s.returnPct)})</span>
                            )}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-600">—</p>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty buckets */}
        {emptyBuckets.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-700 mb-2 px-1">
              Unused Buckets
            </p>
            <Card>
              <div className="divide-y divide-[#1A1A1F]">
                {emptyBuckets.map((s) => (
                  <Link
                    key={s.purpose}
                    href={`/buckets/${s.purpose}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-[#1C1C21] transition-colors"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-40"
                      style={{ backgroundColor: PURPOSE_COLORS[s.purpose] }}
                    />
                    <span className="text-sm text-zinc-600 flex-1">{PURPOSE_LABELS[s.purpose]}</span>
                    <span className="text-[11px] text-zinc-700">0 assets</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Summary table */}
        {activeBuckets.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-700 mb-2 px-1">
              Summary
            </p>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#26262B]">
                      {['Bucket', 'Assets', 'Value', 'Cost Basis', 'Gain / Loss', 'Return', 'Allocation'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-zinc-600">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeBuckets.sort((a, b) => b.value - a.value).map((s) => {
                      const color = PURPOSE_COLORS[s.purpose];
                      const isPositive = s.gainLoss >= 0;
                      return (
                        <tr key={s.purpose} className="border-b border-[#1A1A1F] last:border-0 hover:bg-[#1C1C21] transition-colors">
                          <td className="px-5 py-3">
                            <Link href={`/buckets/${s.purpose}`} className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-zinc-300">{PURPOSE_LABELS[s.purpose]}</span>
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-zinc-500 tabular-nums">{s.count}</td>
                          <td className="px-5 py-3 text-zinc-300 tabular-nums font-medium">{formatCurrency(s.value)}</td>
                          <td className="px-5 py-3 text-zinc-500 tabular-nums">{s.costBasis > 0 ? formatCurrency(s.costBasis) : '—'}</td>
                          <td className={`px-5 py-3 tabular-nums font-medium ${s.costBasis > 0 ? (isPositive ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}`}>
                            {s.costBasis > 0 ? formatCurrency(s.gainLoss) : '—'}
                          </td>
                          <td className={`px-5 py-3 tabular-nums ${s.returnPct !== null ? (isPositive ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}`}>
                            {s.returnPct !== null ? formatPercent(s.returnPct) : '—'}
                          </td>
                          <td className="px-5 py-3 text-zinc-500 tabular-nums">{formatWeight(s.weight)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}
