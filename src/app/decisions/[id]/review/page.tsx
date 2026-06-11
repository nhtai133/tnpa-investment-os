import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { decisionLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardHeader } from '@/components/ui/Card';
import { createDecisionReview } from '@/app/decisions/actions';
import { DECISION_TYPE_LABELS, DECISION_TYPE_COLORS } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

const inputClass =
  'w-full bg-[#1C1C21] border border-[#26262B] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-700 transition-colors';
const labelClass = 'block text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-1.5';

export default async function ReviewDecisionPage({ params }: Props) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const decision = await db.select().from(decisionLogs).where(eq(decisionLogs.id, id)).limit(1).then((r) => r[0]);
  if (!decision) notFound();

  const action = createDecisionReview.bind(null, id);
  const todayStr = new Date().toISOString().split('T')[0];
  const typeColor = DECISION_TYPE_COLORS[decision.decision_type] ?? '#9CA3AF';
  const typeLabel = DECISION_TYPE_LABELS[decision.decision_type] ?? decision.decision_type;
  const displayTitle = decision.title ?? decision.asset_name;

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href={`/decisions/${id}`}
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← Decision
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="px-2 py-0.5 rounded text-[11px] font-bold uppercase"
              style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
            >
              {typeLabel}
            </span>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight">{displayTitle}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl space-y-4">

          {/* Original thesis summary */}
          <div
            className="bg-[#131316] border border-[#26262B] rounded-xl p-4 border-l-2"
            style={{ borderLeftColor: typeColor }}
          >
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-1">Original Thesis</p>
            <p className="text-sm text-zinc-400 leading-relaxed line-clamp-4">{decision.rationale}</p>
            {decision.invalidation_conditions && (
              <div className="mt-2 pt-2 border-t border-[#26262B]">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-0.5">Invalidation Conditions</p>
                <p className="text-xs text-zinc-600 leading-relaxed">{decision.invalidation_conditions}</p>
              </div>
            )}
          </div>

          <Card>
            <CardHeader label="Review" />
            <div className="p-5">
              <form action={action} className="space-y-5">

                {/* Date + Outcome */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Review Date</label>
                    <input
                      type="date"
                      name="review_date"
                      defaultValue={todayStr}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Outcome</label>
                    <select name="outcome" required defaultValue="" className={`${inputClass} appearance-none cursor-pointer`}>
                      <option value="" disabled>Select outcome…</option>
                      <option value="positive">Positive</option>
                      <option value="neutral">Neutral</option>
                      <option value="negative">Negative</option>
                    </select>
                  </div>
                </div>

                {/* Current Result */}
                <div>
                  <label className={labelClass}>Current Result (optional)</label>
                  <input
                    type="text"
                    name="current_result"
                    placeholder="e.g. +32% unrealised, or exited at $X"
                    className={inputClass}
                  />
                </div>

                {/* Thesis Still Valid */}
                <div>
                  <label className={labelClass}>Thesis Still Valid?</label>
                  <select name="thesis_still_valid" defaultValue="" className={`${inputClass} appearance-none cursor-pointer`}>
                    <option value="">Not evaluated</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                {/* Lessons Learned */}
                <div>
                  <label className={labelClass}>Lessons Learned (optional)</label>
                  <textarea
                    name="lessons_learned"
                    rows={4}
                    placeholder="What did you learn from this decision? What would you do differently?"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Next Action */}
                <div>
                  <label className={labelClass}>Next Action (optional)</label>
                  <input
                    type="text"
                    name="next_action"
                    placeholder="e.g. Hold to target, trim 25%, re-review in Q3"
                    className={inputClass}
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Save Review
                  </button>
                  <Link href={`/decisions/${id}`} className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
