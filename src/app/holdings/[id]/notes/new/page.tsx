import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardHeader } from '@/components/ui/Card';
import { NoteForm } from '@/components/journal/NoteForm';
import { createResearchNote } from '@/app/journal/actions';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function NewHoldingNotePage({ params }: Props) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const asset = await db
    .select()
    .from(assets)
    .where(eq(assets.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!asset) notFound();

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href={`/holdings/${id}/notes`}
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← {asset.name} Notes
          </Link>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Add Note
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-lg">
          <Card>
            <CardHeader label={`New Note · ${asset.name}`} />
            <div className="p-5">
              <NoteForm
                action={createResearchNote}
                assetId={id}
                cancelHref={`/holdings/${id}/notes`}
                redirectTo={`/holdings/${id}/notes`}
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
