import Link from 'next/link';
import { createAsset } from '@/app/holdings/actions';
import { AssetForm } from '@/components/holdings/AssetForm';

export default function NewAssetPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/holdings"
              className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
            >
              ← Holdings
            </Link>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              Add Asset
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl">
          <div className="bg-[#131316] border border-[#26262B] rounded-xl p-6">
            <AssetForm action={createAsset} />
          </div>
        </div>
      </main>
    </div>
  );
}
