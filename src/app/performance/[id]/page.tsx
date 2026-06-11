import { db } from '@/db';
import { wealthSnapshots } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatPercent, formatDate, ASSET_CLASS_LABELS, PURPOSE_LABELS } from '@/lib/formatters';
import { deleteSnapshot } from '../actions';
import type { AssetClass, AssetPurpose } from '@/db/schema';
import { DeleteSnapshotButton } from '@/components/performance/DeleteSnapshotButton';

export const dynamic = 'force-dynamic';

interface AssetAllocationRow {
  asset_class: AssetClass;
  value: number;
  weight: number;
  count: number;
}

interface PurposeAllocationRow {
  purpose: AssetPurpose;
  value: number;
  weight: number;
  count: number;
}

export default async function SnapshotDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  const [snapshot] = await db
    .select()
    .from(wealthSnapshots)
    .where(eq(wealthSnapshots.id, id))
    .limit(1);

  if (!snapshot) notFound();

  const assetAllocation: AssetAllocationRow[] = JSON.parse(snapshot.asset_allocation_json);
  const purposeAllocation: PurposeAllocationRow[] = JSON.parse(snapshot.purpose_allocation_json);

  const retirementRow = purposeAllocation.find((r) => r.purpose === 'retirement');
  const gl = snapshot.total_gain_loss_usd;
  const glPct =
    gl != null && snapshot.total_cost_basis_usd && snapshot.total_cost_basis_usd > 0
      ? (gl / snapshot.total_cost_basis_usd) * 100
      : null;

  const deleteAction = deleteSnapshot.bind(null, snapshot.id);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/performance" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            ← Performance
          </Link>
          <h1 className="text-lg font-semibold text-zinc-100 mt-1">
            Snapshot — {formatDate(snapshot.snapshot_date)}
          </h1>
          {snapshot.notes && (
            <p className="text-sm text-zinc-500 mt-0.5">{snapshot.notes}</p>
          )}
        </div>
        <DeleteSnapshotButton action={deleteAction} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border border-[#26262B] rounded-xl bg-[#131316] px-4 py-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Total NW</p>
          <p className="text-base font-semibold text-zinc-100">
            {formatCurrency(snapshot.total_net_worth_usd)}
          </p>
        </div>
        <div className="border border-[#26262B] rounded-xl bg-[#131316] px-4 py-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Investable NW</p>
          <p className="text-base font-semibold text-zinc-100">
            {formatCurrency(snapshot.investable_net_worth_usd)}
          </p>
          <p className="text-xs text-zinc-600 mt-0.5">
            {snapshot.total_net_worth_usd > 0
              ? `${((snapshot.investable_net_worth_usd / snapshot.total_net_worth_usd) * 100).toFixed(1)}%`
              : '—'}
          </p>
        </div>
        <div className="border border-[#26262B] rounded-xl bg-[#131316] px-4 py-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Unrealized G/L</p>
          {gl != null ? (
            <>
              <p className={`text-base font-semibold ${gl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {gl >= 0 ? '+' : ''}{formatCurrency(gl)}
              </p>
              {glPct !== null && (
                <p className="text-xs text-zinc-600 mt-0.5">{formatPercent(glPct, 1)} return</p>
              )}
            </>
          ) : (
            <p className="text-base font-semibold text-zinc-600">—</p>
          )}
        </div>
        <div className="border border-[#26262B] rounded-xl bg-[#131316] px-4 py-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">USD/VND Rate</p>
          <p className="text-base font-semibold text-zinc-100">
            {snapshot.usd_vnd_rate.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Two columns: asset allocation + purpose allocation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Asset Class Allocation */}
        <div className="border border-[#26262B] rounded-xl bg-[#131316] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#26262B]">
            <p className="text-xs font-semibold text-zinc-300">Asset Class Allocation</p>
          </div>
          <div className="divide-y divide-[#26262B]">
            {assetAllocation
              .sort((a, b) => b.value - a.value)
              .map((row) => (
                <div key={row.asset_class} className="flex items-center justify-between px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-300">
                      {ASSET_CLASS_LABELS[row.asset_class] ?? row.asset_class}
                    </span>
                    <span className="text-[10px] text-zinc-600">{row.count} asset{row.count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">{formatCurrency(row.value)}</span>
                    <span className="text-[11px] font-medium text-zinc-300 w-12 text-right">
                      {row.weight.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Purpose Allocation */}
        <div className="border border-[#26262B] rounded-xl bg-[#131316] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#26262B]">
            <p className="text-xs font-semibold text-zinc-300">Purpose Allocation</p>
          </div>
          <div className="divide-y divide-[#26262B]">
            {purposeAllocation
              .sort((a, b) => b.value - a.value)
              .map((row) => (
                <div key={row.purpose} className="flex items-center justify-between px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-300">
                      {PURPOSE_LABELS[row.purpose] ?? row.purpose}
                    </span>
                    <span className="text-[10px] text-zinc-600">{row.count} asset{row.count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">{formatCurrency(row.value)}</span>
                    <span className="text-[11px] font-medium text-zinc-300 w-12 text-right">
                      {row.weight.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Retirement Tracking */}
      <div className="border border-[#26262B] rounded-xl bg-[#131316] px-5 py-4">
        <p className="text-xs font-semibold text-zinc-300 mb-3">Retirement Bucket</p>
        {retirementRow ? (
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xl font-semibold text-zinc-100">
                {formatCurrency(retirementRow.value)}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {retirementRow.weight.toFixed(1)}% of total net worth
              </p>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-[#26262B] rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${Math.min(100, retirementRow.weight)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">
            No assets assigned to the Retirement bucket at this snapshot.{' '}
            <Link href="/buckets/retirement" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              Go to Retirement bucket →
            </Link>
          </p>
        )}
      </div>

      <div className="text-center">
        <p className="text-[10px] text-zinc-800">
          Snapshot captured {new Date(snapshot.created_at).toLocaleString('en-US')}
        </p>
      </div>
    </div>
  );
}
