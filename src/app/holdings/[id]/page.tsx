import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { assets, assetIntelligence, researchNotes, decisionLogs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { computeTotalNetWorth } from '@/lib/calculations';
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from '@/lib/formatters';
import { Badge } from '@/components/ui/Card';
import { PositionSummaryCard } from '@/components/holdings/PositionSummaryCard';
import { IntelligenceCard } from '@/components/holdings/IntelligenceCard';
import { NotesCard } from '@/components/journal/NotesCard';
import { DecisionLogCard } from '@/components/journal/DecisionLogCard';

export const dynamic = 'force-dynamic';

interface AssetDetailPageProps {
  params: { id: string };
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const [asset, allAssets, intel, notes, decisions] = await Promise.all([
    db.select().from(assets).where(eq(assets.id, id)).limit(1).then((r) => r[0]),
    db.select().from(assets),
    db.select().from(assetIntelligence).where(eq(assetIntelligence.asset_id, id)).limit(1).then((r) => r[0] ?? null),
    db.select().from(researchNotes).where(eq(researchNotes.asset_id, id)).orderBy(desc(researchNotes.created_at)).limit(5),
    db.select().from(decisionLogs).where(eq(decisionLogs.asset_id, id)).orderBy(desc(decisionLogs.decision_date)).limit(5),
  ]);

  if (!asset) notFound();

  const totalNW = computeTotalNetWorth(allAssets, 1);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <Link
                href="/holdings"
                className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
              >
                ← Holdings
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-base font-semibold text-zinc-100 leading-tight">
                  {asset.name}
                </h1>
                {asset.symbol && (
                  <span className="text-sm text-zinc-600">{asset.symbol}</span>
                )}
                <Badge
                  label={ASSET_CLASS_LABELS[asset.asset_class]}
                  color={ASSET_CLASS_COLORS[asset.asset_class]}
                />
              </div>
            </div>
          </div>
          <Link
            href={`/holdings/${asset.id}/edit`}
            className="px-4 py-2 border border-[#303037] hover:border-zinc-500 text-sm text-zinc-300 hover:text-zinc-100 rounded-lg transition-colors"
          >
            Edit
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-4">
        <PositionSummaryCard asset={asset} totalNetWorth={totalNW} />

        {intel ? (
          <IntelligenceCard intel={intel} assetId={asset.id} assetClass={asset.asset_class} />
        ) : (
          <div className="bg-[#131316] border border-[#26262B] border-dashed rounded-xl px-6 py-10 text-center">
            <p className="text-sm text-zinc-600 mb-3">No intelligence added for this asset yet.</p>
            <Link
              href={`/holdings/${asset.id}/intelligence/new`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Add Intelligence
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NotesCard
            notes={notes}
            addHref={`/holdings/${asset.id}/notes/new`}
            allHref={`/holdings/${asset.id}/notes`}
            title="Research Notes"
          />
          <DecisionLogCard
            decisions={decisions}
            addHref={`/decisions/new?asset_id=${asset.id}`}
            allHref="/decisions"
            title="Decision Log"
          />
        </div>
      </main>
    </div>
  );
}
