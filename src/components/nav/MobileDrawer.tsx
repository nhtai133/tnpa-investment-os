'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { NAV_GROUPS } from '@/lib/nav';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`md:hidden fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0C0C0E] border-r border-[#26262B] flex flex-col transform transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#26262B] flex-shrink-0">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">TNPA</p>
            <p className="text-sm font-semibold text-zinc-200 mt-0.5">Wealth OS</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-[#1C1C21] transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Scrollable nav — pb-20 keeps content above bottom nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto pb-20">
          {/* Dashboard */}
          <div className="space-y-0.5">
            <Link
              href="/"
              onClick={onClose}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive('/')
                  ? 'bg-[#1C1C21] text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1C1C21]'
              }`}
            >
              Dashboard
            </Link>
          </div>

          {/* Nav groups */}
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="pt-5 pb-1 px-3">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700">
                  {group.label}
                </p>
              </div>
              <div className="space-y-0.5">
                {group.links.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive(href)
                        ? 'bg-[#1C1C21] text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1C1C21]'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
