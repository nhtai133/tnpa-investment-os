'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  PURPOSE_REBALANCING_PURPOSES,
  type RebalancingAssetClass,
  type RebalancingResult,
  type PurposeRebalancingResult,
  type RebalancingPurpose,
} from '@/lib/rebalancing';
import { saveTargets, savePurposeTargets } from '@/app/rebalancing/actions';

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">{label}</p>
      <div className="mt-1.5">{value}</div>
      {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
    </Card>
  );
}

function ComparisonBarChart({
  data,
}: {
  data: { name: string; current: number; target: number }[];
}) {
  const chartMax =
    Math.ceil(Math.max(...data.map((r) => Math.max(r.current, r.target)), 45) / 10) * 10 + 5;

  return (
    <Card>
      <div className="px-5 pt-5 pb-4 border-b border-[#26262B] flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
          Allocation Comparison
        </span>
        <div className="flex items-center gap-4 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block bg-indigo-400" /> Current
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block bg-zinc-600" /> Target
          </span>
        </div>
      </div>
      <div className="p-5" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
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
              width={120}
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
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  rebalancing: RebalancingResult;
  targets: Record<RebalancingAssetClass, number>;
  purposeRebalancing: PurposeRebalancingResult;
  purposeTargets: Record<RebalancingPurpose, number>;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RebalancingClient({ rebalancing, targets, purposeRebalancing, purposeTargets }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'asset-class' | 'purpose'>('asset-class');

  // Asset class editor state
  const [editTargets, setEditTargets] = useState<Record<RebalancingAssetClass, string>>(
    Object.fromEntries(
      REBALANCING_CLASSES.map((cls) => [cls, targets[cls].toString()]),
    ) as Record<RebalancingAssetClass, string>,
  );
  const [classsaving, setClassSaving] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);
  const [classSuccess, setClassSuccess] = useState(false);

  // Purpose editor state
  const [editPurposeTargets, setEditPurposeTargets] = useState<Record<RebalancingPurpose, string>>(
    Object.fromEntries(
      PURPOSE_REBALANCING_PURPOSES.map((p) => [p, purposeTargets[p].toString()]),
    ) as Record<RebalancingPurpose, string>,
  );
  const [purposeSaving, setPurposeSaving] = useState(false);
  const [purposeError, setPurposeError] = useState<string | null>(null);
  const [purposeSuccess, setPurposeSuccess] = useState(false);

  const classTotal = REBALANCING_CLASSES.reduce(
    (sum, cls) => sum + (parseFloat(editTargets[cls]) || 0),
    0,
  );
  const classValid = Math.abs(classTotal - 100) <= 0.01;

  const purposeTotal = PURPOSE_REBALANCING_PURPOSES.reduce(
    (sum, p) => sum + (parseFloat(editPurposeTargets[p]) || 0),
    0,
  );
  const purposeValid = Math.abs(purposeTotal - 100) <= 0.01;

  async function handleSaveClass() {
    setClassSaving(true);
    setClassError(null);
    setClassSuccess(false);
    const fd = new FormData();
    for (const cls of REBALANCING_CLASSES) fd.set(cls, editTargets[cls]);
    const result = await saveTargets(null, fd);
    setClassSaving(false);
    if (result?.error) setClassError(result.error);
    else { setClassSuccess(true); router.refresh(); }
  }

  async function handleSavePurpose() {
    setPurposeSaving(true);
    setPurposeError(null);
    setPurposeSuccess(false);
    const fd = new FormData();
    for (const p of PURPOSE_REBALANCING_PURPOSES) fd.set(p, editPurposeTargets[p]);
    const result = await savePurposeTargets(null, fd);
    setPurposeSaving(false);
    if (result?.error) setPurposeError(result.error);
    else { setPurposeSuccess(true); router.refresh(); }
  }

  const { portfolioValue, rows, driftScore, largestOverweight, largestUnderweight } = rebalancing;
  const { rows: pRows, driftScore: pDrift, largestOverweight: pOver, largestUnderweight: pUnder } = purposeRebalancing;

  const classDriftColor =
    driftScore > 25 ? 'text-red-400' : driftScore > 12 ? 'text-amber-400' : 'text-emerald-400';
  const purposeDriftColor =
    pDrift > 25 ? 'text-red-400' : pDrift > 12 ? 'text-amber-400' : 'text-emerald-400';

  const classChartData = rows.map((r) => ({
    name: r.label,
    current: parseFloat(r.currentPct.toFixed(1)),
    target: r.targetPct,
  }));

  const purposeChartData = pRows.map((r) => ({
    name: r.label,
    current: parseFloat(r.currentPct.toFixed(1)),
    target: r.targetPct,
  }));

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

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[#26262B]">
          {(
            [
              { id: 'asset-class', label: 'Asset Class' },
              { id: 'purpose', label: 'Purpose Buckets' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-zinc-100 border-indigo-500'
                  : 'text-zinc-600 border-transparent hover:text-zinc-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================================================================
            TAB 1 — Asset Class Rebalancing (unchanged layout)
        ================================================================ */}
        {activeTab === 'asset-class' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Portfolio Value"
                value={<p className="text-xl font-bold text-zinc-100 tabular-nums">{formatCurrency(portfolioValue)}</p>}
                sub="Investable · USD-normalized"
              />
              <KpiCard
                label="Drift Score"
                value={<p className={`text-xl font-bold tabular-nums ${classDriftColor}`}>{driftScore.toFixed(1)}</p>}
                sub="Sum of |deviations| in %"
              />
              <KpiCard
                label="Largest Overweight"
                value={
                  largestOverweight ? (
                    <p className="text-sm font-semibold text-red-400">{largestOverweight.label}</p>
                  ) : (
                    <p className="text-sm font-medium text-zinc-600">None</p>
                  )
                }
                sub={largestOverweight ? `${largestOverweight.currentPct.toFixed(1)}% vs ${largestOverweight.targetPct}% target` : undefined}
              />
              <KpiCard
                label="Largest Underweight"
                value={
                  largestUnderweight ? (
                    <p className="text-sm font-semibold text-emerald-400">{largestUnderweight.label}</p>
                  ) : (
                    <p className="text-sm font-medium text-zinc-600">None</p>
                  )
                }
                sub={largestUnderweight ? `${largestUnderweight.currentPct.toFixed(1)}% vs ${largestUnderweight.targetPct}% target` : undefined}
              />
            </div>

            <ComparisonBarChart data={classChartData} />

            <div className="grid md:grid-cols-2 gap-6">
              {/* Current vs Target */}
              <Card>
                <div className="px-5 pt-5 pb-4 border-b border-[#26262B]">
                  <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
                    Current vs Target
                  </span>
                </div>
                <div>
                  <div className="px-5 py-2 flex items-center gap-3 border-b border-[#26262B]">
                    <span className="flex-1 text-[10px] font-semibold tracking-widest uppercase text-zinc-700">Asset Class</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700 w-12 text-right">Current</span>
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700 w-12 text-right">Target</span>
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700 w-14 text-right">Diff</span>
                    </div>
                  </div>
                  {rows.map((row) => {
                    const isOnTarget = row.action === 'ON TARGET';
                    const diffColor = isOnTarget ? 'text-zinc-600' : row.differencePct > 0 ? 'text-emerald-400' : 'text-red-400';
                    const diffLabel = isOnTarget ? '≈ 0%' : `${row.differencePct > 0 ? '+' : ''}${row.differencePct.toFixed(1)}%`;
                    return (
                      <div key={row.assetClass} className="px-5 py-3 flex items-center gap-3 border-b border-[#1A1A1F] last:border-0">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                        <span className="flex-1 text-xs text-zinc-300">{row.label}</span>
                        <div className="flex items-center gap-4 tabular-nums">
                          <span className="text-xs text-zinc-400 w-12 text-right">{row.currentPct.toFixed(1)}%</span>
                          <span className="text-xs text-zinc-600 w-12 text-right">{row.targetPct.toFixed(1)}%</span>
                          <span className={`text-xs font-semibold w-14 text-right ${diffColor}`}>{diffLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Suggested Actions */}
              <Card>
                <div className="px-5 pt-5 pb-4 border-b border-[#26262B]">
                  <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">Suggested Actions</span>
                </div>
                <div>
                  {rows.map((row) => {
                    const isOnTarget = row.action === 'ON TARGET';
                    const actionColor = isOnTarget ? 'text-zinc-600' : row.action === 'BUY' ? 'text-emerald-400' : 'text-red-400';
                    const amountLabel = isOnTarget ? null : `${row.action === 'BUY' ? '+' : '-'}${formatCurrency(Math.abs(row.differenceValueUsd), true)}`;
                    return (
                      <div key={row.assetClass} className="px-5 py-3.5 flex items-center justify-between gap-3 border-b border-[#1A1A1F] last:border-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                          <span className="text-xs text-zinc-300 truncate">{row.label}</span>
                        </div>
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className={`text-[10px] font-bold tracking-widest uppercase ${actionColor}`}>{row.action}</span>
                          {amountLabel && <span className={`text-xs font-semibold tabular-nums ${actionColor}`}>{amountLabel}</span>}
                        </div>
                      </div>
                    );
                  })}
                  <div className="px-5 py-3 border-t border-[#26262B]">
                    <p className="text-[10px] text-zinc-700">Threshold ±1% · Decision support only · No trades executed</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Target Editor */}
            <Card>
              <div className="px-5 pt-5 pb-4 border-b border-[#26262B]">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">Target Allocation</span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-5">
                  {REBALANCING_CLASSES.map((cls) => (
                    <div key={cls}>
                      <label className="block mb-1.5">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                          <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: REBALANCING_COLORS[cls] }} />
                          {REBALANCING_LABELS[cls]}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="number" min="0" max="100" step="0.1"
                          value={editTargets[cls]}
                          onChange={(e) => setEditTargets((prev) => ({ ...prev, [cls]: e.target.value }))}
                          className="w-full pr-7 pl-3 py-2 bg-[#1C1C21] border border-[#26262B] hover:border-zinc-600 focus:border-indigo-500 focus:outline-none rounded-lg text-sm text-zinc-100 tabular-nums transition-colors"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold tabular-nums ${classValid ? 'text-emerald-400' : 'text-red-400'}`}>{classTotal.toFixed(1)}%</span>
                    <span className="text-xs text-zinc-600">{classValid ? 'Total valid — ready to save' : 'Must equal 100%'}</span>
                  </div>
                  <button
                    onClick={handleSaveClass}
                    disabled={classsaving || !classValid}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#1C1C21] disabled:text-zinc-600 disabled:border disabled:border-[#26262B] text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {classsaving ? 'Saving…' : 'Save Targets'}
                  </button>
                </div>
                {classError && <p className="text-xs text-red-400 mt-3">{classError}</p>}
                {classSuccess && <p className="text-xs text-emerald-400 mt-3">Targets saved — analysis updated.</p>}
              </div>
            </Card>
          </>
        )}

        {/* ================================================================
            TAB 2 — Purpose Bucket Rebalancing
        ================================================================ */}
        {activeTab === 'purpose' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Portfolio Value"
                value={<p className="text-xl font-bold text-zinc-100 tabular-nums">{formatCurrency(purposeRebalancing.portfolioValue)}</p>}
                sub="All active assets · USD-normalized"
              />
              <KpiCard
                label="Purpose Drift Score"
                value={<p className={`text-xl font-bold tabular-nums ${purposeDriftColor}`}>{pDrift.toFixed(1)}</p>}
                sub="Sum of |deviations| in %"
              />
              <KpiCard
                label="Largest Overweight"
                value={
                  pOver ? (
                    <p className="text-sm font-semibold text-red-400">{pOver.label}</p>
                  ) : (
                    <p className="text-sm font-medium text-zinc-600">None</p>
                  )
                }
                sub={pOver ? `${pOver.currentPct.toFixed(1)}% vs ${pOver.targetPct}% target` : undefined}
              />
              <KpiCard
                label="Largest Underweight"
                value={
                  pUnder ? (
                    <p className="text-sm font-semibold text-emerald-400">{pUnder.label}</p>
                  ) : (
                    <p className="text-sm font-medium text-zinc-600">None</p>
                  )
                }
                sub={pUnder ? `${pUnder.currentPct.toFixed(1)}% vs ${pUnder.targetPct}% target` : undefined}
              />
            </div>

            <ComparisonBarChart data={purposeChartData} />

            <div className="grid md:grid-cols-2 gap-6">
              {/* Current vs Target */}
              <Card>
                <div className="px-5 pt-5 pb-4 border-b border-[#26262B]">
                  <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">Current vs Target</span>
                </div>
                <div>
                  <div className="px-5 py-2 flex items-center gap-3 border-b border-[#26262B]">
                    <span className="flex-1 text-[10px] font-semibold tracking-widest uppercase text-zinc-700">Purpose</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700 w-12 text-right">Current</span>
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700 w-12 text-right">Target</span>
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700 w-14 text-right">Diff</span>
                    </div>
                  </div>
                  {pRows.map((row) => {
                    const isOnTarget = row.action === 'ON TARGET';
                    const diffColor = isOnTarget ? 'text-zinc-600' : row.differencePct > 0 ? 'text-emerald-400' : 'text-red-400';
                    const diffLabel = isOnTarget ? '≈ 0%' : `${row.differencePct > 0 ? '+' : ''}${row.differencePct.toFixed(1)}%`;
                    return (
                      <div key={row.purpose} className="px-5 py-3 flex items-center gap-3 border-b border-[#1A1A1F] last:border-0">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                        <Link
                          href={`/buckets/${row.purpose}`}
                          className="flex-1 text-xs text-zinc-300 hover:text-indigo-400 transition-colors"
                        >
                          {row.label}
                        </Link>
                        <div className="flex items-center gap-4 tabular-nums">
                          <span className="text-xs text-zinc-400 w-12 text-right">{row.currentPct.toFixed(1)}%</span>
                          <span className="text-xs text-zinc-600 w-12 text-right">{row.targetPct.toFixed(1)}%</span>
                          <span className={`text-xs font-semibold w-14 text-right ${diffColor}`}>{diffLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Suggested Actions */}
              <Card>
                <div className="px-5 pt-5 pb-4 border-b border-[#26262B]">
                  <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">Suggested Actions</span>
                </div>
                <div>
                  {pRows.map((row) => {
                    const isOnTarget = row.action === 'ON TARGET';
                    const actionColor = isOnTarget ? 'text-zinc-600' : row.action === 'ADD CAPITAL' ? 'text-emerald-400' : 'text-red-400';
                    const amountLabel = isOnTarget ? null : `${row.action === 'ADD CAPITAL' ? '+' : '-'}${formatCurrency(Math.abs(row.differenceValueUsd), true)}`;
                    return (
                      <div key={row.purpose} className="px-5 py-3.5 flex items-center justify-between gap-3 border-b border-[#1A1A1F] last:border-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                          <Link
                            href={`/buckets/${row.purpose}`}
                            className="text-xs text-zinc-300 hover:text-indigo-400 transition-colors truncate"
                          >
                            {row.label}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className={`text-[10px] font-bold tracking-widest uppercase ${actionColor}`}>{row.action}</span>
                          {amountLabel && <span className={`text-xs font-semibold tabular-nums ${actionColor}`}>{amountLabel}</span>}
                        </div>
                      </div>
                    );
                  })}
                  <div className="px-5 py-3 border-t border-[#26262B]">
                    <p className="text-[10px] text-zinc-700">
                      Purpose rebalancing is a planning tool. It does not execute transactions.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Purpose Target Editor */}
            <Card>
              <div className="px-5 pt-5 pb-4 border-b border-[#26262B]">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">Purpose Target Allocation</span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-5">
                  {PURPOSE_REBALANCING_PURPOSES.map((p) => {
                    const row = pRows.find((r) => r.purpose === p);
                    return (
                      <div key={p}>
                        <label className="block mb-1.5">
                          <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                            <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: row?.color ?? '#6B7280' }} />
                            {row?.label ?? p}
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="number" min="0" max="100" step="0.1"
                            value={editPurposeTargets[p]}
                            onChange={(e) => setEditPurposeTargets((prev) => ({ ...prev, [p]: e.target.value }))}
                            className="w-full pr-7 pl-3 py-2 bg-[#1C1C21] border border-[#26262B] hover:border-zinc-600 focus:border-indigo-500 focus:outline-none rounded-lg text-sm text-zinc-100 tabular-nums transition-colors"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold tabular-nums ${purposeValid ? 'text-emerald-400' : 'text-red-400'}`}>{purposeTotal.toFixed(1)}%</span>
                    <span className="text-xs text-zinc-600">{purposeValid ? 'Total valid — ready to save' : 'Must equal 100%'}</span>
                  </div>
                  <button
                    onClick={handleSavePurpose}
                    disabled={purposeSaving || !purposeValid}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#1C1C21] disabled:text-zinc-600 disabled:border disabled:border-[#26262B] text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {purposeSaving ? 'Saving…' : 'Save Targets'}
                  </button>
                </div>
                {purposeError && <p className="text-xs text-red-400 mt-3">{purposeError}</p>}
                {purposeSuccess && <p className="text-xs text-emerald-400 mt-3">Purpose targets saved — analysis updated.</p>}
              </div>
            </Card>
          </>
        )}

      </main>
    </div>
  );
}
