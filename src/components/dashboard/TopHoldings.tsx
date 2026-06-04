import { Card, CardHeader, Badge } from '@/components/ui/Card';
import {
  formatCurrency,
  formatWeight,
  formatPercent,
  ASSET_CLASS_LABELS,
  ASSET_CLASS_COLORS,
  PURPOSE_LABELS,
  PURPOSE_COLORS,
} from '@/lib/formatters';
import type { AssetClass, AssetPurpose } from '@/db/schema';

interface Holding {
  id: number;
  name: string;
  symbol: string | null;
  asset_class: AssetClass;
  purpose: AssetPurpose;
  current_value: number;
  cost_basis: number | null;
  weight: number;
  unrealized_gain: number | null;
  unrealized_gain_pct: number | null;
}

interface TopHoldingsProps {
  holdings: Holding[];
}

export function TopHoldings({ holdings }: TopHoldingsProps) {
  return (
    <Card>
      <CardHeader label="Top Holdings" action={`${holdings.length} positions`} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#26262B]">
              <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wide text-zinc-600 uppercase">
                Asset
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide text-zinc-600 uppercase">
                Class
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide text-zinc-600 uppercase hidden lg:table-cell">
                Purpose
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold tracking-wide text-zinc-600 uppercase">
                Value
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold tracking-wide text-zinc-600 uppercase hidden md:table-cell">
                Weight
              </th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold tracking-wide text-zinc-600 uppercase hidden md:table-cell">
                Gain / Loss
              </th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, idx) => (
              <tr
                key={holding.id}
                className="border-b border-[#1C1C21] hover:bg-[#1C1C21] transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-zinc-600 w-4 tabular-nums">{idx + 1}</span>
                    <div>
                      <p className="text-sm text-zinc-100 font-medium">{holding.name}</p>
                      {holding.symbol && (
                        <p className="text-xs text-zinc-600 mt-0.5">{holding.symbol}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <Badge
                    label={ASSET_CLASS_LABELS[holding.asset_class]}
                    color={ASSET_CLASS_COLORS[holding.asset_class]}
                  />
                </td>
                <td className="px-4 py-3.5 hidden lg:table-cell">
                  <span
                    className="text-xs"
                    style={{ color: PURPOSE_COLORS[holding.purpose] }}
                  >
                    {PURPOSE_LABELS[holding.purpose]}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm font-medium text-zinc-100 tabular-nums">
                    {formatCurrency(holding.current_value)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right hidden md:table-cell">
                  <span className="text-xs text-zinc-400 tabular-nums">
                    {formatWeight(holding.weight)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right hidden md:table-cell">
                  {holding.unrealized_gain != null && holding.unrealized_gain_pct != null ? (
                    <div>
                      <p
                        className={`text-sm tabular-nums font-medium ${
                          holding.unrealized_gain >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {holding.unrealized_gain >= 0 ? '+' : ''}
                        {formatCurrency(holding.unrealized_gain)}
                      </p>
                      <p
                        className={`text-xs tabular-nums ${
                          holding.unrealized_gain_pct >= 0 ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        {formatPercent(holding.unrealized_gain_pct)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-700">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
