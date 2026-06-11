import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { decisionLogs, assets } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { Card, CardHeader } from '@/components/ui/Card';
import { DecisionForm } from '@/components/journal/DecisionForm';
import { updateDecision } from '@/app/decisions/actions';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function EditDecisionPage({ params }: Props) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const [decision, allAssets] = await Promise.all([
    db.select().from(decisionLogs).where(eq(decisionLogs.id, id)).limit(1).then((r) => r[0]),
    db.select().from(assets).where(eq(assets.is_archived, false)).orderBy(asc(assets.name)),
  ]);

  if (!decision) notFound();

  const action = updateDecision.bind(null, id);

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
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">Edit Decision</h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl">
          <Card>
            <CardHeader label="Edit Decision" />
            <div className="p-5">
              <DecisionForm
                action={action}
                assets={allAssets}
                preselectedAssetId={decision.asset_id ?? undefined}
                cancelHref={`/decisions/${id}`}
                submitLabel="Save Changes"
                defaultValues={{
                  title: decision.title,
                  decision_type: decision.decision_type,
                  decision_date: decision.decision_date,
                  next_review_date: decision.next_review_date,
                  review_cadence: decision.review_cadence,
                  rationale: decision.rationale,
                  purpose: decision.purpose,
                  expected_return: decision.expected_return,
                  time_horizon: decision.time_horizon,
                  risks: decision.risks,
                  invalidation_conditions: decision.invalidation_conditions,
                  confidence: decision.confidence,
                  extended_notes: decision.extended_notes,
                  amount: decision.amount,
                }}
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
