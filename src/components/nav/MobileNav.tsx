'use client';
import { tr } from '@/i18n';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { MORE_PREFIXES, MOBILE_PRIMARY_LINKS } from '@/lib/nav';
import { useActiveNav } from './useActiveNav';

const ICONS: Record<string, ReactNode> = {
  '/': <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M2 11l8-8 8 8v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7z" /></svg>,
  '/banking': <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 2 1 7v2h18V7l-9-5ZM3 10v6H1v2h18v-2h-2v-6h-2v6h-3v-6h-2v6H7v-6H5v6H3v-6Z" /></svg>,
  '/pipeline': <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="m10 1 2.2 5.3L18 8l-5.8 1.7L10 15l-2.2-5.3L2 8l5.8-1.7L10 1Zm6 11 1.1 2.4L20 15l-2.9.6L16 18l-1.1-2.4L12 15l2.9-.6L16 12ZM4 13l1.1 2.4L8 16l-2.9.6L4 19l-1.1-2.4L0 16l2.9-.6L4 13Z" /></svg>,
  '/performance#performance': <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M2 16h16v2H2v-2Zm1-2 4-5 3 2 5-7 2 1-6 9-3-2-3 4-2-2Z" /></svg>,
};

const MORE_ICON = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

interface MobileNavProps {
  onMenuOpen: () => void;
}

export function MobileNav({ onMenuOpen }: MobileNavProps) {
  const isActive = useActiveNav();
  const isMoreActive = MORE_PREFIXES.some((prefix) => isActive(prefix));

  return (
    <nav aria-label={tr('Primary navigation')} className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0C0C0E] border-t border-[#26262B] pb-safe">
      <div className="flex items-stretch h-16">
        {MOBILE_PRIMARY_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
              isActive(item.href) ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {ICONS[item.href]}
            <span className="text-[10px] font-medium leading-none">{tr(item.label)}</span>
          </Link>
        ))}
        <button
          onClick={onMenuOpen}
          aria-label={tr('More')}
          aria-current={isMoreActive ? 'page' : undefined}
          className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
            isMoreActive ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          {MORE_ICON}
          <span className="text-[10px] font-medium leading-none">{tr('More')}</span>
        </button>
      </div>
    </nav>
  );
}
