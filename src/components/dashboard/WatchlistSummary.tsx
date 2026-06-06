import Link from 'next/link';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import {
  formatDate,
  ASSET_CLASS_LABELS,
  ASSET_CLASS_COLORS,
} from '@/lib/formatters';
import type { WatchlistItem } from '@/db/schema';

interface WatchlistSummaryProps {
  items: WatchlistItem[];
}

export function WatchlistSummary({ items }: WatchlistSummaryProps) {
  const flagged = items.filter((i) => i.alert_flag);
  const normal = items.filter((i) => !i.alert_flag);
  const sorted = [...flagged, ...normal];

  return (
    <Card className="flex flex-col">
      <CardHeader
        label="Watchlist"
        action={
          <Link href="/watchlist" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            {flagged.length > 0 ? `${flagged.length} flagged · All →` : `All →`}
          </Link>
        }
      />
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-zinc-700 mb-3">Watchlist is empty.</p>
          <Link
            href="/watchlist/new"
            className="inline-flex items-center px-4 py-2 border border-[#303037] hover:border-zinc-500 text-sm text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
          >
            + Add to Watchlist
          </Link>
        </div>
      ) : (
      <div className="divide-y divide-[#1C1C21]">
        {sorted.map((item) => (
          <div key={item.id} className="px-5 py-4 hover:bg-[#1C1C21] transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                {item.alert_flag ? (
                  <div className="mt-0.5 w-6 h-6 rounded flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                ) : (
                  <div className="mt-0.5 w-6 h-6 rounded flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-zinc-700" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-100">{item.name}</span>
                    {item.symbol && (
                      <span className="text-xs text-zinc-600">{item.symbol}</span>
                    )}
                    {item.asset_class && (
                      <Badge
                        label={ASSET_CLASS_LABELS[item.asset_class]}
                        color={ASSET_CLASS_COLORS[item.asset_class]}
                      />
                    )}
                    {item.alert_flag && (
                      <span className="text-[11px] text-amber-400 font-medium">Flagged</span>
                    )}
                  </div>
                  {item.note && (
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">
                      {item.note}
                    </p>
                  )}
                </div>
              </div>
              {item.review_date && (
                <div className="flex-shrink-0 text-right">
                  <p className="text-[11px] text-zinc-600">Review</p>
                  <p className="text-[11px] text-zinc-500 tabular-nums">
                    {formatDate(item.review_date)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </Card>
  );
}
