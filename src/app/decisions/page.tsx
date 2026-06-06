import Link from 'next/link';
import { db } from '@/db';
import { decisionLogs } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import {
  formatDate,
  formatCurrency,
  ASSET_CLASS_LABELS,
  ASSET_CLASS_COLORS,
  DECISION_TYPE_LABELS,
  DECISION_TYPE_COLORS,
} from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function DecisionsPage() {
  const decisions = await db
    .select()
    .from(decisionLogs)
    .orderBy(desc(decisionLogs.decision_date))
    .limit(100);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/journal"
              className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← Journal
            </Link>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight">Decision Log</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-600">{decisions.length} decisions</span>
            <Link
              href="/decisions/new"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Log Decision
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <Card>
          <CardHeader label={`All Decisions · ${decisions.length}`} />
          {decisions.length > 0 ? (
            <div className="divide-y divide-[#1C1C21]">
              {decisions.map((d) => {
                const typeColor = DECISION_TYPE_COLORS[d.decision_type] ?? '#9CA3AF';
                const typeLabel = DECISION_TYPE_LABELS[d.decision_type] ?? d.decision_type;
                return (
                  <div key={d.id} className="px-5 py-4">
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
                            href={d.asset_id ? `/holdings/${d.asset_id}` : '#'}
                            className="text-sm font-medium text-zinc-100 hover:text-zinc-300 transition-colors"
                          >
                            {d.asset_name}
                          </Link>
                          {d.asset_class && (
                            <Badge
                              label={ASSET_CLASS_LABELS[d.asset_class]}
                              color={ASSET_CLASS_COLORS[d.asset_class]}
                            />
                          )}
                          {d.amount != null && (
                            <span
                              className="text-xs tabular-nums"
                              style={{ color: d.amount >= 0 ? '#34D399' : '#F87171' }}
                            >
                              {d.amount >= 0 ? '+' : ''}
                              {formatCurrency(Math.abs(d.amount), true)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">
                          {d.rationale}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-[11px] text-zinc-700 tabular-nums">
                        {formatDate(d.decision_date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-16 text-center">
              <p className="text-sm text-zinc-700 mb-4">No decisions logged yet.</p>
              <Link
                href="/decisions/new"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Log First Decision
              </Link>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
