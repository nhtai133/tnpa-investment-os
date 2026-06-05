import Link from 'next/link';
import { db } from '@/db';
import { opportunities } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import { SourceBadge } from '@/components/opportunities/SourceBadge';
import { OpportunityStatusBadge } from '@/components/opportunities/StatusBadge';
import {
  ASSET_CLASS_LABELS,
  ASSET_CLASS_COLORS,
  formatDate,
} from '@/lib/formatters';
import type { Opportunity } from '@/db/schema';

export const dynamic = 'force-dynamic';

function OppRow({ opp }: { opp: Opportunity }) {
  return (
    <Link
      href={`/opportunities/${opp.id}`}
      className="flex items-start gap-4 px-5 py-4 hover:bg-[#1C1C21] transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-100">{opp.name}</span>
          {opp.symbol && <span className="text-xs text-zinc-600">{opp.symbol}</span>}
          {opp.asset_class && (
            <Badge
              label={ASSET_CLASS_LABELS[opp.asset_class]}
              color={ASSET_CLASS_COLORS[opp.asset_class]}
            />
          )}
          <SourceBadge source={opp.source} />
        </div>
        {opp.raw_note && (
          <p className="text-xs text-zinc-600 mt-1 line-clamp-2 leading-relaxed">
            {opp.raw_note}
          </p>
        )}
        {opp.parsed_thesis && !opp.raw_note && (
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed italic">
            {opp.parsed_thesis}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 text-right space-y-1">
        <OpportunityStatusBadge status={opp.status} />
        <p className="text-[11px] text-zinc-700">{formatDate(opp.created_at)}</p>
      </div>
    </Link>
  );
}

export default async function PipelinePage() {
  const all = await db.select().from(opportunities).orderBy(desc(opportunities.created_at));

  const active = all.filter((o) => o.status === 'new' || o.status === 'reviewing');
  const reviewing = active.filter((o) => o.status === 'reviewing');
  const newItems = active.filter((o) => o.status === 'new');
  const archived = all.filter((o) => o.status === 'promoted' || o.status === 'rejected');

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">TNPA</p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight">Opportunity Pipeline</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-[11px] text-zinc-600">
              <span>{newItems.length} new</span>
              <span>{reviewing.length} reviewing</span>
              <span>{archived.length} archived</span>
            </div>
            <Link
              href="/opportunities/new"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Add Opportunity
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">
        {/* Reviewing */}
        {reviewing.length > 0 && (
          <Card>
            <CardHeader label={`Reviewing · ${reviewing.length}`} />
            <div className="divide-y divide-[#1C1C21]">
              {reviewing.map((opp) => <OppRow key={opp.id} opp={opp} />)}
            </div>
          </Card>
        )}

        {/* New */}
        <Card>
          <CardHeader
            label={`New · ${newItems.length}`}
            action={
              <Link href="/opportunities/new" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                + Add →
              </Link>
            }
          />
          {newItems.length > 0 ? (
            <div className="divide-y divide-[#1C1C21]">
              {newItems.map((opp) => <OppRow key={opp.id} opp={opp} />)}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-zinc-700 mb-3">No opportunities yet.</p>
              <Link
                href="/opportunities/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Add Opportunity
              </Link>
            </div>
          )}
        </Card>

        {/* Archived */}
        {archived.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-700 mb-2 px-1">
              Archive · {archived.length}
            </p>
            <Card>
              <div className="divide-y divide-[#1C1C21]">
                {archived.map((opp) => <OppRow key={opp.id} opp={opp} />)}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
