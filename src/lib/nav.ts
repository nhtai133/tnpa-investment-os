export interface NavLink {
  label: string;
  href: string;
}

export interface NavGroup {
  label: string;
  links: NavLink[];
}

export const NAV_GROUPS: NavGroup[] = [
  { label: 'Overview', links: [{ label: 'Dashboard', href: '/' }] },
  {
    label: 'Wealth',
    links: [
      { label: 'Banking', href: '/banking' },
      { label: 'Stocks', href: '/stocks' },
      { label: 'Crypto Portfolio', href: '/crypto' },
      { label: 'Gold', href: '/gold' },
      { label: 'Real Estate', href: '/real-estate' },
      { label: 'Funds & ETFs', href: '/funds' },
      { label: 'Private Loans', href: '/private-loans' },
    ],
  },
  {
    label: 'Investing',
    links: [
      { label: 'Opportunities', href: '/pipeline' },
      { label: 'Watchlist', href: '/watchlist' },
      { label: 'Research', href: '/research' },
      { label: 'Decisions', href: '/decisions' },
    ],
  },
  {
    label: 'Reports',
    links: [
      { label: 'Wealth Calendar', href: '/calendar' },
      { label: 'Performance', href: '/performance#performance' },
      { label: 'Asset Allocation', href: '/capital-allocation' },
      { label: 'Wealth History', href: '/performance#wealth-history' },
    ],
  },
  {
    label: 'System',
    links: [
      { label: 'Settings', href: '/settings' },
      { label: 'Health', href: '/system/health' },
    ],
  },
];

// The mobile bottom bar pins one destination for each frequently used area.
export const MOBILE_PRIMARY_LINKS: NavLink[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Banking', href: '/banking' },
  { label: 'Opportunities', href: '/pipeline' },
  { label: 'Performance', href: '/performance#performance' },
];

export const MORE_PREFIXES: string[] = NAV_GROUPS.flatMap((group) => group.links)
  .map(({ href }) => href)
  .filter((href) => href !== '/' && !MOBILE_PRIMARY_LINKS.some((item) => item.href === href));
