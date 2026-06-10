'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatCurrency, formatWeight } from '@/lib/formatters';

export interface AllocationDataItem {
  key: string;
  label: string;
  color: string;
  value: number;
  weight: number;
}

interface AllocationChartProps {
  data: AllocationDataItem[];
  label?: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: AllocationDataItem }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-[#1C1C21] border border-[#303037] rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="font-medium text-zinc-100">{item.label}</p>
      <p className="text-zinc-400">{formatCurrency(item.value)}</p>
      <p className="text-zinc-500">{formatWeight(item.weight)} of investable</p>
    </div>
  );
}

function CustomLegend({ data }: { data: AllocationDataItem[] }) {
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-zinc-400 truncate">{item.label}</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-zinc-300 font-medium tabular-nums">{formatWeight(item.weight)}</span>
            <span className="text-xs text-zinc-600 tabular-nums w-20 text-right">{formatCurrency(item.value, true)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AllocationChart({ data, label }: AllocationChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value);

  if (sorted.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader label={label ?? 'Asset Allocation'} />
        <div className="p-5 h-48 flex items-center justify-center">
          <p className="text-sm text-zinc-600">No holdings to display.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader label={label ?? 'Asset Allocation'} />
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
                  <Cell key={entry.key} fill={entry.color} />
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
