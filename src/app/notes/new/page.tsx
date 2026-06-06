import { db } from '@/db';
import { assets, opportunities } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { Card, CardHeader } from '@/components/ui/Card';
import { NoteForm } from '@/components/journal/NoteForm';
import { createResearchNote } from '@/app/journal/actions';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { asset_id?: string; opportunity_id?: string };
}

export default async function NewNotePage({ searchParams }: Props) {
  const assetId = searchParams.asset_id ? Number(searchParams.asset_id) : undefined;
  const opportunityId = searchParams.opportunity_id ? Number(searchParams.opportunity_id) : undefined;

  let cancelHref = '/journal';
  if (assetId) cancelHref = `/holdings/${assetId}`;
  else if (opportunityId) cancelHref = `/opportunities/${opportunityId}`;

  // Only load selectors if no context is pre-selected
  const [allAssets, allOpps] = (!assetId && !opportunityId)
    ? await Promise.all([
        db.select().from(assets).orderBy(asc(assets.name)),
        db.select().from(opportunities).orderBy(asc(opportunities.name)),
      ])
    : [[], []];

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <a
            href={cancelHref}
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← {assetId ? 'Holding' : opportunityId ? 'Opportunity' : 'Journal'}
          </a>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Add Research Note
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-lg">
          <Card>
            <CardHeader label="New Note" />
            <div className="p-5 space-y-5">
              {/* Context selector — only shown when no asset/opp pre-selected */}
              {!assetId && !opportunityId && (allAssets.length > 0 || allOpps.length > 0) && (
                <div>
                  <label className="block text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-1.5">
                    Attach To (optional)
                  </label>
                  <div className="space-y-2">
                    {allAssets.length > 0 && (
                      <div className="text-xs text-zinc-600 uppercase tracking-widest mb-1">Holdings</div>
                    )}
                    {allAssets.map((a) => (
                      <a
                        key={a.id}
                        href={`/notes/new?asset_id=${a.id}`}
                        className="block px-3 py-2 bg-[#1C1C21] hover:bg-[#26262B] rounded-lg text-sm text-zinc-300 hover:text-zinc-100 transition-colors"
                      >
                        {a.name}{a.symbol ? ` (${a.symbol})` : ''}
                      </a>
                    ))}
                    {allOpps.length > 0 && (
                      <div className="text-xs text-zinc-600 uppercase tracking-widest mt-3 mb-1">Opportunities</div>
                    )}
                    {allOpps.map((o) => (
                      <a
                        key={o.id}
                        href={`/notes/new?opportunity_id=${o.id}`}
                        className="block px-3 py-2 bg-[#1C1C21] hover:bg-[#26262B] rounded-lg text-sm text-zinc-300 hover:text-zinc-100 transition-colors"
                      >
                        {o.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <NoteForm
                action={createResearchNote}
                assetId={assetId}
                opportunityId={opportunityId}
                cancelHref={cancelHref}
                redirectTo={cancelHref}
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
