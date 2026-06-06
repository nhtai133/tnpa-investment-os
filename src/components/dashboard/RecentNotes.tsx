import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { NoteTypeBadge } from '@/components/journal/NoteTypeBadge';
import { formatDate } from '@/lib/formatters';
import type { ResearchNote } from '@/db/schema';

interface RecentNotesProps {
  notes: ResearchNote[];
}

export function RecentNotes({ notes }: RecentNotesProps) {
  return (
    <Card>
      <CardHeader
        label="Recent Notes"
        action={
          <div className="flex items-center gap-3">
            {notes.length > 0 && (
              <Link href="/journal" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                All →
              </Link>
            )}
            <Link href="/notes/new" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              + Note
            </Link>
          </div>
        }
      />
      {notes.length > 0 ? (
        <div className="divide-y divide-[#1C1C21]">
          {notes.map((note) => (
            <div key={note.id} className="px-5 py-3.5">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <NoteTypeBadge type={note.note_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 leading-relaxed line-clamp-2 whitespace-pre-wrap">
                    {note.body}
                  </p>
                </div>
                <span className="flex-shrink-0 text-[11px] text-zinc-700 tabular-nums">
                  {formatDate(note.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-zinc-700 mb-3">No research notes yet.</p>
          <Link
            href="/notes/new"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Note
          </Link>
        </div>
      )}
    </Card>
  );
}
