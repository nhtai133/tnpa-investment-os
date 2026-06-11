import Link from 'next/link';
import { db } from '@/db';
import { watchlistItems } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import { ConvictionBadge } from '@/components/opportunities/ConvictionBadge';
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS, formatDate, WATCHLIST_STATUS_LABELS } from '@/lib/formatters';
import { archiveWatchlistItem } from '@/app/watchlist/actions';
import type { WatchlistItem } from '@/db/schema';

export const dynamic = 'force-dynamic';

function WatchlistRow({ item }: { item: WatchlistItem }) {
  const archive = archiveWatchlistItem.bind(null, item.id);

  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-[#1C1C21] last:border-0">
      {/* Flag dot */}
      <div className="mt-1.5 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full ${item.alert_flag ? 'bg-amber-400' : 'bg-zinc-700'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-100">{item.name}</span>
          {item.symbol && <span className="text-xs text-zinc-600">{item.symbol}</span>}
          {item.asset_class && (
            <Badge
              label={ASSET_CLASS_LABELS[item.asset_class]}
              color={ASSET_CLASS_COLORS[item.asset_class]}
            />
          )}
          <ConvictionBadge score={item.conviction_score} />
          {item.alert_flag && (
            <span className="text-[11px] text-amber-400 font-medium">Flagged</span>
          )}
        </div>

        {item.thesis && (
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">{item.thesis}</p>
        )}
        {!item.thesis && item.note && (
          <p className="text-xs text-zinc-600 mt-1 leading-relaxed line-clamp-1">{item.note}</p>
        )}

        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
          {item.target_entry && (
            <span className="text-[11px] text-zinc-600">
              Entry: <span className="text-zinc-500">{item.target_entry}</span>
            </span>
          )}
          {item.next_action && (
            <span className="text-[11px] text-zinc-600">
              Next: <span className="text-zinc-500">{item.next_action}</span>
            </span>
          )}
          {item.review_date && (
            <span className="text-[11px] text-zinc-600">
              Review: <span className="text-zinc-500">{formatDate(item.review_date)}</span>
            </span>
          )}
          {item.opportunity_id && (
            <Link
              href={`/opportunities/${item.opportunity_id}`}
              className="text-[11px] text-indigo-600 hover:text-indigo-400 transition-colors"
            >
              View Opportunity →
            </Link>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center gap-2">
        <Link
          href={`/watchlist/${item.id}`}
          className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Edit
        </Link>
        {item.status === 'active' && (
          <form action={archive}>
            <button
              type="submit"
              className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors"
            >
              Archive
            </button>
          </form>
        )}
        {item.status !== 'active' && (
          <span
            className="text-[11px] px-2 py-0.5 rounded"
            style={{ backgroundColor: '#26262B', color: '#71717A' }}
          >
            {WATCHLIST_STATUS_LABELS[item.status]}
          </span>
        )}
      </div>
    </div>
  );
}

export default async function WatchlistPage() {
  const all = await db.select().from(watchlistItems).orderBy(desc(watchlistItems.created_at));

  const active = all.filter((i) => i.status === 'active');
  const flagged = active.filter((i) => i.alert_flag);
  const normal = active.filter((i) => !i.alert_flag);
  const sorted = [...flagged, ...normal];
  const archived = all.filter((i) => i.status !== 'active');

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">TNPA</p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight">Watchlist</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-600">{active.length} active · {flagged.length} flagged</span>
            <Link
              href="/watchlist/new"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Add to Watchlist
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">
        <Card>
          <CardHeader
            label={`Active · ${active.length}`}
            action={flagged.length > 0 ? `${flagged.length} flagged` : undefined}
          />
          {sorted.length > 0 ? (
            <div>{sorted.map((item) => <WatchlistRow key={item.id} item={item} />)}</div>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-zinc-700 mb-3">Nothing on the watchlist yet.</p>
              <Link
                href="/watchlist/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Add to Watchlist
              </Link>
            </div>
          )}
        </Card>

        {archived.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-700 mb-2 px-1">
              Archive · {archived.length}
            </p>
            <Card>
              <div>{archived.map((item) => <WatchlistRow key={item.id} item={item} />)}</div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
