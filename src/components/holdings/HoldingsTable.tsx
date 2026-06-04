import Link from 'next/link';
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
import type { Asset } from '@/db/schema';

interface HoldingsTableProps {
  assets: Asset[];
  totalNetWorth: number;
}

export function HoldingsTable({ assets, totalNetWorth }: HoldingsTableProps) {
  if (assets.length === 0) {
    return (
      <Card className="px-6 py-16 text-center">
        <p className="text-sm text-zinc-500">No assets match this filter.</p>
        <Link
          href="/holdings/new"
          className="mt-3 inline-block text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          + Add your first asset
        </Link>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader label="Holdings" action={`${assets.length} positions`} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#26262B]">
              <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600">
                Asset
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600">
                Class
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600 hidden lg:table-cell">
                Purpose
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600">
                Value
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600 hidden md:table-cell">
                Weight
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600 hidden md:table-cell">
                Cost Basis
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600 hidden lg:table-cell">
                Gain / Loss
              </th>
              <th className="px-5 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, idx) => {
              const weight =
                totalNetWorth > 0 ? (asset.current_value / totalNetWorth) * 100 : 0;
              const gain =
                asset.cost_basis != null ? asset.current_value - asset.cost_basis : null;
              const gainPct =
                asset.cost_basis != null && asset.cost_basis > 0
                  ? ((asset.current_value - asset.cost_basis) / asset.cost_basis) * 100
                  : null;

              return (
                <tr
                  key={asset.id}
                  className="border-b border-[#1C1C21] hover:bg-[#1C1C21] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-zinc-700 w-4 tabular-nums">
                        {idx + 1}
                      </span>
                      <div>
                        <Link
                          href={`/holdings/${asset.id}`}
                          className="text-sm font-medium text-zinc-100 hover:text-indigo-300 transition-colors"
                        >
                          {asset.name}
                        </Link>
                        {asset.symbol && (
                          <p className="text-xs text-zinc-600 mt-0.5">{asset.symbol}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <Badge
                      label={ASSET_CLASS_LABELS[asset.asset_class]}
                      color={ASSET_CLASS_COLORS[asset.asset_class]}
                    />
                  </td>

                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span
                      className="text-xs"
                      style={{ color: PURPOSE_COLORS[asset.purpose] }}
                    >
                      {PURPOSE_LABELS[asset.purpose]}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm font-medium text-zinc-100 tabular-nums">
                      {formatCurrency(asset.current_value)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right hidden md:table-cell">
                    <span className="text-xs text-zinc-400 tabular-nums">
                      {formatWeight(weight)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right hidden md:table-cell">
                    {asset.cost_basis != null ? (
                      <span className="text-xs text-zinc-400 tabular-nums">
                        {formatCurrency(asset.cost_basis)}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-700">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                    {gain != null && gainPct != null ? (
                      <div>
                        <p
                          className={`text-sm tabular-nums font-medium ${
                            gain >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {gain >= 0 ? '+' : ''}
                          {formatCurrency(gain)}
                        </p>
                        <p
                          className={`text-xs tabular-nums ${
                            gainPct >= 0 ? 'text-emerald-500' : 'text-red-500'
                          }`}
                        >
                          {formatPercent(gainPct)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-700">—</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/holdings/${asset.id}`}
                        className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/holdings/${asset.id}/edit`}
                        className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
