import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatValue, formatPercent } from '@/lib/formatters';
import { normalizeToUsd, DEFAULT_USD_VND_RATE } from '@/lib/fx';
import type { Asset } from '@/db/schema';

export interface AssetAccountMeta {
  brokerName: string | null;
  brokerId: number | null;
  custodyName: string | null;
  custodyId: number | null;
  fundingName: string | null;
  fundingId: number | null;
}

interface StocksHoldingsTableProps {
  assets: Asset[];
  totalNetWorth: number;
  usdVndRate?: number;
  assetMeta?: Map<number, AssetAccountMeta>;
}

export function StocksHoldingsTable({
  assets,
  totalNetWorth,
  usdVndRate = DEFAULT_USD_VND_RATE,
  assetMeta,
}: StocksHoldingsTableProps) {
  if (assets.length === 0) {
    return (
      <Card className="px-6 py-16 text-center">
        <p className="text-sm text-zinc-500">No stock holdings.</p>
        <Link
          href="/stocks/new"
          className="mt-3 inline-block text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          + Add your first holding
        </Link>
      </Card>
    );
  }

  const showMeta = assetMeta && assetMeta.size > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader label="Stock Holdings" action={`${assets.length} positions`} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#26262B]">
              <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600">
                Asset
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600">
                Value
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600 hidden md:table-cell">
                Cost Basis
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600 hidden lg:table-cell">
                Gain / Loss
              </th>
              {showMeta && (
                <>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600 hidden xl:table-cell">
                    Broker
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600 hidden xl:table-cell">
                    Custody
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600 hidden xl:table-cell">
                    Funding Source
                  </th>
                </>
              )}
              <th className="px-5 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, idx) => {
              const gain =
                asset.cost_basis != null ? asset.current_value - asset.cost_basis : null;
              const gainPct =
                asset.cost_basis != null && asset.cost_basis > 0
                  ? ((asset.current_value - asset.cost_basis) / asset.cost_basis) * 100
                  : null;
              const meta = assetMeta?.get(asset.id);

              return (
                <tr
                  key={asset.id}
                  className="border-b border-[#1C1C21] hover:bg-[#1C1C21] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-zinc-700 w-4 tabular-nums">{idx + 1}</span>
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

                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm font-medium text-zinc-100 tabular-nums">
                      {formatValue(asset.current_value, asset.currency)}
                    </span>
                    {asset.currency !== 'USD' && (
                      <p className="text-[10px] text-zinc-600 mt-0.5 tabular-nums">
                        ≈{' '}
                        {formatValue(
                          normalizeToUsd(asset.current_value, asset.currency, usdVndRate),
                          'USD',
                        )}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right hidden md:table-cell">
                    {asset.cost_basis != null ? (
                      <span className="text-xs text-zinc-400 tabular-nums">
                        {formatValue(asset.cost_basis, asset.currency)}
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
                          {formatValue(gain, asset.currency)}
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

                  {showMeta && (
                    <>
                      <td className="px-4 py-3.5 hidden xl:table-cell whitespace-nowrap">
                        {meta?.brokerId ? (
                          <Link
                            href={`/stocks/accounts/${meta.brokerId}`}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            {meta.brokerName}
                          </Link>
                        ) : (
                          <span className="text-xs text-zinc-500">{meta?.brokerName ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell whitespace-nowrap">
                        {meta?.custodyId ? (
                          <Link
                            href={`/accounts/${meta.custodyId}`}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            {meta.custodyName}
                          </Link>
                        ) : (
                          <span className="text-xs text-zinc-500">{meta?.custodyName ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell whitespace-nowrap">
                        {meta?.fundingId ? (
                          <Link
                            href={`/accounts/${meta.fundingId}`}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            {meta.fundingName}
                          </Link>
                        ) : (
                          <span className="text-xs text-zinc-500">{meta?.fundingName ?? '—'}</span>
                        )}
                      </td>
                    </>
                  )}

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
