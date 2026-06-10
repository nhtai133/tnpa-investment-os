'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatCurrency, formatValue, formatWeight } from '@/lib/formatters';
import { normalizeToUsd } from '@/lib/fx';
import type { Asset } from '@/db/schema';

const COLORS = [
  '#818CF8', '#34D399', '#F472B6', '#FB923C', '#A78BFA',
  '#38BDF8', '#FBBF24', '#F87171', '#4ADE80', '#22D3EE',
];

interface HoldingSlice {
  id: number;
  name: string;
  symbol: string | null;
  currency: string;
  nativeValue: number;
  usdValue: number;
  weight: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: HoldingSlice }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-[#1C1C21] border border-[#303037] rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="font-medium text-zinc-100">{item.name}</p>
      {item.symbol && <p className="text-[11px] text-zinc-600">{item.symbol}</p>}
      <p className="text-zinc-400 text-xs mt-1">{formatValue(item.nativeValue, item.currency)}</p>
      {item.currency !== 'USD' && (
        <p className="text-zinc-600 text-[11px]">≈ {formatCurrency(item.usdValue)}</p>
      )}
      <p className="text-zinc-500 text-xs">{formatWeight(item.weight)} of workspace</p>
    </div>
  );
}

interface WorkspaceAllocationChartProps {
  assets: Asset[];
  usdVndRate: number;
  label?: string;
}

export function WorkspaceAllocationChart({
  assets,
  usdVndRate,
  label = 'Allocation Breakdown',
}: WorkspaceAllocationChartProps) {
  if (assets.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader label={label} />
        <div className="p-5 h-24 flex items-center justify-center">
          <p className="text-sm text-zinc-600">No holdings to display.</p>
        </div>
      </Card>
    );
  }

  const sorted = [...assets]
    .map((a) => ({
      id: a.id,
      name: a.name,
      symbol: a.symbol,
      currency: a.currency,
      nativeValue: a.current_value,
      usdValue: normalizeToUsd(a.current_value, a.currency, usdVndRate),
    }))
    .sort((a, b) => b.usdValue - a.usdValue);

  const totalUsd = sorted.reduce((s, a) => s + a.usdValue, 0);

  const data: HoldingSlice[] = sorted.map((a, idx) => ({
    ...a,
    weight: totalUsd > 0 ? (a.usdValue / totalUsd) * 100 : 0,
    color: COLORS[idx % COLORS.length],
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader label={label} />
      <div className="p-5 flex flex-col gap-5 flex-1">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={88}
                paddingAngle={data.length > 1 ? 2 : 0}
                dataKey="usdValue"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-zinc-400 truncate">
                  {item.symbol ?? item.name}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-zinc-300 font-medium tabular-nums">
                  {formatWeight(item.weight)}
                </span>
                <span className="text-xs text-zinc-600 tabular-nums w-20 text-right">
                  {formatCurrency(item.usdValue, true)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-zinc-600 pt-2 border-t border-[#26262B]">
          As % of workspace total · USD-normalized
        </p>
      </div>
    </Card>
  );
}
