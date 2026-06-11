import Link from 'next/link';
import { db } from '@/db';
import { assets } from '@/db/schema';
import { createResearchNote } from '@/app/research/actions';
import { ResearchNoteForm } from '@/components/research/ResearchNoteForm';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function NewResearchNotePage() {
  const allAssets = await db.select().from(assets).orderBy();

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href="/research"
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← Research
          </Link>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Add Research Note
          </h1>
        </div>
      </header>
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl">
          <Card>
            <div className="p-6">
              <ResearchNoteForm
                action={createResearchNote}
                assets={allAssets}
                cancelHref="/research"
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
