'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS, formatCurrency, formatWeight } from '@/lib/formatters';
import type { AssetClass } from '@/db/schema';

interface ChartDataItem {
  asset_class: AssetClass;
  value: number;
  weight: number;
  count: number;
}

interface AllocationChartProps {
  data: ChartDataItem[];
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataItem }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-[#1C1C21] border border-[#303037] rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="font-medium text-zinc-100">{ASSET_CLASS_LABELS[item.asset_class]}</p>
      <p className="text-zinc-400">{formatCurrency(item.value)}</p>
      <p className="text-zinc-500">{formatWeight(item.weight)} of investable</p>
    </div>
  );
}

function CustomLegend({ data }: { data: ChartDataItem[] }) {
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.asset_class} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: ASSET_CLASS_COLORS[item.asset_class] }}
            />
            <span className="text-xs text-zinc-400 truncate">
              {ASSET_CLASS_LABELS[item.asset_class]}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-zinc-300 font-medium tabular-nums">
              {formatWeight(item.weight)}
            </span>
            <span className="text-xs text-zinc-600 tabular-nums w-20 text-right">
              {formatCurrency(item.value, true)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AllocationChart({ data }: AllocationChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <Card className="flex flex-col">
      <CardHeader label="Asset Allocation" />
      <div className="p-5 flex flex-col gap-5 flex-1">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sorted}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={88}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {sorted.map((entry) => (
                  <Cell
                    key={entry.asset_class}
                    fill={ASSET_CLASS_COLORS[entry.asset_class]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <CustomLegend data={sorted} />
      </div>
    </Card>
  );
}
