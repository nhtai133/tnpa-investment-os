'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatValue, formatWeight } from '@/lib/formatters';

export type BankingAllocationKind = 'checking' | 'savings' | 'credit';

export interface BankingAllocationInput {
  kind: BankingAllocationKind;
  bankName: string;
  amountVnd: number;
  href: string;
}

interface Slice {
  key: BankingAllocationKind;
  label: string;
  value: number;
  color: string;
}

interface BankRow {
  bankName: string;
  value: number;
  href: string;
}

const SLICE_META: Record<BankingAllocationKind, { label: string; color: string }> = {
  checking: { label: 'Checking', color: '#60A5FA' },
  savings: { label: 'Savings', color: '#34D399' },
  credit: { label: 'Credit Used', color: '#F87171' },
};

function groupByBank(rows: BankingAllocationInput[], kind: BankingAllocationKind): BankRow[] {
  const map = new Map<string, BankRow>();
  for (const row of rows.filter((item) => item.kind === kind)) {
    const existing = map.get(row.bankName) ?? { bankName: row.bankName, value: 0, href: row.href };
    existing.value += Math.abs(row.amountVnd);
    map.set(row.bankName, existing);
  }
  return Array.from(map.values())
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);
}

function BankBreakdownPanel({
  title,
  rows,
  total,
  active,
}: {
  title: string;
  rows: BankRow[];
  total: number;
  active?: boolean;
}) {
  return (
    <div className={`rounded-lg border ${active ? 'border-zinc-500 bg-[#1C1C21]' : 'border-[#26262B] bg-[#0C0C0E]'} p-4`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">{title}</p>
        <p className="text-xs text-zinc-500">{rows.length} banks</p>
      </div>
      {rows.length === 0 ? (
        <div className="h-24 flex items-center justify-center">
          <p className="text-sm text-zinc-600">No allocation data.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const weight = total > 0 ? (row.value / total) * 100 : 0;
            return (
              <Link key={row.bankName} href={row.href} className="block group">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-300 group-hover:text-indigo-300 transition-colors">{row.bankName}</span>
                  <div className="text-right">
                    <p className="text-sm text-zinc-100 tabular-nums">{formatValue(row.value, 'VND')}</p>
                    <p className="text-[11px] text-zinc-600 tabular-nums">{formatWeight(weight)}</p>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-[#26262B] overflow-hidden">
                  <div className="h-full rounded-full bg-zinc-400" style={{ width: `${Math.min(weight, 100)}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ payload: Slice }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-[#1C1C21] border border-[#303037] rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="font-medium text-zinc-100">{item.label}</p>
      <p className="text-zinc-400">{formatValue(item.value, 'VND')}</p>
    </div>
  );
}

export function BankingAllocationDrilldown({ rows }: { rows: BankingAllocationInput[] }) {
  const [selected, setSelected] = useState<BankingAllocationKind>('savings');

  const checkingRows = useMemo(() => groupByBank(rows, 'checking'), [rows]);
  const savingsRows = useMemo(() => groupByBank(rows, 'savings'), [rows]);
  const creditRows = useMemo(() => groupByBank(rows, 'credit'), [rows]);

  const checkingTotal = checkingRows.reduce((sum, row) => sum + row.value, 0);
  const savingsTotal = savingsRows.reduce((sum, row) => sum + row.value, 0);
  const creditTotal = creditRows.reduce((sum, row) => sum + row.value, 0);
  const bankingValue = checkingTotal + savingsTotal - creditTotal;

  const slices: Slice[] = [
    { key: 'checking', label: SLICE_META.checking.label, value: checkingTotal, color: SLICE_META.checking.color } satisfies Slice,
    { key: 'savings', label: SLICE_META.savings.label, value: savingsTotal, color: SLICE_META.savings.color } satisfies Slice,
    ...(creditTotal > 0 ? [{ key: 'credit', label: SLICE_META.credit.label, value: creditTotal, color: SLICE_META.credit.color } satisfies Slice] : []),
  ].filter((slice) => slice.value > 0);
  const grossTotal = slices.reduce((sum, slice) => sum + slice.value, 0);
  const selectedRows = selected === 'checking' ? checkingRows : selected === 'savings' ? savingsRows : creditRows;
  const selectedTotal = selected === 'checking' ? checkingTotal : selected === 'savings' ? savingsTotal : creditTotal;

  return (
    <Card className="overflow-hidden">
      <CardHeader label="Banking Allocation" action="drill-down by bank" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-5">
        <div className="space-y-5">
          <div className="h-72 relative">
            {slices.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={slices}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={78}
                      outerRadius={112}
                      paddingAngle={slices.length > 1 ? 2 : 0}
                      strokeWidth={0}
                      onClick={(slice) => setSelected(slice.key)}
                    >
                      {slices.map((slice) => (
                        <Cell
                          key={slice.key}
                          fill={slice.color}
                          opacity={selected === slice.key ? 1 : 0.65}
                          className="cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Total Banking Value</p>
                    <p className="mt-1 text-xl font-light text-zinc-50 tabular-nums">{formatValue(bankingValue, 'VND')}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-zinc-600">No banking allocation data yet.</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {slices.map((slice) => {
              const weight = grossTotal > 0 ? (slice.value / grossTotal) * 100 : 0;
              return (
                <button
                  key={slice.key}
                  type="button"
                  onClick={() => setSelected(slice.key)}
                  className={`w-full rounded-lg border px-3 py-2.5 transition-colors ${
                    selected === slice.key ? 'border-zinc-500 bg-[#1C1C21]' : 'border-[#26262B] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                      <span className="text-sm text-zinc-300">{slice.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-100 tabular-nums">{formatValue(slice.value, 'VND')}</p>
                      <p className="text-[11px] text-zinc-600 tabular-nums">{formatWeight(weight)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <BankBreakdownPanel
            title={`${SLICE_META[selected].label} Allocation by Bank`}
            rows={selectedRows}
            total={selectedTotal}
            active
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BankBreakdownPanel title="Checking Allocation by Bank" rows={checkingRows} total={checkingTotal} active={selected === 'checking'} />
            <BankBreakdownPanel title="Savings Allocation by Bank" rows={savingsRows} total={savingsTotal} active={selected === 'savings'} />
          </div>
        </div>
      </div>
    </Card>
  );
}
