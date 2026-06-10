import { HoldingsTable } from '@/components/holdings/HoldingsTable';
import { DEFAULT_USD_VND_RATE } from '@/lib/fx';
import type { Asset } from '@/db/schema';

interface ArchivedSectionProps {
  assets: Asset[];
  label?: string;
  usdVndRate?: number;
}

export function ArchivedSection({
  assets,
  label = 'Archived Assets',
  usdVndRate = DEFAULT_USD_VND_RATE,
}: ArchivedSectionProps) {
  if (assets.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">
          {label}
        </p>
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-500">
          {assets.length}
        </span>
      </div>
      <div className="opacity-60">
        <HoldingsTable assets={assets} totalNetWorth={0} usdVndRate={usdVndRate} />
      </div>
    </section>
  );
}
