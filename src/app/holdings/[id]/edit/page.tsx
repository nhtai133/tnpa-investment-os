import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateAsset, deleteAsset } from '@/app/holdings/actions';
import { AssetForm } from '@/components/holdings/AssetForm';
import { DeleteAssetForm } from '@/components/holdings/DeleteAssetForm';

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
  const boundDelete = deleteAsset.bind(null, asset.id);

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
        <div className="max-w-2xl">
          <div className="bg-[#131316] border border-[#26262B] rounded-xl p-6">
            <AssetForm action={boundUpdate} defaultValues={asset} />
            <DeleteAssetForm action={boundDelete} assetName={asset.name} />
          </div>
        </div>
      </main>
    </div>
  );
}
