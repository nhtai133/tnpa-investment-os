import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { opportunities, researchNotes } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import { SourceBadge } from '@/components/opportunities/SourceBadge';
import { OpportunityStatusBadge } from '@/components/opportunities/StatusBadge';
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS, formatDate } from '@/lib/formatters';
import {
  setOpportunityStatus,
  addOpportunityToWatchlist,
  promoteOpportunityToHolding,
} from '@/app/opportunities/actions';
import { NotesCard } from '@/components/journal/NotesCard';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function OpportunityDetailPage({ params }: Props) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const [opp, notes] = await Promise.all([
    db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1).then((r) => r[0]),
    db.select().from(researchNotes).where(eq(researchNotes.opportunity_id, id)).orderBy(desc(researchNotes.created_at)).limit(5),
  ]);
  if (!opp) notFound();

  const isActive = opp.status === 'new' || opp.status === 'reviewing';

  const markReviewing = setOpportunityStatus.bind(null, id, 'reviewing');
  const markRejected = setOpportunityStatus.bind(null, id, 'rejected');
  const addToWatchlist = addOpportunityToWatchlist.bind(null, id);
  const promoteToHolding = promoteOpportunityToHolding.bind(null, id);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/pipeline"
              className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← Pipeline
            </Link>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <h1 className="text-base font-semibold text-zinc-100 leading-tight">{opp.name}</h1>
              {opp.symbol && <span className="text-sm text-zinc-600">{opp.symbol}</span>}
              <SourceBadge source={opp.source} />
              <OpportunityStatusBadge status={opp.status} />
              {opp.asset_class && (
                <Badge
                  label={ASSET_CLASS_LABELS[opp.asset_class]}
                  color={ASSET_CLASS_COLORS[opp.asset_class]}
                />
              )}
            </div>
          </div>
          <Link
            href={`/opportunities/${id}/edit`}
            className="px-4 py-2 border border-[#303037] hover:border-zinc-500 text-sm text-zinc-300 hover:text-zinc-100 rounded-lg transition-colors"
          >
            Edit
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-4">
        {/* Detail Card */}
        <Card>
          <CardHeader label="Opportunity Detail" />
          <div className="p-5 space-y-4">
            {opp.raw_note && (
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1.5">
                  Raw Note
                </p>
                <pre className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed bg-[#1C1C21] rounded-lg p-4 font-sans">
                  {opp.raw_note}
                </pre>
              </div>
            )}

            {opp.parsed_thesis && (
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1.5">
                  Parsed Thesis
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed">{opp.parsed_thesis}</p>
              </div>
            )}

            {!opp.raw_note && !opp.parsed_thesis && (
              <p className="text-sm text-zinc-600">No notes added yet.</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-[#26262B]">
              <div>
                <p className="text-[11px] text-zinc-600 mb-0.5">Source</p>
                <SourceBadge source={opp.source} />
              </div>
              <div>
                <p className="text-[11px] text-zinc-600 mb-0.5">Status</p>
                <OpportunityStatusBadge status={opp.status} />
              </div>
              <div>
                <p className="text-[11px] text-zinc-600 mb-0.5">Added</p>
                <p className="text-xs text-zinc-400">{formatDate(opp.created_at)}</p>
              </div>
              <div>
                <p className="text-[11px] text-zinc-600 mb-0.5">Updated</p>
                <p className="text-xs text-zinc-400">{formatDate(opp.updated_at)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Panel */}
        {isActive && (
          <Card>
            <CardHeader label="Actions" />
            <div className="p-5 flex flex-wrap gap-3">
              {opp.status === 'new' && (
                <form action={markReviewing}>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium rounded-lg border border-amber-500/20 transition-colors"
                  >
                    Mark Reviewing
                  </button>
                </form>
              )}

              {opp.watchlist_id == null && (
                <form action={addToWatchlist}>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-medium rounded-lg border border-indigo-500/20 transition-colors"
                  >
                    + Add to Watchlist
                  </button>
                </form>
              )}

              {opp.watchlist_id != null && (
                <Link
                  href="/watchlist"
                  className="px-4 py-2 bg-indigo-500/10 text-indigo-400 text-sm font-medium rounded-lg border border-indigo-500/20"
                >
                  View on Watchlist →
                </Link>
              )}

              <form action={promoteToHolding}>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg border border-emerald-500/20 transition-colors"
                >
                  Promote to Holding →
                </button>
              </form>

              <form action={markRejected}>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg border border-red-500/20 transition-colors"
                >
                  Reject
                </button>
              </form>

              <Link
                href={`/decisions/new?title=${encodeURIComponent(opp.name)}&type=buy`}
                className="px-4 py-2 bg-zinc-700/30 hover:bg-zinc-700/50 text-zinc-300 text-sm font-medium rounded-lg border border-zinc-600/30 transition-colors"
              >
                Log Decision →
              </Link>
            </div>
          </Card>
        )}

        {opp.status === 'promoted' && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-5 py-4">
            <p className="text-sm text-emerald-400">
              This opportunity was promoted to Holdings.{' '}
              <Link href="/holdings" className="underline hover:text-emerald-300">
                View Holdings →
              </Link>
            </p>
          </div>
        )}

        {opp.status === 'rejected' && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-5 py-4">
            <p className="text-sm text-red-400">This opportunity was rejected.</p>
          </div>
        )}

        <NotesCard
          notes={notes}
          addHref={`/opportunities/${id}/notes/new`}
          title="Research Notes"
        />
      </main>
    </div>
  );
}
