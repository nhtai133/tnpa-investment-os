import { db } from '@/db';
import { assets } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { Card, CardHeader } from '@/components/ui/Card';
import { DecisionForm } from '@/components/journal/DecisionForm';
import { createDecisionLog } from '@/app/journal/actions';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { asset_id?: string; type?: string };
}

export default async function NewDecisionPage({ searchParams }: Props) {
  const allAssets = await db.select().from(assets).orderBy(asc(assets.name));

  const preselectedAssetId = searchParams.asset_id ? Number(searchParams.asset_id) : undefined;
  const preselectedType = searchParams.type;
  const cancelHref = preselectedAssetId ? `/holdings/${preselectedAssetId}` : '/decisions';

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <a
            href={cancelHref}
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← {preselectedAssetId ? 'Holding' : 'Decisions'}
          </a>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Log Decision
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-lg">
          <Card>
            <CardHeader label="New Decision" />
            <div className="p-5">
              <DecisionForm
                action={createDecisionLog}
                assets={preselectedAssetId ? undefined : allAssets}
                preselectedAssetId={preselectedAssetId}
                preselectedType={preselectedType}
                cancelHref={cancelHref}
                redirectTo={preselectedAssetId ? `/holdings/${preselectedAssetId}` : '/decisions'}
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
