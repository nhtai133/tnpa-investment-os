import Link from 'next/link';
import { ASSET_CLASS_COLORS } from '@/lib/formatters';

interface NavCard {
  title: string;
  description: string;
  cta: string;
  href: string;
  color: string;
}

const CARDS: NavCard[] = [
  {
    title: 'Holdings Registry',
    description: 'Manage all investment assets and holdings.',
    cta: 'Open Holdings',
    href: '/holdings',
    color: '#818CF8',
  },
  {
    title: 'Intake',
    description: 'Paste raw signals to create opportunities.',
    cta: 'Open Intake',
    href: '/intake',
    color: '#34D399',
  },
  {
    title: 'Pipeline',
    description: 'Opportunity intake and research pipeline.',
    cta: 'Open Pipeline',
    href: '/pipeline',
    color: '#A78BFA',
  },
  {
    title: 'Watchlist',
    description: 'Assets under active monitoring.',
    cta: 'Open Watchlist',
    href: '/watchlist',
    color: '#F472B6',
  },
  {
    title: 'Journal',
    description: 'Research notes and decision log.',
    cta: 'Open Journal',
    href: '/journal',
    color: '#818CF8',
  },
  {
    title: 'Stocks',
    description: 'Equities and individual stock positions.',
    cta: 'Open Stocks',
    href: '/stocks',
    color: ASSET_CLASS_COLORS.stock,
  },
  {
    title: 'Crypto',
    description: 'Digital assets and on-chain positions.',
    cta: 'Open Crypto',
    href: '/crypto',
    color: ASSET_CLASS_COLORS.crypto,
  },
  {
    title: 'Real Estate',
    description: 'Property holdings and real estate assets.',
    cta: 'Open Real Estate',
    href: '/real-estate',
    color: ASSET_CLASS_COLORS.real_estate,
  },
  {
    title: 'Gold',
    description: 'Physical gold and precious metal positions.',
    cta: 'Open Gold',
    href: '/gold',
    color: ASSET_CLASS_COLORS.gold,
  },
  {
    title: 'Cash & Funds',
    description: 'Cash reserves, savings, and fund holdings.',
    cta: 'Open Cash & Funds',
    href: '/cash-funds',
    color: ASSET_CLASS_COLORS.cash,
  },
  {
    title: 'Private Loans',
    description: 'Private lending positions and loan assets.',
    cta: 'Open Private Loans',
    href: '/private-loans',
    color: ASSET_CLASS_COLORS.private_loan,
  },
];

export function QuickNav() {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">
        Quick Access
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {CARDS.map(({ title, description, cta, href, color }) => (
          <Link
            key={href}
            href={href}
            className="group bg-[#131316] border border-[#26262B] hover:border-zinc-600 rounded-xl p-4 transition-colors"
          >
            <div
              className="w-5 h-1 rounded-full mb-3"
              style={{ backgroundColor: color }}
            />
            <p className="text-sm font-medium text-zinc-100 leading-tight">{title}</p>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{description}</p>
            <p className="text-xs text-zinc-600 group-hover:text-zinc-300 mt-3 transition-colors">
              {cta} →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
