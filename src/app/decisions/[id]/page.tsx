import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { decisionLogs, decisionReviews, assets } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardHeader } from '@/components/ui/Card';
import {
  formatDate,
  DECISION_TYPE_LABELS,
  DECISION_TYPE_COLORS,
  DECISION_OUTCOME_LABELS,
  DECISION_OUTCOME_COLORS,
  PURPOSE_LABELS,
  PURPOSE_COLORS,
  ASSET_CLASS_LABELS,
  ASSET_CLASS_COLORS,
} from '@/lib/formatters';
import type { AssetPurpose, AssetClass } from '@/db/schema';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function DecisionDetailPage({ params }: Props) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const [decision, reviews] = await Promise.all([
    db.select().from(decisionLogs).where(eq(decisionLogs.id, id)).limit(1).then((r) => r[0]),
    db.select().from(decisionReviews).where(eq(decisionReviews.decision_id, id)).orderBy(desc(decisionReviews.review_date)),
  ]);

  if (!decision) notFound();

  const asset = decision.asset_id
    ? await db.select().from(assets).where(eq(assets.id, decision.asset_id)).limit(1).then((r) => r[0] ?? null)
    : null;

  const typeColor = DECISION_TYPE_COLORS[decision.decision_type] ?? '#9CA3AF';
  const typeLabel = DECISION_TYPE_LABELS[decision.decision_type] ?? decision.decision_type;

  const displayTitle = decision.title ?? decision.asset_name;

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-start justify-between">
          <div>
            <Link
              href="/decisions"
              className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← Decisions
            </Link>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span
                className="px-2 py-0.5 rounded text-[11px] font-bold uppercase"
                style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
              >
                {typeLabel}
              </span>
              <h1 className="text-base font-semibold text-zinc-100 leading-tight">{displayTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Link
              href={`/decisions/${id}/review`}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Add Review
            </Link>
            <Link
              href={`/decisions/${id}/edit`}
              className="px-4 py-2 border border-[#303037] hover:border-zinc-500 text-sm text-zinc-300 hover:text-zinc-100 rounded-lg transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-4">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Date</p>
            <p className="text-sm font-medium text-zinc-100 mt-1.5">{formatDate(decision.decision_date)}</p>
          </Card>
          {decision.confidence != null && (
            <Card className="p-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Confidence</p>
              <p className="text-xl font-bold tabular-nums text-zinc-100 mt-1.5">{decision.confidence}<span className="text-sm text-zinc-600">/10</span></p>
            </Card>
          )}
          {decision.expected_return && (
            <Card className="p-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Expected Return</p>
              <p className="text-sm font-medium text-emerald-400 mt-1.5">{decision.expected_return}</p>
            </Card>
          )}
          {decision.time_horizon && (
            <Card className="p-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Time Horizon</p>
              <p className="text-sm font-medium text-zinc-100 mt-1.5">{decision.time_horizon}</p>
            </Card>
          )}
          <Card className="p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Reviews</p>
            <p className="text-xl font-bold tabular-nums mt-1.5" style={{ color: reviews.length > 0 ? '#34D399' : '#52525B' }}>
              {reviews.length}
            </p>
          </Card>
        </div>

        {/* Detail */}
        <Card>
          <CardHeader label="Decision Detail" />
          <div className="p-5 space-y-5">

            {/* Asset + Purpose row */}
            {(asset || decision.purpose) && (
              <div className="flex flex-wrap gap-6">
                {asset && (
                  <div>
                    <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1">Asset</p>
                    <Link
                      href={`/holdings/${asset.id}`}
                      className="flex items-center gap-2 hover:text-indigo-400 transition-colors"
                    >
                      <span className="text-sm text-zinc-200">{asset.name}</span>
                      {asset.symbol && <span className="text-xs text-zinc-600 font-mono">{asset.symbol}</span>}
                      {asset.asset_class && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            color: ASSET_CLASS_COLORS[asset.asset_class as AssetClass],
                            backgroundColor: `${ASSET_CLASS_COLORS[asset.asset_class as AssetClass]}15`,
                          }}
                        >
                          {ASSET_CLASS_LABELS[asset.asset_class as AssetClass]}
                        </span>
                      )}
                    </Link>
                  </div>
                )}
                {decision.purpose && (
                  <div>
                    <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1">Purpose Bucket</p>
                    <Link
                      href={`/buckets/${decision.purpose}`}
                      className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: PURPOSE_COLORS[decision.purpose as AssetPurpose] ?? '#9CA3AF' }}
                      />
                      <span className="text-sm text-zinc-200">
                        {PURPOSE_LABELS[decision.purpose as AssetPurpose] ?? decision.purpose}
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Thesis */}
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1.5">Thesis</p>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{decision.rationale}</p>
            </div>

            {/* Risks */}
            {decision.risks && (
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1.5">Risks</p>
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{decision.risks}</p>
              </div>
            )}

            {/* Invalidation Conditions */}
            {decision.invalidation_conditions && (
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1.5">Invalidation Conditions</p>
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{decision.invalidation_conditions}</p>
              </div>
            )}

            {/* Notes */}
            {decision.extended_notes && (
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1.5">Notes</p>
                <p className="text-sm text-zinc-500 leading-relaxed whitespace-pre-wrap">{decision.extended_notes}</p>
              </div>
            )}

            {decision.amount != null && (
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1.5">Amount</p>
                <p className="text-sm font-medium tabular-nums" style={{ color: decision.amount >= 0 ? '#34D399' : '#F87171' }}>
                  {decision.amount >= 0 ? '+' : ''}{decision.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader
            label={`Reviews · ${reviews.length}`}
            action={
              <Link href={`/decisions/${id}/review`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                + Add Review
              </Link>
            }
          />
          {reviews.length > 0 ? (
            <div className="divide-y divide-[#1C1C21]">
              {reviews.map((r) => {
                const outcomeColor = DECISION_OUTCOME_COLORS[r.outcome] ?? '#9CA3AF';
                const outcomeLabel = DECISION_OUTCOME_LABELS[r.outcome] ?? r.outcome;
                return (
                  <div key={r.id} className="p-5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span
                        className="px-2.5 py-1 rounded text-[11px] font-bold uppercase"
                        style={{ backgroundColor: `${outcomeColor}20`, color: outcomeColor }}
                      >
                        {outcomeLabel}
                      </span>
                      <span className="text-[11px] text-zinc-600 tabular-nums">{formatDate(r.review_date)}</span>
                    </div>

                    {r.current_result && (
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-0.5">Current Result</p>
                        <p className="text-sm text-zinc-300">{r.current_result}</p>
                      </div>
                    )}

                    {r.thesis_still_valid != null && (
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-0.5">Thesis Still Valid?</p>
                        <p className={`text-sm font-medium ${r.thesis_still_valid ? 'text-emerald-400' : 'text-red-400'}`}>
                          {r.thesis_still_valid ? 'Yes' : 'No'}
                        </p>
                      </div>
                    )}

                    {r.lessons_learned && (
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-0.5">Lessons Learned</p>
                        <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{r.lessons_learned}</p>
                      </div>
                    )}

                    {r.next_action && (
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-0.5">Next Action</p>
                        <p className="text-sm text-indigo-400">{r.next_action}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-zinc-700 mb-3">No reviews yet. Come back to evaluate this decision.</p>
              <Link
                href={`/decisions/${id}/review`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Add First Review
              </Link>
            </div>
          )}
        </Card>

      </main>
    </div>
  );
}
