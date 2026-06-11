import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { PURPOSE_LABELS, PURPOSE_COLORS } from '@/lib/formatters';
import type { AssetPurpose } from '@/db/schema';

export interface PurposeHealthRow {
  purpose: AssetPurpose;
  currentPct: number;
  targetPct: number;
  drift: number; // targetPct - currentPct: positive = underfunded, negative = overweight
}

interface PurposeHealthProps {
  rows: PurposeHealthRow[];
}

export function PurposeHealth({ rows }: PurposeHealthProps) {
  // Sort: biggest absolute drift first (most attention-needed at top)
  const sorted = [...rows].sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        label="Purpose Health"
        action={
          <Link href="/rebalancing" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Rebalance →
          </Link>
        }
      />
      <div className="p-5 space-y-4 flex-1">
        {sorted.map((row) => {
          const color = PURPOSE_COLORS[row.purpose] ?? '#9CA3AF';
          const isUnderfunded = row.drift > 5;
          const isOverweight = row.drift < -5;
          const statusColor = isUnderfunded ? '#F87171' : isOverweight ? '#FBBF24' : '#34D399';
          const driftLabel = `${row.drift >= 0 ? '+' : ''}${row.drift.toFixed(1)}pp`;

          return (
            <div key={row.purpose}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <Link
                    href={`/buckets/${row.purpose}`}
                    className="text-xs text-zinc-300 hover:text-indigo-400 transition-colors"
                  >
                    {PURPOSE_LABELS[row.purpose]}
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] tabular-nums text-zinc-600">
                    {row.currentPct.toFixed(1)}% / {row.targetPct.toFixed(1)}%
                  </span>
                  <span
                    className="text-[10px] font-semibold tabular-nums w-14 text-right"
                    style={{ color: statusColor }}
                  >
                    {driftLabel}
                  </span>
                </div>
              </div>

              {/* Bar: current fill vs target marker */}
              <div className="relative h-1.5 bg-[#1C1C21] rounded-full overflow-visible">
                {/* Current fill */}
                <div
                  className="absolute top-0 h-full rounded-full"
                  style={{
                    width: `${Math.min(row.currentPct * 2, 100)}%`,
                    backgroundColor: `${color}60`,
                  }}
                />
                {/* Target marker line */}
                {row.targetPct > 0 && (
                  <div
                    className="absolute top-[-1px] w-0.5 h-[8px] rounded-sm"
                    style={{
                      left: `${Math.min(row.targetPct * 2, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}

        <p className="text-[10px] text-zinc-700 pt-2 border-t border-[#26262B]">
          Current % / Target % · Drift = Target − Current · ±5pp threshold
        </p>
      </div>
    </Card>
  );
}
