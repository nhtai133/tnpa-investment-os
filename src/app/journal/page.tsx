import Link from 'next/link';
import { db } from '@/db';
import { researchNotes, decisionLogs, assets, opportunities } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import { NoteTypeBadge } from '@/components/journal/NoteTypeBadge';
import {
  formatDate,
  formatCurrency,
  ASSET_CLASS_LABELS,
  ASSET_CLASS_COLORS,
  DECISION_TYPE_LABELS,
  DECISION_TYPE_COLORS,
} from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function JournalPage() {
  const [notes, decisions, allAssets, allOpps] = await Promise.all([
    db.select().from(researchNotes).orderBy(desc(researchNotes.created_at)).limit(50),
    db.select().from(decisionLogs).orderBy(desc(decisionLogs.decision_date)).limit(50),
    db.select().from(assets),
    db.select().from(opportunities),
  ]);

  const assetMap = new Map(allAssets.map((a) => [a.id, a]));
  const oppMap = new Map(allOpps.map((o) => [o.id, o]));

  // Merge into unified timeline
  type Entry =
    | { kind: 'note'; date: string; data: typeof notes[0] }
    | { kind: 'decision'; date: string; data: typeof decisions[0] };

  const entries: Entry[] = [
    ...notes.map((n) => ({ kind: 'note' as const, date: n.created_at, data: n })),
    ...decisions.map((d) => ({ kind: 'decision' as const, date: d.decision_date, data: d })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">TNPA</p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight">Research & Decision Journal</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-600">{notes.length} notes · {decisions.length} decisions</span>
            <Link
              href="/notes/new"
              className="px-4 py-2 border border-[#303037] hover:border-zinc-500 text-sm text-zinc-300 hover:text-zinc-100 rounded-lg transition-colors"
            >
              + Note
            </Link>
            <Link
              href="/decisions/new"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Decision
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <Card>
          <CardHeader label={`Journal Feed · ${entries.length} entries`} />
          {entries.length > 0 ? (
            <div className="divide-y divide-[#1C1C21]">
              {entries.map((entry, i) => {
                if (entry.kind === 'note') {
                  const note = entry.data;
                  const asset = note.asset_id ? assetMap.get(note.asset_id) : null;
                  const opp = note.opportunity_id ? oppMap.get(note.opportunity_id) : null;
                  const entityName = asset?.name ?? opp?.name ?? 'Unknown';
                  const entityHref = asset
                    ? `/holdings/${asset.id}/notes`
                    : opp
                    ? `/opportunities/${opp.id}`
                    : '#';
                  return (
                    <div key={`note-${note.id}-${i}`} className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <NoteTypeBadge type={note.note_type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Link href={entityHref} className="text-sm font-medium text-zinc-100 hover:text-zinc-300 transition-colors">
                              {entityName}
                            </Link>
                            {asset?.asset_class && (
                              <Badge label={ASSET_CLASS_LABELS[asset.asset_class]} color={ASSET_CLASS_COLORS[asset.asset_class]} />
                            )}
                            {opp && <span className="text-[11px] text-indigo-500">Opportunity</span>}
                          </div>
                          <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                            {note.body}
                          </p>
                          {note.source_url && (
                            <a href={note.source_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-indigo-500 hover:text-indigo-400 mt-1 inline-block">
                              {note.source_label ?? note.source_url} ↗
                            </a>
                          )}
                        </div>
                        <span className="flex-shrink-0 text-[11px] text-zinc-700 tabular-nums">
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                }

                const decision = entry.data;
                const typeColor = DECISION_TYPE_COLORS[decision.decision_type] ?? '#9CA3AF';
                const typeLabel = DECISION_TYPE_LABELS[decision.decision_type] ?? decision.decision_type;
                return (
                  <div key={`dec-${decision.id}-${i}`} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex-shrink-0 mt-0.5 w-9 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                      >
                        {typeLabel.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Link
                            href={decision.asset_id ? `/holdings/${decision.asset_id}` : '#'}
                            className="text-sm font-medium text-zinc-100 hover:text-zinc-300 transition-colors"
                          >
                            {decision.asset_name}
                          </Link>
                          {decision.asset_class && (
                            <Badge label={ASSET_CLASS_LABELS[decision.asset_class]} color={ASSET_CLASS_COLORS[decision.asset_class]} />
                          )}
                          {decision.amount != null && (
                            <span className="text-xs tabular-nums" style={{ color: decision.amount >= 0 ? '#34D399' : '#F87171' }}>
                              {decision.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(decision.amount), true)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">{decision.rationale}</p>
                      </div>
                      <span className="flex-shrink-0 text-[11px] text-zinc-700 tabular-nums">
                        {formatDate(decision.decision_date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-16 text-center">
              <p className="text-sm text-zinc-700 mb-4">No journal entries yet.</p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/notes/new" className="px-4 py-2 border border-[#303037] hover:border-zinc-500 text-sm text-zinc-400 rounded-lg transition-colors">
                  + Add Note
                </Link>
                <Link href="/decisions/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
                  + Log Decision
                </Link>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
