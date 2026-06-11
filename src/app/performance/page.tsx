import { db } from '@/db';
import { wealthSnapshots } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import { formatCurrency, formatPercent, formatDate } from '@/lib/formatters';
import { createSnapshot } from './actions';
import { PerformanceCharts } from '@/components/performance/PerformanceCharts';

export const dynamic = 'force-dynamic';

export default async function PerformancePage() {
  const snapshots = await db
    .select()
    .from(wealthSnapshots)
    .orderBy(desc(wealthSnapshots.snapshot_date));

  const chartData = [...snapshots]
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    .map((s) => ({
      date: new Date(s.snapshot_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      totalNW: s.total_net_worth_usd,
      investableNW: s.investable_net_worth_usd,
      gainLoss: s.total_gain_loss_usd,
    }));

  const latest = snapshots[0] ?? null;
  const previous = snapshots[1] ?? null;

  const nwChange =
    latest && previous
      ? latest.total_net_worth_usd - previous.total_net_worth_usd
      : null;
  const nwChangePct =
    nwChange !== null && previous && previous.total_net_worth_usd > 0
      ? (nwChange / previous.total_net_worth_usd) * 100
      : null;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Wealth Performance</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manual snapshots of your portfolio over time. No automatic or live data.
          </p>
        </div>
        <form action={createSnapshot}>
          <input type="hidden" name="notes" value="" />
          <button
            type="submit"
            className="text-xs bg-[#1C1C21] border border-[#26262B] hover:border-zinc-600 text-zinc-200 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            + Create Snapshot
          </button>
        </form>
      </div>

      {/* KPI strip */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="border border-[#26262B] rounded-xl bg-[#131316] px-4 py-3">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Total NW</p>
            <p className="text-base font-semibold text-zinc-100">
              {formatCurrency(latest.total_net_worth_usd)}
            </p>
            {nwChange !== null && nwChangePct !== null && (
              <p className={`text-xs mt-0.5 ${nwChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {nwChange >= 0 ? '+' : ''}{formatCurrency(nwChange)} ({formatPercent(nwChangePct, 1)})
              </p>
            )}
          </div>
          <div className="border border-[#26262B] rounded-xl bg-[#131316] px-4 py-3">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Investable NW</p>
            <p className="text-base font-semibold text-zinc-100">
              {formatCurrency(latest.investable_net_worth_usd)}
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">
              {latest.total_net_worth_usd > 0
                ? `${((latest.investable_net_worth_usd / latest.total_net_worth_usd) * 100).toFixed(1)}% of total`
                : '—'}
            </p>
          </div>
          <div className="border border-[#26262B] rounded-xl bg-[#131316] px-4 py-3">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Unrealized G/L</p>
            {latest.total_gain_loss_usd != null ? (
              <>
                <p
                  className={`text-base font-semibold ${
                    latest.total_gain_loss_usd >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {latest.total_gain_loss_usd >= 0 ? '+' : ''}
                  {formatCurrency(latest.total_gain_loss_usd)}
                </p>
                {latest.total_cost_basis_usd != null && latest.total_cost_basis_usd > 0 && (
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {formatPercent(
                      (latest.total_gain_loss_usd / latest.total_cost_basis_usd) * 100,
                      1,
                    )}{' '}
                    return
                  </p>
                )}
              </>
            ) : (
              <p className="text-base font-semibold text-zinc-600">—</p>
            )}
          </div>
          <div className="border border-[#26262B] rounded-xl bg-[#131316] px-4 py-3">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">USD/VND Rate</p>
            <p className="text-base font-semibold text-zinc-100">
              {latest.usd_vnd_rate.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">at last snapshot</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <PerformanceCharts data={chartData} />

      {/* Snapshot list */}
      <div className="border border-[#26262B] rounded-xl bg-[#131316] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#26262B] flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-300">Snapshot History</p>
          <p className="text-[10px] text-zinc-600">{snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}</p>
        </div>

        {snapshots.length === 0 ? (
          <div className="px-5 py-10 text-center space-y-2">
            <p className="text-zinc-400 text-sm">No snapshots yet.</p>
            <p className="text-zinc-600 text-xs">
              Click &quot;+ Create Snapshot&quot; to capture today&apos;s portfolio state.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#26262B]">
            {snapshots.map((s) => {
              const gl = s.total_gain_loss_usd;
              const glPct =
                gl != null && s.total_cost_basis_usd && s.total_cost_basis_usd > 0
                  ? (gl / s.total_cost_basis_usd) * 100
                  : null;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-[#1C1C21] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-zinc-200">
                        {formatDate(s.snapshot_date)}
                      </p>
                      {s.notes && (
                        <p className="text-xs text-zinc-500 truncate max-w-[200px]">{s.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-0.5">
                      <span className="text-[11px] text-zinc-500">
                        Total: <span className="text-zinc-300">{formatCurrency(s.total_net_worth_usd)}</span>
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Investable: <span className="text-zinc-300">{formatCurrency(s.investable_net_worth_usd)}</span>
                      </span>
                      {gl != null && (
                        <span className={`text-[11px] ${gl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          G/L: {gl >= 0 ? '+' : ''}{formatCurrency(gl)}
                          {glPct !== null && ` (${formatPercent(glPct, 1)})`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/performance/${s.id}`}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors whitespace-nowrap"
                  >
                    View →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create snapshot with notes form */}
      <div className="border border-[#26262B] rounded-xl bg-[#131316] px-5 py-4">
        <p className="text-xs font-semibold text-zinc-300 mb-3">Create Snapshot with Notes</p>
        <form action={createSnapshot} className="flex gap-3">
          <input
            name="notes"
            type="text"
            placeholder="Optional note (e.g. 'End of June rebalance')"
            className="flex-1 bg-[#0C0C0E] border border-[#26262B] text-sm text-zinc-200 placeholder-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            className="text-xs bg-[#1C1C21] border border-[#26262B] hover:border-zinc-600 text-zinc-200 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Save Snapshot
          </button>
        </form>
      </div>
    </div>
  );
}
