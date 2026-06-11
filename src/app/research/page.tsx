import Link from 'next/link';
import { db } from '@/db';
import { researchNotes, assets } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Card } from '@/components/ui/Card';
import { formatDate, ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from '@/lib/formatters';
import { archiveResearchNote, unarchiveResearchNote } from './actions';
import type { ResearchNote } from '@/db/schema';

export const dynamic = 'force-dynamic';

const CONVICTION_COLORS: Record<string, string> = {
  high: '#34D399',
  medium: '#FBBF24',
  low: '#6B7280',
};

const STATUS_COLORS: Record<string, string> = {
  draft: '#9CA3AF',
  active: '#818CF8',
  archived: '#3F3F46',
};

function ConvictionBadge({ conviction }: { conviction: string | null }) {
  if (!conviction) return null;
  const color = CONVICTION_COLORS[conviction] ?? '#6B7280';
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
      style={{ color, backgroundColor: `${color}15` }}
    >
      {conviction}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? 'active';
  const color = STATUS_COLORS[s] ?? '#818CF8';
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
      style={{ color, backgroundColor: `${color}15` }}
    >
      {label}
    </span>
  );
}

function NoteRow({
  note,
  assetMap,
}: {
  note: ResearchNote;
  assetMap: Map<number, { name: string; asset_class: string }>;
}) {
  const asset = note.asset_id ? assetMap.get(note.asset_id) : null;
  const isArchived = note.research_status === 'archived';
  const archive = archiveResearchNote.bind(null, note.id);
  const unarchive = unarchiveResearchNote.bind(null, note.id);
  const title = note.title ?? note.body?.slice(0, 60) ?? 'Untitled';

  return (
    <div className="flex items-start gap-3 px-5 py-4 border-b border-[#1A1A1F] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Link
            href={`/research/${note.id}`}
            className="text-sm font-medium text-zinc-100 hover:text-indigo-400 transition-colors"
          >
            {title}
          </Link>
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
          <ConvictionBadge conviction={note.conviction ?? null} />
          <StatusBadge status={note.research_status ?? null} />
        </div>

        {note.thesis && (
          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{note.thesis}</p>
        )}

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {asset && (
            <Link
              href={`/holdings/${note.asset_id}`}
              className="text-[11px] text-indigo-600 hover:text-indigo-400 transition-colors"
            >
              {asset.name} →
            </Link>
          )}
          <span className="text-[11px] text-zinc-700">{formatDate(note.created_at)}</span>
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center gap-2">
        <Link
          href={`/research/${note.id}`}
          className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Edit
        </Link>
        {!isArchived ? (
          <form action={archive}>
            <button
              type="submit"
              className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors"
            >
              Archive
            </button>
          </form>
        ) : (
          <form action={unarchive}>
            <button
              type="submit"
              className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors"
            >
              Restore
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default async function ResearchPage() {
  const [notes, allAssets] = await Promise.all([
    db.select().from(researchNotes).orderBy(desc(researchNotes.created_at)).limit(300),
    db.select().from(assets),
  ]);

  const assetMap = new Map(allAssets.map((a) => [a.id, { name: a.name, asset_class: a.asset_class }]));

  const active = notes.filter((n) => n.research_status !== 'archived');
  const archived = notes.filter((n) => n.research_status === 'archived');
  const highConviction = active.filter((n) => n.conviction === 'high');

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">
              Research
            </p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              Research Notes
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-600">
              {active.length} active · {highConviction.length} high conviction
            </span>
            <Link
              href="/research/new"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Add Research Note
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: notes.length, color: 'text-zinc-100' },
            { label: 'High Conviction', value: highConviction.length, color: 'text-emerald-400' },
            {
              label: 'Draft',
              value: active.filter((n) => n.research_status === 'draft').length,
              color: 'text-zinc-400',
            },
            { label: 'Archived', value: archived.length, color: 'text-zinc-600' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-4">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
                {label}
              </p>
              <p className={`text-xl font-bold mt-1.5 tabular-nums ${color}`}>{value}</p>
            </Card>
          ))}
        </div>

        {/* Active Notes */}
        <Card>
          <div className="px-5 pt-5 pb-4 border-b border-[#26262B] flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
              Active · {active.length}
            </span>
          </div>
          {active.length > 0 ? (
            <div>
              {active.map((note) => (
                <NoteRow key={note.id} note={note} assetMap={assetMap} />
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-zinc-700 mb-3">No research notes yet.</p>
              <Link
                href="/research/new"
                className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Add Research Note
              </Link>
            </div>
          )}
        </Card>

        {/* Archived */}
        {archived.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-700 mb-2 px-1">
              Archived · {archived.length}
            </p>
            <Card>
              {archived.map((note) => (
                <NoteRow key={note.id} note={note} assetMap={assetMap} />
              ))}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
