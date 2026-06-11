'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChartPoint {
  date: string;
  totalNW: number;
  investableNW: number;
  gainLoss: number | null;
}

interface Props {
  data: ChartPoint[];
}

function dollarFormatter(v: number) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#131316',
  border: '1px solid #26262B',
  borderRadius: 8,
  color: '#e4e4e7',
  fontSize: 12,
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE} className="px-3 py-2 space-y-1">
      <p className="text-zinc-400 text-[11px] mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span style={{ color: p.color }} className="text-[11px] font-medium">{p.name}</span>
          <span className="text-zinc-200 text-[11px]">{dollarFormatter(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function PerformanceCharts({ data }: Props) {
  if (data.length < 2) {
    return (
      <div className="border border-[#26262B] rounded-xl bg-[#131316] px-5 py-10 text-center">
        <p className="text-zinc-500 text-sm">Need at least 2 snapshots to show charts.</p>
        <p className="text-zinc-700 text-xs mt-1">Create another snapshot after updating your portfolio.</p>
      </div>
    );
  }

  const gainData = data.filter((d) => d.gainLoss !== null);

  return (
    <div className="space-y-4">
      {/* Net Worth Over Time */}
      <div className="border border-[#26262B] rounded-xl bg-[#131316] px-5 py-4">
        <p className="text-xs font-semibold text-zinc-300 mb-4">Net Worth Over Time</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradInv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#26262B" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#71717a', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={dollarFormatter}
              tick={{ fill: '#71717a', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#71717a', paddingTop: 8 }}
            />
            <Area
              type="monotone"
              dataKey="totalNW"
              name="Total NW"
              stroke="#818CF8"
              strokeWidth={2}
              fill="url(#gradTotal)"
              dot={{ fill: '#818CF8', r: 3, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="investableNW"
              name="Investable NW"
              stroke="#34D399"
              strokeWidth={2}
              fill="url(#gradInv)"
              dot={{ fill: '#34D399', r: 3, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Gain / Loss Over Time */}
      {gainData.length >= 2 && (
        <div className="border border-[#26262B] rounded-xl bg-[#131316] px-5 py-4">
          <p className="text-xs font-semibold text-zinc-300 mb-4">Unrealized Gain / Loss Over Time</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={gainData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradGain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262B" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#71717a', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={dollarFormatter}
                tick={{ fill: '#71717a', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="gainLoss"
                name="Gain / Loss"
                stroke="#FBBF24"
                strokeWidth={2}
                fill="url(#gradGain)"
                dot={{ fill: '#FBBF24', r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
