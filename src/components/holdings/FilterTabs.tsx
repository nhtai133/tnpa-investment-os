import Link from 'next/link';
import { ASSET_CLASS_LABELS } from '@/lib/formatters';
import type { AssetClass } from '@/db/schema';

const TABS: { label: string; value: AssetClass | '' }[] = [
  { label: 'All', value: '' },
  { label: ASSET_CLASS_LABELS.stock, value: 'stock' },
  { label: ASSET_CLASS_LABELS.crypto, value: 'crypto' },
  { label: ASSET_CLASS_LABELS.real_estate, value: 'real_estate' },
  { label: ASSET_CLASS_LABELS.gold, value: 'gold' },
  { label: ASSET_CLASS_LABELS.cash, value: 'cash' },
  { label: ASSET_CLASS_LABELS.funds, value: 'funds' },
  { label: ASSET_CLASS_LABELS.private_loan, value: 'private_loan' },
  { label: ASSET_CLASS_LABELS.other, value: 'other' },
];

interface FilterTabsProps {
  activeClass: string | undefined;
}

export function FilterTabs({ activeClass }: FilterTabsProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {TABS.map(({ label, value }) => {
        const isActive = value === '' ? !activeClass : activeClass === value;
        return (
          <Link
            key={value || 'all'}
            href={value ? `/holdings?class=${value}` : '/holdings'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'bg-[#1C1C21] text-zinc-100 border border-[#303037]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
