import Link from 'next/link';
import { db } from '@/db';
import { decisionLogs } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import {
  formatDate,
  ASSET_CLASS_LABELS,
  ASSET_CLASS_COLORS,
  DECISION_TYPE_LABELS,
  DECISION_TYPE_COLORS,
  PURPOSE_LABELS,
  PURPOSE_COLORS,

} from '@/lib/formatters';
import type { AssetPurpose, AssetClass } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function DecisionsPage() {
  const decisions = await db
    .select()
    .from(decisionLogs)
    .orderBy(desc(decisionLogs.decision_date))
    .limit(200);

  const total = decisions.length;
  const open = decisions.filter((d) => !d.is_reviewed).length;
  const reviewed = decisions.filter((d) => d.is_reviewed).length;

  // Win rate = positive outcome decisions / reviewed (we check is_reviewed flag)
  // Simplified: count decisions where the last review outcome was positive
  // We'll approximate by joining reviews — for now we track at the KPI level
  // using the is_reviewed count as "reviewed", win rate requires join
  const winRate = reviewed > 0 ? Math.round((reviewed / total) * 100) : null;

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">TNPA</p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight">Decision Journal</h1>
          </div>
          <Link
            href="/decisions/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Log Decision
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Total</p>
            <p className="text-2xl font-bold tabular-nums text-zinc-100 mt-1.5">{total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Open</p>
            <p className="text-2xl font-bold tabular-nums mt-1.5" style={{ color: open > 0 ? '#FBBF24' : '#52525B' }}>{open}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Reviewed</p>
            <p className="text-2xl font-bold tabular-nums text-emerald-400 mt-1.5">{reviewed}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Review Rate</p>
            <p className="text-2xl font-bold tabular-nums mt-1.5" style={{ color: winRate != null ? '#818CF8' : '#52525B' }}>
              {winRate != null ? `${winRate}%` : '—'}
            </p>
            <p className="text-[10px] text-zinc-700 mt-0.5">of decisions reviewed</p>
          </Card>
        </div>

        {/* Decision List */}
        <Card>
          <CardHeader
            label={`All Decisions · ${total}`}
            action={
              <Link href="/decisions/new" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                + New →
              </Link>
            }
          />
          {decisions.length > 0 ? (
            <div className="divide-y divide-[#1C1C21]">
              {decisions.map((d) => {
                const typeColor = DECISION_TYPE_COLORS[d.decision_type] ?? '#9CA3AF';
                const typeLabel = DECISION_TYPE_LABELS[d.decision_type] ?? d.decision_type;
                const displayTitle = d.title ?? d.asset_name;
                const purposeColor = d.purpose ? (PURPOSE_COLORS[d.purpose as AssetPurpose] ?? '#9CA3AF') : null;

                return (
                  <Link
                    key={d.id}
                    href={`/decisions/${d.id}`}
                    className="flex items-start gap-3 px-5 py-4 hover:bg-[#131316] transition-colors group"
                  >
                    <div
                      className="flex-shrink-0 mt-0.5 w-10 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                    >
                      {typeLabel.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors">
                          {displayTitle}
                        </span>
                        {d.asset_class && (
                          <Badge
                            label={ASSET_CLASS_LABELS[d.asset_class as AssetClass]}
                            color={ASSET_CLASS_COLORS[d.asset_class as AssetClass]}
                          />
                        )}
                        {d.purpose && purposeColor && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ color: purposeColor, backgroundColor: `${purposeColor}15` }}
                          >
                            {PURPOSE_LABELS[d.purpose as AssetPurpose] ?? d.purpose}
                          </span>
                        )}
                        {d.is_reviewed && (
                          <span className="text-[10px] text-emerald-600 font-semibold">Reviewed</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed line-clamp-1">{d.rationale}</p>
                      {d.confidence != null && (
                        <p className="text-[10px] text-zinc-700 mt-0.5">Confidence: {d.confidence}/10</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right space-y-0.5">
                      <p className="text-[11px] text-zinc-600 tabular-nums">{formatDate(d.decision_date)}</p>
                      {d.expected_return && (
                        <p className="text-[10px] text-emerald-600">{d.expected_return}</p>
                      )}
                    </div>
                  </Link>
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
