import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { NoteTypeBadge } from '@/components/journal/NoteTypeBadge';
import { formatDate } from '@/lib/formatters';
import type { ResearchNote } from '@/db/schema';

interface NotesCardProps {
  notes: ResearchNote[];
  addHref: string;
  allHref?: string;
  title?: string;
}

export function NotesCard({ notes, addHref, allHref, title = 'Research Notes' }: NotesCardProps) {
  return (
    <Card>
      <CardHeader
        label={title}
        action={
          <div className="flex items-center gap-3">
            {allHref && notes.length > 0 && (
              <Link href={allHref} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                All →
              </Link>
            )}
            <Link href={addHref} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              + Add Note
            </Link>
          </div>
        }
      />
      {notes.length > 0 ? (
        <div className="divide-y divide-[#1C1C21]">
          {notes.slice(0, 5).map((note) => (
            <div key={note.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <NoteTypeBadge type={note.note_type} />
                    <span className="text-[11px] text-zinc-600">{formatDate(note.created_at)}</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                    {note.body}
                  </p>
                  {note.source_url && (
                    <a
                      href={note.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-500 hover:text-indigo-400 mt-1 inline-block transition-colors"
                    >
                      {note.source_label ?? note.source_url} ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-zinc-700 mb-3">No research notes yet.</p>
          <Link
            href={addHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Note
          </Link>
        </div>
      )}
    </Card>
  );
}
