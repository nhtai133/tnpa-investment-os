import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { assets, researchNotes, transactions } from '@/db/schema';
import { ASSET_PURPOSES } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Card } from '@/components/ui/Card';
import { getUsdVndRate } from '@/lib/settings';
import { normalizeToUsd, getNormalizedCostBasisUsd } from '@/lib/fx';
import {
  PURPOSE_LABELS,
  PURPOSE_COLORS,
  ASSET_CLASS_LABELS,
  ASSET_CLASS_COLORS,
  formatCurrency,
  formatPercent,
  formatWeight,
  formatValue,
  formatDate,
} from '@/lib/formatters';
import type { AssetPurpose } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function BucketDetailPage({
  params,
}: {
  params: { purpose: string };
}) {
  const purpose = params.purpose as AssetPurpose;
  if (!ASSET_PURPOSES.includes(purpose)) notFound();

  const [allAssets, usdVndRate] = await Promise.all([
    db.select().from(assets).where(eq(assets.is_archived, false)),
    getUsdVndRate(),
  ]);

  const archivedAssets = await db
    .select()
    .from(assets)
    .where(eq(assets.is_archived, true));

  const bucket = allAssets.filter((a) => a.purpose === purpose);
  const archivedBucket = archivedAssets.filter((a) => a.purpose === purpose);

  const totalPortfolio = allAssets.reduce(
    (sum, a) => sum + normalizeToUsd(a.current_value, a.currency, usdVndRate),
    0,
  );

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
  const weight = totalPortfolio > 0 ? (value / totalPortfolio) * 100 : 0;

  const color = PURPOSE_COLORS[purpose];
  const label = PURPOSE_LABELS[purpose];

  // Top research notes tagged to assets in this bucket
  const assetIds = bucket.map((a) => a.id);
  const relatedNotes = assetIds.length > 0
    ? await db.select().from(researchNotes)
        .orderBy(desc(researchNotes.created_at))
        .limit(50)
        .then((rows) => rows.filter((n) => n.asset_id && assetIds.includes(n.asset_id)).slice(0, 5))
    : [];

  // Recent transactions for assets in this bucket
  const relatedTxns = assetIds.length > 0
    ? await db.select().from(transactions)
        .orderBy(desc(transactions.transaction_date))
        .limit(100)
        .then((rows) => rows.filter((t) => t.asset_id && assetIds.includes(t.asset_id)).slice(0, 5))
    : [];

  const sortedBucket = [...bucket].sort(
    (a, b) =>
      normalizeToUsd(b.current_value, b.currency, usdVndRate) -
      normalizeToUsd(a.current_value, a.currency, usdVndRate),
  );

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-start justify-between">
          <div>
            <Link
              href="/buckets"
              className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← Buckets
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <h1 className="text-base font-semibold text-zinc-100 leading-tight">{label}</h1>
            </div>
          </div>
          <Link
            href="/holdings/new"
            className="mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Asset
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Total Value</p>
            <p className="text-xl font-bold tabular-nums text-zinc-100 mt-1.5">{formatCurrency(value)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Cost Basis</p>
            <p className="text-xl font-bold tabular-nums text-zinc-100 mt-1.5">
              {costBasis > 0 ? formatCurrency(costBasis) : '—'}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Gain / Loss</p>
            <p className={`text-xl font-bold tabular-nums mt-1.5 ${costBasis > 0 ? (gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}`}>
              {costBasis > 0 ? formatCurrency(gainLoss) : '—'}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Return</p>
            <div className="mt-1.5">
              <p className={`text-xl font-bold tabular-nums ${returnPct !== null ? (returnPct >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}`}>
                {returnPct !== null ? formatPercent(returnPct) : '—'}
              </p>
              <p className="text-[10px] text-zinc-700 mt-0.5">{formatWeight(weight)} of portfolio</p>
            </div>
          </Card>
        </div>

        {/* Retirement banner */}
        {purpose === 'retirement' && (
          <div className="rounded-lg border border-orange-900/40 bg-orange-950/20 px-4 py-3">
            <p className="text-xs font-semibold text-orange-400 mb-1">Retirement Bucket</p>
            <p className="text-[11px] text-orange-700 leading-relaxed">
              Assets tagged as Retirement are long-horizon positions. Treat withdrawals and
              archive actions with extra care.
            </p>
          </div>
        )}

        {/* Active assets */}
        <Card>
          <div className="px-5 pt-5 pb-4 border-b border-[#26262B] flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
              Assets · {bucket.length}
            </span>
          </div>
          {sortedBucket.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#26262B]">
                    {['Asset', 'Class', 'Value', 'Cost Basis', 'Gain / Loss', 'Return', 'Weight'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-zinc-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedBucket.map((asset) => {
                    const aValueUsd = normalizeToUsd(asset.current_value, asset.currency, usdVndRate);
                    const aCostUsd = getNormalizedCostBasisUsd(asset, usdVndRate);
                    const aGain = aValueUsd - aCostUsd;
                    const aReturn = aCostUsd > 0 ? (aGain / aCostUsd) * 100 : null;
                    const aWeight = value > 0 ? (aValueUsd / value) * 100 : 0;
                    const classColor = ASSET_CLASS_COLORS[asset.asset_class];
                    return (
                      <tr key={asset.id} className="border-b border-[#1A1A1F] last:border-0 hover:bg-[#1C1C21] transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/holdings/${asset.id}`} className="text-zinc-300 hover:text-indigo-400 transition-colors font-medium">
                            {asset.name}
                          </Link>
                          {asset.symbol && (
                            <span className="ml-1.5 text-zinc-600 font-mono">{asset.symbol}</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ color: classColor, backgroundColor: `${classColor}15` }}
                          >
                            {ASSET_CLASS_LABELS[asset.asset_class]}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-zinc-300 tabular-nums font-medium">{formatValue(asset.current_value, asset.currency)}</p>
                          {asset.currency !== 'USD' && (
                            <p className="text-zinc-600 tabular-nums text-[10px]">{formatCurrency(aValueUsd)}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-zinc-500 tabular-nums">
                          {asset.cost_basis != null ? formatValue(asset.cost_basis, asset.currency) : '—'}
                        </td>
                        <td className={`px-5 py-3 tabular-nums font-medium ${aCostUsd > 0 ? (aGain >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}`}>
                          {aCostUsd > 0 ? formatCurrency(aGain) : '—'}
                        </td>
                        <td className={`px-5 py-3 tabular-nums ${aReturn !== null ? (aReturn >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}`}>
                          {aReturn !== null ? formatPercent(aReturn) : '—'}
                        </td>
                        <td className="px-5 py-3 text-zinc-500 tabular-nums">{formatWeight(aWeight)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-zinc-700 mb-3">No assets in this bucket yet.</p>
              <Link
                href="/holdings/new"
                className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Add Asset
              </Link>
            </div>
          )}
        </Card>

        {/* Related research notes */}
        {relatedNotes.length > 0 && (
          <Card>
            <div className="px-5 pt-5 pb-4 border-b border-[#26262B]">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
                Research Notes · {relatedNotes.length}
              </span>
            </div>
            <div className="divide-y divide-[#1A1A1F]">
              {relatedNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/research/${note.id}`}
                  className="flex items-start justify-between px-5 py-3 hover:bg-[#1C1C21] transition-colors"
                >
                  <div>
                    <p className="text-sm text-zinc-300 hover:text-indigo-400 transition-colors">
                      {note.title ?? note.body?.slice(0, 60) ?? 'Untitled'}
                    </p>
                    {note.thesis && (
                      <p className="text-[11px] text-zinc-600 mt-0.5 line-clamp-1">{note.thesis}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-700 flex-shrink-0 ml-4">{formatDate(note.created_at)}</span>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Related transactions */}
        {relatedTxns.length > 0 && (
          <Card>
            <div className="px-5 pt-5 pb-4 border-b border-[#26262B]">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
                Recent Transactions · {relatedTxns.length}
              </span>
            </div>
            <div className="divide-y divide-[#1A1A1F]">
              {relatedTxns.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-xs text-zinc-400 uppercase font-semibold">{txn.type}</p>
                    <p className="text-[11px] text-zinc-600">{formatDate(txn.transaction_date)}</p>
                  </div>
                  <p className="text-xs text-zinc-300 tabular-nums">{formatValue(txn.amount, txn.currency)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Archived assets */}
        {archivedBucket.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-700 mb-2 px-1">
              Archived · {archivedBucket.length}
            </p>
            <Card>
              <div className="divide-y divide-[#1A1A1F]">
                {archivedBucket.map((asset) => (
                  <Link
                    key={asset.id}
                    href={`/holdings/${asset.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-[#1C1C21] transition-colors opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-400">{asset.name}</span>
                      {asset.symbol && <span className="text-xs text-zinc-600 font-mono">{asset.symbol}</span>}
                    </div>
                    <span className="text-xs text-zinc-600">Archived</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}
