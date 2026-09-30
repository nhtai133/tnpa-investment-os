'use client';
import { tr } from '@/i18n';


import Link from 'next/link';
import { NAV_GROUPS } from '@/lib/nav';
import { useActiveNav } from './useActiveNav';

function NavGroup({ label, links, isActive }: {
  label: string;
  links: { label: string; href: string }[];
  isActive: (href: string) => boolean;
}) {
  return (
    <>
      <div className="pt-5 pb-1 px-3">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700">
          {tr(label)}
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
            {tr(lbl)}
          </Link>
        ))}
      </div>
    </>
  );
}

export function Sidebar() {
  const isActive = useActiveNav();

  return (
    <aside className="hidden md:flex w-52 flex-shrink-0 border-r border-[#26262B] flex-col h-full bg-[#0C0C0E]">
      <div className="px-4 py-4 border-b border-[#26262B]">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">{tr("TNPA")}</p>
        <p className="text-sm font-semibold text-zinc-200 mt-0.5">TNPA Wealth OS</p>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <NavGroup key={group.label} label={group.label} links={group.links} isActive={isActive} />
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-[#26262B]">
        <p className="text-[10px] text-zinc-700">v2.1.5.1 · Nội bộ</p>
      </div>
    </aside>
  );
}
