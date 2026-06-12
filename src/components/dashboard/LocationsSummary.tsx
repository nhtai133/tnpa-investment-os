import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { formatValue, formatWeight } from '@/lib/formatters';
import type { LocationSummary } from '@/lib/locations';

// Dashboard display groups (collapsed from the 8 ACCOUNT_TYPE_GROUP values)
const DISPLAY_GROUPS: { label: string; match: string[] }[] = [
  { label: 'Banking', match: ['Banking', 'Cash Locations'] },
  { label: 'Brokers', match: ['Stocks / Brokers'] },
  { label: 'Exchanges', match: ['Crypto Exchanges'] },
  { label: 'Wallets', match: ['Crypto Wallets'] },
  { label: 'Gold Storage', match: ['Gold Storage'] },
  { label: 'Real Estate', match: ['Real Estate'] },
  { label: 'Other', match: ['Other'] },
];

interface Props {
  locations: LocationSummary[];
  totalValue: number;
}

export function LocationsSummary({ locations, totalValue }: Props) {
  const active = locations.filter((l) => !l.isEmpty);

  if (active.length === 0) {
    return (
      <Card className="px-6 py-10 text-center">
        <p className="text-sm text-zinc-600 mb-2">No locations registered yet.</p>
        <Link href="/accounts/new" className="text-xs text-indigo-400 hover:text-indigo-300">
          + Add your first account →
        </Link>
      </Card>
    );
  }

  // Build display-group buckets
  const grouped = DISPLAY_GROUPS.map((dg) => {
    const rows = active.filter((l) => dg.match.includes(l.group));
    return { ...dg, rows };
  }).filter((dg) => dg.rows.length > 0);

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#26262B]">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
            Assets by Location
          </span>
          <span className="text-[11px] text-zinc-700">
            {active.length} active · {formatValue(totalValue, 'VND')} tracked
          </span>
        </div>
        <Link
          href="/locations"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* Group sections */}
      <div className="divide-y divide-[#1A1A1F]">
        {grouped.map((dg) => {
          const groupTotal = dg.rows.reduce((s, l) => s + l.totalValue, 0);
          const groupPct = totalValue > 0 ? (groupTotal / totalValue) * 100 : 0;
          const totalAssets = dg.rows.reduce((s, l) => s + l.positionCount, 0);

          return (
            <div key={dg.label}>
              {/* Group header */}
              <div className="flex items-center justify-between px-5 py-2 bg-[#0E0E12]">
                <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">
                  {dg.label}
                </span>
                <div className="flex items-center gap-3">
                  {totalAssets > 0 && (
                    <span className="text-[11px] text-zinc-700">
                      {totalAssets} asset{totalAssets !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-500 tabular-nums">
                    {formatValue(groupTotal, 'VND')}
                  </span>
                  <span className="text-[11px] text-zinc-700 tabular-nums w-[36px] text-right">
                    {groupPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Rows */}
              {dg.rows.map((loc) => (
                <div
                  key={loc.account.id}
                  className="flex items-center gap-4 px-5 py-2.5 hover:bg-[#101014] transition-colors"
                >
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/locations/${loc.account.id}`}
                      className="text-sm text-zinc-300 hover:text-indigo-300 transition-colors block truncate"
                    >
                      {loc.account.name}
                    </Link>
                    {loc.account.institution && (
                      <p className="text-[11px] text-zinc-700 mt-0.5 truncate">
                        {loc.account.institution}
                      </p>
                    )}
                  </div>

                  {/* Assets count (hidden mobile) */}
                  {loc.positionCount > 0 && (
                    <div className="hidden md:block text-right">
                      <p className="text-[11px] text-zinc-600 tabular-nums">
                        {loc.positionCount} holding{loc.positionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  {/* Value + % */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-zinc-100 tabular-nums font-medium">
                      {formatValue(loc.totalValue, loc.account.currency)}
                    </p>
                    <p className="text-[11px] text-zinc-600 tabular-nums">
                      {formatWeight(loc.netWorthPct)}
                    </p>
                  </div>

                  {/* Chevron */}
                  <Link
                    href={`/locations/${loc.account.id}`}
                    className="text-zinc-700 hover:text-zinc-400 transition-colors flex-shrink-0"
                    aria-label={`View ${loc.account.name}`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path
                        d="M4.5 2.5L8.5 6L4.5 9.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#1A1A1F] flex items-center justify-between">
        <span className="text-[11px] text-zinc-700">
          {locations.filter((l) => l.isEmpty).length} empty locations hidden
        </span>
        <Link href="/locations" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          Full map →
        </Link>
      </div>
    </Card>
  );
}
