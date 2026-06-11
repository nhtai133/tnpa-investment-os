'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MORE_PREFIXES } from '@/lib/nav';

const PRIMARY_ITEMS = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M2 11l8-8 8 8v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7z" />
      </svg>
    ),
  },
  {
    label: 'Holdings',
    href: '/holdings',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
      </svg>
    ),
  },
  {
    label: 'Buckets',
    href: '/buckets',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm6-6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: 'Rebalancing',
    href: '/rebalancing',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
      </svg>
    ),
  },
];

const MORE_ICON = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);

interface MobileNavProps {
  onMenuOpen: () => void;
}

export function MobileNav({ onMenuOpen }: MobileNavProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  const isMoreActive = MORE_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0C0C0E] border-t border-[#26262B] pb-safe">
      <div className="flex items-stretch h-16">
        {PRIMARY_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
              isActive(item.href) ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </Link>
        ))}

        {/* More — opens drawer */}
        <button
          onClick={onMenuOpen}
          className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
            isMoreActive ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          {MORE_ICON}
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </div>
    </nav>
  );
}
