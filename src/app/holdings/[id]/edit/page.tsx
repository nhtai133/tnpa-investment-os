import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateAsset, archiveAsset } from '@/app/holdings/actions';
import { AssetForm } from '@/components/holdings/AssetForm';
import { ArchiveAssetForm } from '@/components/holdings/ArchiveAssetForm';

export const dynamic = 'force-dynamic';

interface EditAssetPageProps {
  params: { id: string };
}

export default async function EditAssetPage({ params }: EditAssetPageProps) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const asset = await db
    .select()
    .from(assets)
    .where(eq(assets.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!asset) notFound();

  const boundUpdate = updateAsset.bind(null, asset.id);
  const boundArchive = archiveAsset.bind(null, asset.id);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href={`/holdings/${asset.id}`}
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← {asset.name}
          </Link>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Edit Asset
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl space-y-4">
          {asset.purpose === 'retirement' && (
            <div className="rounded-lg border border-orange-900/40 bg-orange-950/20 px-4 py-3">
              <p className="text-xs font-semibold text-orange-400 mb-1">Retirement Asset</p>
              <p className="text-[11px] text-orange-700 leading-relaxed">
                This asset is tagged as Retirement. Review carefully before selling or archiving.
              </p>
            </div>
          )}
          <div className="bg-[#131316] border border-[#26262B] rounded-xl p-6">
            <AssetForm action={boundUpdate} defaultValues={asset} />
            {!asset.is_archived && (
              <ArchiveAssetForm action={boundArchive} assetName={asset.name} />
            )}
            {asset.is_archived && (
              <div className="mt-8 pt-6 border-t border-[#26262B]">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">
                  Archive
                </p>
                <p className="text-xs text-amber-500/70">
                  This asset is archived and excluded from portfolio totals.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
