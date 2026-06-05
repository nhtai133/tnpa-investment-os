import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { opportunities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateOpportunity } from '@/app/opportunities/actions';
import { OpportunityForm } from '@/components/opportunities/OpportunityForm';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function EditOpportunityPage({ params }: Props) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const opp = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!opp) notFound();

  const action = updateOpportunity.bind(null, id);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href={`/opportunities/${id}`}
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← {opp.name}
          </Link>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Edit Opportunity
          </h1>
        </div>
      </header>
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl">
          <Card>
            <div className="p-6">
              <OpportunityForm
                action={action}
                defaultValues={opp}
                cancelHref={`/opportunities/${id}`}
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
