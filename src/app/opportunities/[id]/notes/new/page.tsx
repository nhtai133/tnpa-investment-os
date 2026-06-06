import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { opportunities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardHeader } from '@/components/ui/Card';
import { NoteForm } from '@/components/journal/NoteForm';
import { createResearchNote } from '@/app/journal/actions';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function NewOpportunityNotePage({ params }: Props) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const opp = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!opp) notFound();

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
            Add Research Note
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-lg">
          <Card>
            <CardHeader label={`New Note · ${opp.name}`} />
            <div className="p-5">
              <NoteForm
                action={createResearchNote}
                opportunityId={id}
                cancelHref={`/opportunities/${id}`}
                redirectTo={`/opportunities/${id}`}
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
