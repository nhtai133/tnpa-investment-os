'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function useActiveNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState('');

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener('hashchange', updateHash);
    window.addEventListener('popstate', updateHash);
    return () => {
      window.removeEventListener('hashchange', updateHash);
      window.removeEventListener('popstate', updateHash);
    };
  }, [pathname]);

  return useCallback((href: string) => {
    const [rawRoute, anchor] = href.split('#');
    const route = rawRoute.replace(/\/+$/, '') || '/';
    const routeMatches = route === '/'
      ? pathname === '/'
      : pathname === route || pathname.startsWith(`${route}/`);
    if (!routeMatches) return false;
    if (anchor === 'performance') return pathname === route && (!hash || hash === '#performance');
    if (anchor === 'wealth-history') return pathname === route
      ? hash === '#wealth-history'
      : pathname.startsWith(`${route}/`);
    return anchor ? pathname === route && hash === `#${anchor}` : true;
  }, [hash, pathname]);
}
