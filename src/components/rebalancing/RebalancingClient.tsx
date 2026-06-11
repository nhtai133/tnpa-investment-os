'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/formatters';
import {
  REBALANCING_CLASSES,
  REBALANCING_LABELS,
  REBALANCING_COLORS,
  type RebalancingAssetClass,
  type RebalancingResult,
} from '@/lib/rebalancing';
import { saveTargets } from '@/app/rebalancing/actions';

interface Props {
  rebalancing: RebalancingResult;
  targets: Record<RebalancingAssetClass, number>;
}

export function RebalancingClient({ rebalancing, targets }: Props) {
  const router = useRouter();

  const [editTargets, setEditTargets] = useState<Record<RebalancingAssetClass, string>>(
    Object.fromEntries(
      REBALANCING_CLASSES.map((cls) => [cls, targets[cls].toString()]),
    ) as Record<RebalancingAssetClass, string>,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const liveTotal = REBALANCING_CLASSES.reduce(
    (sum, cls) => sum + (parseFloat(editTargets[cls]) || 0),
    0,
  );
  const isValid = Math.abs(liveTotal - 100) <= 0.01;

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    const fd = new FormData();
    for (const cls of REBALANCING_CLASSES) fd.set(cls, editTargets[cls]);
    const result = await saveTargets(null, fd);
    setSaving(false);
    if (result?.error) {
      setSaveError(result.error);
    } else {
      setSaveSuccess(true);
      router.refresh();
    }
  }

  const { portfolioValue, rows, driftScore, largestOverweight, largestUnderweight } = rebalancing;

  const chartMax =
    Math.ceil(Math.max(...rows.map((r) => Math.max(r.currentPct, r.targetPct)), 45) / 10) * 10 + 5;

  const chartData = rows.map((row) => ({
    name: row.label,
    current: parseFloat(row.currentPct.toFixed(1)),
    target: row.targetPct,
  }));

  const driftColor =
    driftScore > 25 ? 'text-red-400' : driftScore > 12 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">
            Portfolio
          </p>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Rebalancing
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              Portfolio Value
            </p>
            <p className="text-xl font-bold text-zinc-100 mt-1.5 tabular-nums">
              {formatCurrency(portfolioValue)}
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">Investable · USD-normalized</p>
          </Card>

          <Card className="p-4">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              Drift Score
            </p>
            <p className={`text-xl font-bold mt-1.5 tabular-nums ${driftColor}`}>
              {driftScore.toFixed(1)}
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">Sum of |deviations| in %</p>
          </Card>

          <Card className="p-4">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              Largest Overweight
            </p>
            {largestOverweight ? (
              <>
                <p className="text-sm font-semibold text-red-400 mt-1.5">{largestOverweight.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                  {largestOverweight.currentPct.toFixed(1)}% vs {largestOverweight.targetPct}% target
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-zinc-600 mt-1.5">None</p>
            )}
          </Card>

          <Card className="p-4">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
              Largest Underweight
            </p>
            {largestUnderweight ? (
              <>
                <p className="text-sm font-semibold text-emerald-400 mt-1.5">
                  {largestUnderweight.label}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                  {largestUnderweight.currentPct.toFixed(1)}% vs {largestUnderweight.targetPct}% target
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-zinc-600 mt-1.5">None</p>
            )}
          </Card>
        </div>

        {/* Comparison Chart */}
        <Card>
          <div className="px-5 pt-5 pb-4 border-b border-[#26262B] flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
              Allocation Comparison
            </span>
            <div className="flex items-center gap-4 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-indigo-400" />
                Current
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-zinc-600" />
                Target
              </span>
            </div>
          </div>
          <div className="p-5" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                barGap={2}
                barCategoryGap={14}
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#26262B" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, chartMax]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fill: '#52525B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={96}
                  tick={{ fill: '#A1A1AA', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: number, name: string) => [
                    `${val.toFixed(1)}%`,
                    name === 'current' ? 'Current' : 'Target',
                  ]}
                  contentStyle={{
                    background: '#1C1C21',
                    border: '1px solid #303037',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#A1A1AA' }}
                  itemStyle={{ color: '#E4E4E7' }}
                />
                <Bar dataKey="current" fill="#818CF8" name="Current" radius={[0, 3, 3, 0]} />
                <Bar dataKey="target" fill="#3F3F46" name="Target" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Table + Suggestions */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Current vs Target Table */}
          <Card>
            <div className="px-5 pt-5 pb-4 border-b border-[#26262B]">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
                Current vs Target
              </span>
            </div>
            <div>
              <div className="px-5 py-2 flex items-center gap-3 border-b border-[#26262B]">
                <span className="flex-1 text-[10px] font-semibold tracking-widest uppercase text-zinc-700">
                  Asset Class
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700 w-12 text-right">
                    Current
                  </span>
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700 w-12 text-right">
                    Target
                  </span>
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700 w-14 text-right">
                    Diff
                  </span>
                </div>
              </div>

              {rows.map((row) => {
                const isOnTarget = row.action === 'ON TARGET';
                const diffColor = isOnTarget
                  ? 'text-zinc-600'
                  : row.differencePct > 0
                  ? 'text-emerald-400'
                  : 'text-red-400';
                const diffLabel = isOnTarget
                  ? '≈ 0%'
                  : `${row.differencePct > 0 ? '+' : ''}${row.differencePct.toFixed(1)}%`;

                return (
                  <div
                    key={row.assetClass}
                    className="px-5 py-3 flex items-center gap-3 border-b border-[#1A1A1F] last:border-0"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="flex-1 text-xs text-zinc-300">{row.label}</span>
                    <div className="flex items-center gap-4 tabular-nums">
                      <span className="text-xs text-zinc-400 w-12 text-right">
                        {row.currentPct.toFixed(1)}%
                      </span>
                      <span className="text-xs text-zinc-600 w-12 text-right">
                        {row.targetPct.toFixed(1)}%
                      </span>
                      <span className={`text-xs font-semibold w-14 text-right ${diffColor}`}>
                        {diffLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Suggested Actions */}
          <Card>
            <div className="px-5 pt-5 pb-4 border-b border-[#26262B]">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
                Suggested Actions
              </span>
            </div>
            <div>
              {rows.map((row) => {
                const isOnTarget = row.action === 'ON TARGET';
                const actionColor = isOnTarget
                  ? 'text-zinc-600'
                  : row.action === 'BUY'
                  ? 'text-emerald-400'
                  : 'text-red-400';
                const amountLabel = isOnTarget
                  ? null
                  : `${row.action === 'BUY' ? '+' : '-'}${formatCurrency(Math.abs(row.differenceValueUsd), true)}`;

                return (
                  <div
                    key={row.assetClass}
                    className="px-5 py-3.5 flex items-center justify-between gap-3 border-b border-[#1A1A1F] last:border-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="text-xs text-zinc-300 truncate">{row.label}</span>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span
                        className={`text-[10px] font-bold tracking-widest uppercase ${actionColor}`}
                      >
                        {row.action}
                      </span>
                      {amountLabel && (
                        <span className={`text-xs font-semibold tabular-nums ${actionColor}`}>
                          {amountLabel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="px-5 py-3 border-t border-[#26262B]">
                <p className="text-[10px] text-zinc-700">
                  Threshold ±1% · Decision support only · No trades executed
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Target Allocation Editor */}
        <Card>
          <div className="px-5 pt-5 pb-4 border-b border-[#26262B]">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
              Target Allocation
            </span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-5">
              {REBALANCING_CLASSES.map((cls) => (
                <div key={cls}>
                  <label className="block mb-1.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: REBALANCING_COLORS[cls] }}
                      />
                      {REBALANCING_LABELS[cls]}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editTargets[cls]}
                      onChange={(e) =>
                        setEditTargets((prev) => ({ ...prev, [cls]: e.target.value }))
                      }
                      className="w-full pr-7 pl-3 py-2 bg-[#1C1C21] border border-[#26262B] hover:border-zinc-600 focus:border-indigo-500 focus:outline-none rounded-lg text-sm text-zinc-100 tabular-nums transition-colors"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold tabular-nums ${
                    isValid ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {liveTotal.toFixed(1)}%
                </span>
                <span className="text-xs text-zinc-600">
                  {isValid ? 'Total valid — ready to save' : 'Must equal 100%'}
                </span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !isValid}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#1C1C21] disabled:text-zinc-600 disabled:border disabled:border-[#26262B] text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Saving…' : 'Save Targets'}
              </button>
            </div>

            {saveError && <p className="text-xs text-red-400 mt-3">{saveError}</p>}
            {saveSuccess && (
              <p className="text-xs text-emerald-400 mt-3">Targets saved — analysis updated.</p>
            )}
          </div>
        </Card>

      </main>
    </div>
  );
}
