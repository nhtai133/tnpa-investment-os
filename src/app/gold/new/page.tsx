import { tr } from '@/i18n';
import Link from 'next/link';
import { ExistingGoldForm } from '@/components/workspace/ExistingGoldForm';
import { getAppSetting } from '@/lib/settings';

export default async function NewGoldAssetPage() {
  const openingDate = await getAppSetting('wealth_tracking_start_date') ?? new Date().toISOString().slice(0, 10);
  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href="/gold"
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            {tr("← Gold")}</Link>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            {tr("Add existing gold")}</h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-2xl">
          <ExistingGoldForm openingDate={openingDate} />
        </div>
      </main>
    </div>
  );
}
