import Link from 'next/link';
import { createCashFundAsset } from '@/app/cash-funds/actions';
import { CashFundsAssetForm } from '@/components/workspace/CashFundsAssetForm';

export default function NewCashFundAssetPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href="/cash-funds"
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← Cash &amp; Funds
          </Link>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Add Cash / Fund Asset
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl">
          <div className="bg-[#131316] border border-[#26262B] rounded-xl p-6">
            <CashFundsAssetForm action={createCashFundAsset} />
          </div>
        </div>
      </main>
    </div>
  );
}
