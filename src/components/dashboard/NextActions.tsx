import Link from 'next/link';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import { formatDate, ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from '@/lib/formatters';
import type { WatchlistItem } from '@/db/schema';

interface NextActionsProps {
  items: WatchlistItem[];
}

export function NextActions({ items }: NextActionsProps) {
  const today = new Date().toISOString().split('T')[0];

  // Items with overdue/today reviews, or items with next_action text, sorted by urgency
  const actionable = items
    .filter((i) => i.next_action || i.review_date)
    .sort((a, b) => {
      // Overdue/today first
      const aOverdue = a.review_date && a.review_date <= today;
      const bOverdue = b.review_date && b.review_date <= today;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (a.review_date && b.review_date) return a.review_date.localeCompare(b.review_date);
      if (a.review_date) return -1;
      if (b.review_date) return 1;
      return 0;
    })
    .slice(0, 5);

  return (
    <Card>
      <CardHeader
        label="Next Actions"
        action={
          <Link href="/watchlist" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Watchlist →
          </Link>
        }
      />
      {actionable.length > 0 ? (
        <div className="divide-y divide-[#1C1C21]">
          {actionable.map((item) => {
            const isOverdue = item.review_date && item.review_date <= today;
            const isToday = item.review_date === today;
            const reviewColor = isOverdue ? (isToday ? '#FBBF24' : '#F87171') : '#9CA3AF';

            return (
              <div key={item.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-zinc-200">{item.name}</span>
                      {item.symbol && (
                        <span className="text-[11px] text-zinc-600">{item.symbol}</span>
                      )}
                      {item.asset_class && (
                        <Badge
                          label={ASSET_CLASS_LABELS[item.asset_class]}
                          color={ASSET_CLASS_COLORS[item.asset_class]}
                        />
                      )}
                      {item.conviction_score != null && (
                        <span className="text-[11px] text-zinc-600">
                          C{item.conviction_score}
                        </span>
                      )}
                    </div>
                    {item.next_action && (
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-1">
                        {item.next_action}
                      </p>
                    )}
                  </div>
                  {item.review_date && (
                    <div className="flex-shrink-0 text-right">
                      <p className="text-[10px] text-zinc-600">Review</p>
                      <p className="text-xs tabular-nums font-medium" style={{ color: reviewColor }}>
                        {isToday ? 'Today' : isOverdue ? 'Overdue' : formatDate(item.review_date)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-zinc-700">No pending actions.</p>
          <p className="text-xs text-zinc-800 mt-1">
            Set review dates on watchlist items to track them here.
          </p>
        </div>
      )}
    </Card>
  );
}
