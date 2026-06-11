'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PORTFOLIO_LINKS = [
  { label: 'Holdings', href: '/holdings' },
  { label: 'Rebalancing', href: '/rebalancing' },
];

const RESEARCH_LINKS = [
  { label: 'Intake', href: '/intake' },
  { label: 'Pipeline', href: '/pipeline' },
  { label: 'Watchlist', href: '/watchlist' },
  { label: 'Journal', href: '/journal' },
];

const MARKET_LINKS = [
  { label: 'Stocks', href: '/stocks' },
  { label: 'Crypto Portfolio', href: '/crypto' },
  { label: 'Real Estate', href: '/real-estate' },
  { label: 'Gold', href: '/gold' },
  { label: 'Banking', href: '/banking' },
  { label: 'Funds & ETFs', href: '/funds' },
  { label: 'Private Loans', href: '/private-loans' },
];

function NavGroup({ label, links, isActive }: {
  label: string;
  links: { label: string; href: string }[];
  isActive: (href: string) => boolean;
}) {
  return (
    <>
      <div className="pt-5 pb-1 px-3">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700">
          {label}
        </p>
      </div>
      <div className="space-y-0.5">
        {links.map(({ label: lbl, href }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(href)
                ? 'bg-[#1C1C21] text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1C1C21]'
            }`}
          >
            {lbl}
          </Link>
        ))}
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <aside className="hidden md:flex w-52 flex-shrink-0 border-r border-[#26262B] flex-col h-full bg-[#0C0C0E]">
      <div className="px-4 py-4 border-b border-[#26262B]">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">TNPA</p>
        <p className="text-sm font-semibold text-zinc-200 mt-0.5">Investment OS</p>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {/* Command Center */}
        <div className="space-y-0.5">
          <Link
            href="/"
            className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive('/')
                ? 'bg-[#1C1C21] text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1C1C21]'
            }`}
          >
            Dashboard
          </Link>
        </div>

        <NavGroup label="Portfolio" links={PORTFOLIO_LINKS} isActive={isActive} />
        <NavGroup label="Research" links={RESEARCH_LINKS} isActive={isActive} />
        <NavGroup label="Markets" links={MARKET_LINKS} isActive={isActive} />

        <div className="pt-5 pb-1 px-3">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700">
            System
          </p>
        </div>
        <div className="space-y-0.5">
          <Link
            href="/settings"
            className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive('/settings')
                ? 'bg-[#1C1C21] text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1C1C21]'
            }`}
          >
            Settings
          </Link>
        </div>
      </nav>

      <div className="px-4 py-3 border-t border-[#26262B]">
        <p className="text-[10px] text-zinc-700">v1.0 · Personal Family Office</p>
      </div>
    </aside>
  );
}
