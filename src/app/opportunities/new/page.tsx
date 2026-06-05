import Link from 'next/link';
import { createOpportunity } from '@/app/opportunities/actions';
import { OpportunityForm } from '@/components/opportunities/OpportunityForm';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default function NewOpportunityPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href="/pipeline"
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← Pipeline
          </Link>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Add Opportunity
          </h1>
        </div>
      </header>
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl">
          <Card>
            <div className="p-6">
              <OpportunityForm action={createOpportunity} cancelHref="/pipeline" />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
