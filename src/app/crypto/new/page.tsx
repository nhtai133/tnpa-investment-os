import Link from 'next/link';
import { createCryptoAsset } from '@/app/crypto/actions';
import { WorkspaceAssetForm } from '@/components/workspace/WorkspaceAssetForm';
import { CRYPTO_WORKSPACE_CONFIG } from '@/components/workspace/WorkspaceConfig';

export default function NewCryptoAssetPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href="/crypto"
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← Crypto Portfolio
          </Link>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Add Crypto Asset
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 mb-5">
            <p className="text-sm font-medium text-amber-200">
              Never enter seed phrase, private key, or recovery phrase. TNPA Investment OS tracks
              balances only — public addresses belong in the Wallet Registry.
            </p>
          </div>

          <div className="bg-[#131316] border border-[#26262B] rounded-xl p-6">
            <WorkspaceAssetForm action={createCryptoAsset} config={CRYPTO_WORKSPACE_CONFIG} />
          </div>
        </div>
      </main>
    </div>
  );
}
