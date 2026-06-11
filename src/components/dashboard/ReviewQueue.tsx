import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import {
  formatDate,
  DECISION_TYPE_LABELS,
  DECISION_TYPE_COLORS,
  PURPOSE_LABELS,
  PURPOSE_COLORS,
} from '@/lib/formatters';
import type { DecisionLog, WatchlistItem } from '@/db/schema';
import type { AssetPurpose } from '@/db/schema';

interface UnderfundedBucket {
  purpose: string;
  differencePct: number;
}

interface ReviewQueueProps {
  overdueDecisions: DecisionLog[];
  overdueWatchlist: WatchlistItem[];
  underfundedBuckets: UnderfundedBucket[];
  totalOpen: number;
}

export function ReviewQueue({
  overdueDecisions,
  overdueWatchlist,
  underfundedBuckets,
  totalOpen,
}: ReviewQueueProps) {
  const total = overdueDecisions.length + overdueWatchlist.length + underfundedBuckets.length;

  if (total === 0 && totalOpen === 0) {
    return (
      <Card>
        <CardHeader
          label="Review Queue"
          action={
            <Link href="/calendar" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              View Calendar →
            </Link>
          }
        />
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-emerald-400 font-medium">All clear</p>
          <p className="text-xs text-zinc-600 mt-1">No items need immediate attention.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        label={`Review Queue · ${total} items`}
        action={
          <Link href="/calendar" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            View Calendar →
          </Link>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#26262B]">

        {/* Decisions needing review */}
        <div className="p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">
            Decisions to Review · {overdueDecisions.length}
          </p>
          {overdueDecisions.length === 0 ? (
            <p className="text-xs text-zinc-700">All decisions reviewed</p>
          ) : (
            <div className="space-y-2.5">
              {overdueDecisions.slice(0, 4).map((d) => {
                const typeColor = DECISION_TYPE_COLORS[d.decision_type] ?? '#9CA3AF';
                const displayTitle = d.title ?? d.asset_name;
                return (
                  <Link
                    key={d.id}
                    href={`/decisions/${d.id}/review`}
                    className="flex items-center gap-2 group"
                  >
                    <span
                      className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                    >
                      {(DECISION_TYPE_LABELS[d.decision_type] ?? d.decision_type).slice(0, 3).toUpperCase()}
                    </span>
                    <span className="text-xs text-zinc-400 group-hover:text-indigo-400 transition-colors truncate flex-1">
                      {displayTitle}
                    </span>
                    <span className="text-[10px] text-zinc-700 flex-shrink-0 tabular-nums">
                      {formatDate(d.decision_date)}
                    </span>
                  </Link>
                );
              })}
              {overdueDecisions.length > 4 && (
                <Link href="/decisions" className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
                  +{overdueDecisions.length - 4} more →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Watchlist overdue */}
        <div className="p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">
            Watchlist Overdue · {overdueWatchlist.length}
          </p>
          {overdueWatchlist.length === 0 ? (
            <p className="text-xs text-zinc-700">No overdue watchlist reviews</p>
          ) : (
            <div className="space-y-2.5">
              {overdueWatchlist.slice(0, 4).map((w) => (
                <Link
                  key={w.id}
                  href={`/watchlist/${w.id}`}
                  className="flex items-center gap-2 group"
                >
                  <span className="text-xs text-zinc-400 group-hover:text-indigo-400 transition-colors truncate flex-1">
                    {w.name}
                  </span>
                  <span className="text-[10px] text-amber-500 flex-shrink-0 tabular-nums">
                    {w.review_date ? formatDate(w.review_date) : ''}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Underfunded buckets */}
        <div className="p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">
            Underfunded Buckets · {underfundedBuckets.length}
          </p>
          {underfundedBuckets.length === 0 ? (
            <p className="text-xs text-zinc-700">All buckets within target range</p>
          ) : (
            <div className="space-y-2.5">
              {underfundedBuckets.map((b) => {
                const color = PURPOSE_COLORS[b.purpose as AssetPurpose] ?? '#9CA3AF';
                return (
                  <Link
                    key={b.purpose}
                    href={`/buckets/${b.purpose}`}
                    className="flex items-center gap-2 group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-zinc-400 group-hover:text-indigo-400 transition-colors flex-1 truncate">
                      {PURPOSE_LABELS[b.purpose as AssetPurpose] ?? b.purpose}
                    </span>
                    <span className="text-[10px] text-red-400 flex-shrink-0 tabular-nums">
                      +{b.differencePct.toFixed(1)}pp
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
