'use client';

import Link from 'next/link';
import { MOBILE_PRIMARY_LINKS } from '@/lib/nav';
import { useActiveNav } from './useActiveNav';

export function NavLinks() {
  const isActive = useActiveNav();

  return (
    <div className="flex items-center gap-1">
      {MOBILE_PRIMARY_LINKS.map(({ label, href }) => {
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isActive(href)
                ? 'bg-[#1C1C21] text-zinc-100'
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
