import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { researchNotes, assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateResearchNote, archiveResearchNote, unarchiveResearchNote } from '@/app/research/actions';
import { ResearchNoteForm } from '@/components/research/ResearchNoteForm';
import { Card } from '@/components/ui/Card';
import { formatDate, ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

const CONVICTION_COLORS: Record<string, string> = {
  high: '#34D399',
  medium: '#FBBF24',
  low: '#6B7280',
};

export default async function ResearchNoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  const [note, allAssets] = await Promise.all([
    db.select().from(researchNotes).where(eq(researchNotes.id, id)).limit(1).then((r) => r[0]),
    db.select().from(assets).orderBy(),
  ]);

  if (!note) notFound();

  const isArchived = note.research_status === 'archived';
  const updateAction = updateResearchNote.bind(null, id);
  const archive = archiveResearchNote.bind(null, id);
  const unarchive = unarchiveResearchNote.bind(null, id);
  const title = note.title ?? note.body?.slice(0, 60) ?? 'Untitled';

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-start justify-between">
          <div>
            <Link
              href="/research"
              className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← Research
            </Link>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              {title}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {note.symbol && (
                <span className="text-xs text-zinc-600 font-mono">{note.symbol}</span>
              )}
              {note.asset_class && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    color: ASSET_CLASS_COLORS[note.asset_class as keyof typeof ASSET_CLASS_COLORS],
                    backgroundColor: `${ASSET_CLASS_COLORS[note.asset_class as keyof typeof ASSET_CLASS_COLORS]}15`,
                  }}
                >
                  {ASSET_CLASS_LABELS[note.asset_class as keyof typeof ASSET_CLASS_LABELS]}
                </span>
              )}
              {note.conviction && (
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{
                    color: CONVICTION_COLORS[note.conviction] ?? '#6B7280',
                    backgroundColor: `${CONVICTION_COLORS[note.conviction] ?? '#6B7280'}15`,
                  }}
                >
                  {note.conviction}
                </span>
              )}
              <span className="text-[11px] text-zinc-700">{formatDate(note.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-shrink-0">
            {!isArchived ? (
              <form action={archive}>
                <button
                  type="submit"
                  className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors px-3 py-1.5 rounded border border-[#26262B] hover:border-zinc-600"
                >
                  Archive
                </button>
              </form>
            ) : (
              <form action={unarchive}>
                <button
                  type="submit"
                  className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors px-3 py-1.5 rounded border border-[#26262B] hover:border-zinc-600"
                >
                  Restore
                </button>
              </form>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl">
          <Card>
            <div className="p-6">
              <ResearchNoteForm
                action={updateAction}
                defaultValues={note}
                assets={allAssets}
                cancelHref="/research"
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
