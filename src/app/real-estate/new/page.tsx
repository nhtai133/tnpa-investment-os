import Link from 'next/link';
import { createRealEstateAsset } from '@/app/real-estate/actions';
import { WorkspaceAssetForm } from '@/components/workspace/WorkspaceAssetForm';
import { REAL_ESTATE_WORKSPACE_CONFIG } from '@/components/workspace/WorkspaceConfig';

export default function NewRealEstateAssetPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href="/real-estate"
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← Real Estate
          </Link>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Add Property
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl">
          <div className="bg-[#131316] border border-[#26262B] rounded-xl p-6">
            <WorkspaceAssetForm action={createRealEstateAsset} config={REAL_ESTATE_WORKSPACE_CONFIG} />
          </div>
        </div>
      </main>
    </div>
  );
}
