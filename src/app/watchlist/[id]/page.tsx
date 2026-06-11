import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { watchlistItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateWatchlistItem, markWatchlistItemReviewed } from '@/app/watchlist/actions';
import { WatchlistForm } from '@/components/watchlist/WatchlistForm';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/formatters';
import { REVIEW_CADENCE_LABELS, computeNextReviewDate } from '@/lib/calendar';
import type { ReviewCadence } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function EditWatchlistItemPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  const item = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!item) notFound();

  const updateAction = updateWatchlistItem.bind(null, id);
  const markReviewedAction = markWatchlistItemReviewed.bind(null, id);

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = item.review_date && item.review_date < today;
  const nextAfterReview = item.review_cadence
    ? computeNextReviewDate(new Date(), item.review_cadence as ReviewCadence)
    : null;

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/watchlist"
              className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← Watchlist
            </Link>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              {item.name}
            </h1>
          </div>
          <Link
            href="/calendar"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Calendar →
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-4">
        <div className="max-w-2xl space-y-4">

          {/* Review status bar */}
          {item.review_date && (
            <div className={`rounded-xl border px-5 py-4 flex items-center justify-between gap-4 ${
              isOverdue ? 'border-red-900/50 bg-red-950/20' : 'border-[#26262B] bg-[#131316]'
            }`}>
              <div>
                <p className={`text-xs font-semibold ${isOverdue ? 'text-red-400' : 'text-zinc-400'}`}>
                  {isOverdue ? 'Review Overdue' : 'Review Scheduled'}
                </p>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  {formatDate(item.review_date)}
                  {item.review_cadence && (
                    <span className="ml-2 text-zinc-700">
                      · {REVIEW_CADENCE_LABELS[item.review_cadence] ?? item.review_cadence}
                    </span>
                  )}
                  {nextAfterReview && (
                    <span className="ml-2 text-zinc-700">
                      → next: {formatDate(nextAfterReview)}
                    </span>
                  )}
                </p>
              </div>
              <form action={markReviewedAction}>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors whitespace-nowrap"
                >
                  Mark Reviewed
                </button>
              </form>
            </div>
          )}

          <Card>
            <div className="p-6">
              <WatchlistForm
                action={updateAction}
                defaultValues={item}
                cancelHref="/watchlist"
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
