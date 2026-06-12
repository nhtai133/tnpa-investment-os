import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { formatValue, formatWeight } from '@/lib/formatters';
import type { LocationSummary } from '@/lib/locations';

const EPSILON = 0.00000001;

interface Props {
  locations: LocationSummary[];
  totalValue: number;
}

export function LocationsSummary({ locations, totalValue }: Props) {
  const visible = locations.filter((l) => !l.isEmpty).slice(0, 10);

  if (visible.length === 0) {
    return (
      <Card className="px-6 py-10 text-center">
        <p className="text-sm text-zinc-600 mb-2">No locations registered yet.</p>
        <Link href="/accounts/new" className="text-xs text-indigo-400 hover:text-indigo-300">
          + Add your first account →
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#26262B]">
        <div>
          <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
            Assets by Location
          </span>
          <span className="ml-2 text-[11px] text-zinc-700">
            {formatValue(totalValue, 'VND')} tracked
          </span>
        </div>
        <Link
          href="/locations"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          View all →
        </Link>
      </div>
      <div className="divide-y divide-[#1A1A1F]">
        {visible.map((loc) => (
          <div
            key={loc.account.id}
            className="flex items-center gap-4 px-5 py-3 hover:bg-[#101014] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <Link
                href={`/locations/${loc.account.id}`}
                className="text-sm text-zinc-200 hover:text-indigo-300 transition-colors block truncate"
              >
                {loc.account.name}
              </Link>
              <p className="text-[11px] text-zinc-600 mt-0.5">{loc.group}</p>
            </div>

            {loc.custodyValue > EPSILON && (
              <div className="text-right hidden md:block">
                <p className="text-xs text-zinc-500 tabular-nums">
                  {loc.positionCount} assets
                </p>
                <p className="text-[11px] text-zinc-700 tabular-nums">
                  {formatValue(loc.custodyValue, loc.account.currency)}
                </p>
              </div>
            )}

            <div className="text-right">
              <p className="text-sm text-zinc-100 tabular-nums font-medium">
                {formatValue(loc.totalValue, loc.account.currency)}
              </p>
              <p className="text-[11px] text-zinc-600 tabular-nums">
                {formatWeight(loc.netWorthPct)}
              </p>
            </div>

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
      {locations.filter((l) => !l.isEmpty).length > 10 && (
        <div className="px-5 py-3 border-t border-[#1A1A1F]">
          <Link href="/locations" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            +{locations.filter((l) => !l.isEmpty).length - 10} more locations →
          </Link>
        </div>
      )}
    </Card>
  );
}
