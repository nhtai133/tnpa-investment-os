import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { assets, assetIntelligence } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateIntelligence } from '@/app/holdings/intelligence-actions';
import { IntelligenceForm } from '@/components/holdings/IntelligenceForm';
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from '@/lib/formatters';
import { Badge, Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function EditIntelligencePage({ params }: Props) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const [asset, intel] = await Promise.all([
    db.select().from(assets).where(eq(assets.id, id)).limit(1).then((r) => r[0]),
    db.select().from(assetIntelligence).where(eq(assetIntelligence.asset_id, id)).limit(1).then((r) => r[0]),
  ]);

  if (!asset) notFound();
  if (!intel) notFound();

  const action = updateIntelligence.bind(null, intel.id, id);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center gap-4">
          <div>
            <Link
              href={`/holdings/${id}`}
              className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← {asset.name}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-base font-semibold text-zinc-100 leading-tight">
                Edit Intelligence
              </h1>
              <Badge
                label={ASSET_CLASS_LABELS[asset.asset_class]}
                color={ASSET_CLASS_COLORS[asset.asset_class]}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <Card>
          <div className="p-6">
            <IntelligenceForm
              action={action}
              defaultValues={intel}
              assetClass={asset.asset_class}
              cancelHref={`/holdings/${id}`}
            />
          </div>
        </Card>
      </main>
    </div>
  );
}
