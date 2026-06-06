import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { assets, researchNotes } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import { NoteTypeBadge } from '@/components/journal/NoteTypeBadge';
import { formatDate, ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function HoldingNotesPage({ params }: Props) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const [asset, notes] = await Promise.all([
    db.select().from(assets).where(eq(assets.id, id)).limit(1).then((r) => r[0]),
    db
      .select()
      .from(researchNotes)
      .where(eq(researchNotes.asset_id, id))
      .orderBy(desc(researchNotes.created_at)),
  ]);

  if (!asset) notFound();

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href={`/holdings/${id}`}
              className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← {asset.name}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-base font-semibold text-zinc-100 leading-tight">Research Notes</h1>
              <Badge
                label={ASSET_CLASS_LABELS[asset.asset_class]}
                color={ASSET_CLASS_COLORS[asset.asset_class]}
              />
            </div>
          </div>
          <Link
            href={`/holdings/${id}/notes/new`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Note
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <Card>
          <CardHeader label={`Notes · ${notes.length}`} />
          {notes.length > 0 ? (
            <div className="divide-y divide-[#1C1C21]">
              {notes.map((note) => (
                <div key={note.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <NoteTypeBadge type={note.note_type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {note.body}
                      </p>
                      {note.source_url && (
                        <a
                          href={note.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-500 hover:text-indigo-400 mt-1 inline-block"
                        >
                          {note.source_label ?? note.source_url} ↗
                        </a>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-[11px] text-zinc-700 tabular-nums">
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-16 text-center">
              <p className="text-sm text-zinc-700 mb-4">No notes for this holding yet.</p>
              <Link
                href={`/holdings/${id}/notes/new`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Add First Note
              </Link>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
