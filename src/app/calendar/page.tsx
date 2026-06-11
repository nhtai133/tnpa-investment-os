import Link from 'next/link';
import { db } from '@/db';
import { assets, assetIntelligence, decisionLogs, watchlistItems, appSettings } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { ASSET_PURPOSES } from '@/db/schema';
import { formatDate } from '@/lib/formatters';
import { PURPOSE_LABELS, PURPOSE_COLORS, DECISION_TYPE_LABELS } from '@/lib/formatters';
import type { AssetPurpose } from '@/db/schema';
import {
  getBand,
  getDateBounds,
  REVIEW_CADENCE_LABELS,
  CALENDAR_BAND_LABELS,
  CALENDAR_BAND_COLORS,
  CALENDAR_ITEM_COLORS,
  type CalendarItem,
  type CalendarBand,
} from '@/lib/calendar';

export const dynamic = 'force-dynamic';

const BAND_ORDER: CalendarBand[] = ['overdue', 'this_week', 'this_month', 'upcoming'];

function TypeBadge({ type, label }: { type: string; label: string }) {
  const color = CALENDAR_ITEM_COLORS[type as keyof typeof CALENDAR_ITEM_COLORS] ?? '#9CA3AF';
  return (
    <span
      className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  );
}

function BandSection({
  band,
  items,
}: {
  band: CalendarBand;
  items: CalendarItem[];
}) {
  const color = CALENDAR_BAND_COLORS[band];
  const label = CALENDAR_BAND_LABELS[band];

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <h2 className="text-[11px] font-semibold tracking-widest uppercase" style={{ color }}>
          {label}
        </h2>
        <span className="text-[10px] text-zinc-700">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="border border-[#26262B] rounded-xl overflow-hidden">
        {items.map((item, idx) => (
          <Link
            key={item.key}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-[#1C1C21] transition-colors group ${
              idx < items.length - 1 ? 'border-b border-[#26262B]' : ''
            }`}
          >
            <TypeBadge
              type={item.type}
              label={item.type === 'decision' ? 'DEC' : item.type === 'watchlist' ? 'WL' : item.type === 'asset' ? 'AST' : 'BCK'}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors truncate">
                {item.name}
              </p>
              {item.subtext && (
                <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{item.subtext}</p>
              )}
            </div>
            {item.cadence && (
              <span className="hidden sm:inline text-[10px] text-zinc-600 flex-shrink-0">
                {REVIEW_CADENCE_LABELS[item.cadence] ?? item.cadence}
              </span>
            )}
            <span
              className="text-[11px] tabular-nums font-medium flex-shrink-0"
              style={{ color: band === 'overdue' ? '#F87171' : '#71717A' }}
            >
              {formatDate(item.dueDate)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function CalendarPage() {
  const { today, weekEnd, monthEnd } = getDateBounds();

  const [
    pendingDecisions,
    activeWatchlist,
    intelligenceRows,
    allSettings,
  ] = await Promise.all([
    db.select().from(decisionLogs).where(
      and(eq(decisionLogs.is_reviewed, false), isNotNull(decisionLogs.next_review_date)),
    ),
    db.select().from(watchlistItems).where(
      and(eq(watchlistItems.status, 'active'), isNotNull(watchlistItems.review_date)),
    ),
    db.select({
      id: assetIntelligence.id,
      asset_id: assetIntelligence.asset_id,
      next_review_date: assetIntelligence.next_review_date,
      review_cadence: assetIntelligence.review_cadence,
      asset_name: assets.name,
    })
      .from(assetIntelligence)
      .innerJoin(assets, eq(assetIntelligence.asset_id, assets.id))
      .where(and(isNotNull(assetIntelligence.next_review_date), eq(assets.is_archived, false))),
    db.select().from(appSettings),
  ]);

  const settingsMap = new Map(allSettings.map((s) => [s.key, s.value]));

  // Build calendar items
  const items: CalendarItem[] = [];

  // Decisions
  for (const d of pendingDecisions) {
    if (!d.next_review_date) continue;
    items.push({
      key: `decision-${d.id}`,
      type: 'decision',
      name: d.title ?? d.asset_name,
      dueDate: d.next_review_date,
      href: `/decisions/${d.id}/review`,
      subtext: DECISION_TYPE_LABELS[d.decision_type] ?? d.decision_type,
      band: getBand(d.next_review_date, today, weekEnd, monthEnd),
    });
  }

  // Watchlist
  for (const w of activeWatchlist) {
    if (!w.review_date) continue;
    items.push({
      key: `watchlist-${w.id}`,
      type: 'watchlist',
      name: w.name,
      dueDate: w.review_date,
      href: `/watchlist/${w.id}`,
      cadence: w.review_cadence,
      subtext: w.symbol ?? null,
      band: getBand(w.review_date, today, weekEnd, monthEnd),
    });
  }

  // Assets via intelligence
  for (const ai of intelligenceRows) {
    if (!ai.next_review_date || !ai.asset_id) continue;
    items.push({
      key: `asset-${ai.asset_id}`,
      type: 'asset',
      name: ai.asset_name,
      dueDate: ai.next_review_date,
      href: `/holdings/${ai.asset_id}`,
      cadence: ai.review_cadence,
      band: getBand(ai.next_review_date, today, weekEnd, monthEnd),
    });
  }

  // Buckets via app_settings
  for (const purpose of ASSET_PURPOSES) {
    const nextReview = settingsMap.get(`bucket_next_review_${purpose}`);
    if (!nextReview) continue;
    const cadence = settingsMap.get(`bucket_review_cadence_${purpose}`);
    items.push({
      key: `bucket-${purpose}`,
      type: 'bucket',
      name: PURPOSE_LABELS[purpose as AssetPurpose],
      dueDate: nextReview,
      href: `/buckets/${purpose}`,
      cadence: cadence ?? null,
      subtext: 'Purpose bucket review',
      band: getBand(nextReview, today, weekEnd, monthEnd),
    });
  }

  // Sort each band by date ascending
  items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const byBand = BAND_ORDER.reduce(
    (acc, band) => {
      acc[band] = items.filter((i) => i.band === band);
      return acc;
    },
    {} as Record<CalendarBand, CalendarItem[]>,
  );

  const totalCount = items.length;
  const overdueCount = byBand.overdue.length;

  // Bucket health summary (all 7 purposes)
  const bucketSchedule = ASSET_PURPOSES.map((purpose) => ({
    purpose: purpose as AssetPurpose,
    nextReview: settingsMap.get(`bucket_next_review_${purpose}`) ?? null,
    cadence: settingsMap.get(`bucket_review_cadence_${purpose}`) ?? null,
  }));

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">Portfolio</p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">Wealth Calendar</h1>
          </div>
          <div className="flex items-center gap-3">
            {overdueCount > 0 && (
              <span className="text-[11px] font-semibold text-red-400 bg-red-400/10 px-2 py-1 rounded">
                {overdueCount} overdue
              </span>
            )}
            <span className="text-[11px] text-zinc-600 hidden sm:inline">{todayLabel}</span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-8">

        {/* Empty state */}
        {totalCount === 0 && (
          <div className="border border-[#26262B] rounded-xl px-6 py-12 text-center bg-[#131316]">
            <p className="text-sm font-medium text-emerald-400">All caught up!</p>
            <p className="text-xs text-zinc-600 mt-2 max-w-sm mx-auto">
              No scheduled reviews. Set review dates on decisions, watchlist items, assets, or buckets to see them here.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <Link href="/decisions" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Decisions →
              </Link>
              <Link href="/watchlist" className="text-xs text-pink-400 hover:text-pink-300 transition-colors">
                Watchlist →
              </Link>
              <Link href="/holdings" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                Assets →
              </Link>
              <Link href="/buckets" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                Buckets →
              </Link>
            </div>
          </div>
        )}

        {/* Date-band sections */}
        {BAND_ORDER.map((band) => (
          <BandSection key={band} band={band} items={byBand[band]} />
        ))}

        {/* Bucket Review Schedule */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full flex-shrink-0 bg-amber-400" />
            <h2 className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
              Bucket Review Schedule
            </h2>
          </div>
          <div className="border border-[#26262B] rounded-xl overflow-hidden bg-[#131316]">
            {bucketSchedule.map(({ purpose, nextReview, cadence }, idx) => {
              const color = PURPOSE_COLORS[purpose] ?? '#9CA3AF';
              const isOverdue = nextReview && nextReview < today;
              return (
                <div
                  key={purpose}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx < bucketSchedule.length - 1 ? 'border-b border-[#26262B]' : ''
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <Link
                    href={`/buckets/${purpose}`}
                    className="flex-1 text-sm text-zinc-400 hover:text-zinc-200 transition-colors truncate"
                  >
                    {PURPOSE_LABELS[purpose]}
                  </Link>
                  {cadence && (
                    <span className="hidden sm:inline text-[10px] text-zinc-600 flex-shrink-0">
                      {REVIEW_CADENCE_LABELS[cadence] ?? cadence}
                    </span>
                  )}
                  {nextReview ? (
                    <span
                      className="text-[11px] tabular-nums font-medium flex-shrink-0"
                      style={{ color: isOverdue ? '#F87171' : '#71717A' }}
                    >
                      {formatDate(nextReview)}
                    </span>
                  ) : (
                    <Link
                      href={`/buckets/${purpose}`}
                      className="text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors flex-shrink-0"
                    >
                      Set date →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-zinc-700 mt-2">
            Schedule bucket reviews from each bucket&apos;s detail page.
          </p>
        </section>

        {/* Type legend */}
        <div className="flex flex-wrap gap-4 pt-2 border-t border-[#26262B]">
          {(['decision', 'watchlist', 'asset', 'bucket'] as const).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: CALENDAR_ITEM_COLORS[type] }}
              />
              <span className="text-[10px] text-zinc-600 capitalize">{type}</span>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
