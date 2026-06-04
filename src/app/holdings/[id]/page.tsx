import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { computeTotalNetWorth } from '@/lib/calculations';
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from '@/lib/formatters';
import { Badge } from '@/components/ui/Card';
import { PositionSummaryCard } from '@/components/holdings/PositionSummaryCard';

export const dynamic = 'force-dynamic';

interface AssetDetailPageProps {
  params: { id: string };
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const [asset, allAssets] = await Promise.all([
    db.select().from(assets).where(eq(assets.id, id)).limit(1).then((r) => r[0]),
    db.select().from(assets),
  ]);

  if (!asset) notFound();

  const totalNW = computeTotalNetWorth(allAssets);

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

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <PositionSummaryCard asset={asset} totalNetWorth={totalNW} />
      </main>
    </div>
  );
}
