'use client';

import { Card, CardHeader } from '@/components/ui/Card';
import { PURPOSE_LABELS, PURPOSE_COLORS, formatCurrency, formatWeight } from '@/lib/formatters';
import type { AssetPurpose } from '@/db/schema';

interface PurposeDataItem {
  purpose: AssetPurpose;
  value: number;
  weight: number;
  count: number;
}

interface PurposeAllocationProps {
  data: PurposeDataItem[];
}

export function PurposeAllocation({ data }: PurposeAllocationProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const maxWeight = Math.max(...sorted.map((d) => d.weight));

  return (
    <Card className="flex flex-col">
      <CardHeader label="Asset Purpose" />
      <div className="p-5 flex flex-col gap-3 flex-1">
        {sorted.map((item) => {
          const color = PURPOSE_COLORS[item.purpose];
          const barWidth = maxWeight > 0 ? (item.weight / maxWeight) * 100 : 0;

          return (
            <div key={item.purpose} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-zinc-400">
                    {PURPOSE_LABELS[item.purpose]}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-medium tabular-nums"
                    style={{ color }}
                  >
                    {formatWeight(item.weight)}
                  </span>
                  <span className="text-xs text-zinc-600 tabular-nums w-18 text-right">
                    {formatCurrency(item.value, true)}
                  </span>
                </div>
              </div>
              <div className="w-full h-1 bg-[#26262B] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: `${color}90`,
                  }}
                />
              </div>
            </div>
          );
        })}
        <p className="text-[11px] text-zinc-600 pt-2 border-t border-[#26262B]">
          As % of Total Net Worth
        </p>
      </div>
    </Card>
  );
}
