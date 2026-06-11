export interface NavLink {
  label: string;
  href: string;
}

export interface NavGroup {
  label: string;
  links: NavLink[];
}

export const PORTFOLIO_LINKS: NavLink[] = [
  { label: 'Holdings', href: '/holdings' },
  { label: 'Buckets', href: '/buckets' },
  { label: 'Transactions', href: '/transactions' },
  { label: 'Rebalancing', href: '/rebalancing' },
  { label: 'Wealth Calendar', href: '/calendar' },
  { label: 'Performance', href: '/performance' },
];

export const RESEARCH_LINKS: NavLink[] = [
  { label: 'Research', href: '/research' },
  { label: 'Opportunities', href: '/pipeline' },
  { label: 'Watchlist', href: '/watchlist' },
  { label: 'Decisions', href: '/decisions' },
  { label: 'Journal', href: '/journal' },
];

export const MARKET_LINKS: NavLink[] = [
  { label: 'Stocks', href: '/stocks' },
  { label: 'Crypto Portfolio', href: '/crypto' },
  { label: 'Real Estate', href: '/real-estate' },
  { label: 'Gold', href: '/gold' },
  { label: 'Banking', href: '/banking' },
  { label: 'Funds & ETFs', href: '/funds' },
  { label: 'Private Loans', href: '/private-loans' },
];

export const SYSTEM_LINKS: NavLink[] = [
  { label: 'Settings', href: '/settings' },
  { label: 'Health', href: '/system/health' },
  { label: 'Production', href: '/system/production' },
];

export const NAV_GROUPS: NavGroup[] = [
  { label: 'Portfolio', links: PORTFOLIO_LINKS },
  { label: 'Research', links: RESEARCH_LINKS },
  { label: 'Markets', links: MARKET_LINKS },
  { label: 'System', links: SYSTEM_LINKS },
];

// All non-primary routes — used for "More" tab active detection in bottom nav
export const MORE_PREFIXES: string[] = [
  '/transactions', '/research', '/pipeline', '/watchlist',
  '/decisions', '/journal', '/stocks', '/crypto', '/real-estate',
  '/gold', '/banking', '/funds', '/private-loans', '/settings', '/system',
  '/calendar', '/performance',
];
