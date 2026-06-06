import Link from 'next/link';

interface Stat {
  label: string;
  value: number | string;
  href: string;
  accent?: string;
}

interface StatCountersProps {
  holdings: number;
  activeOpportunities: number;
  watchlistItems: number;
  totalNotes: number;
  recentDecisions: number;
  pendingReviews: number;
}

export function StatCounters({
  holdings,
  activeOpportunities,
  watchlistItems,
  totalNotes,
  recentDecisions,
  pendingReviews,
}: StatCountersProps) {
  const stats: Stat[] = [
    { label: 'Holdings', value: holdings, href: '/holdings', accent: '#818CF8' },
    { label: 'Active Opps', value: activeOpportunities, href: '/pipeline', accent: '#A78BFA' },
    { label: 'Watchlist', value: watchlistItems, href: '/watchlist', accent: '#F472B6' },
    { label: 'Notes', value: totalNotes, href: '/journal', accent: '#60A5FA' },
    { label: 'Decisions', value: recentDecisions, href: '/decisions', accent: '#34D399' },
    {
      label: 'Pending Reviews',
      value: pendingReviews,
      href: '/watchlist',
      accent: pendingReviews > 0 ? '#FBBF24' : '#4B5563',
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {stats.map(({ label, value, href, accent }) => (
        <Link
          key={label}
          href={href}
          className="bg-[#131316] border border-[#26262B] hover:border-zinc-600 rounded-xl px-4 py-3 transition-colors group"
        >
          <p
            className="text-2xl font-semibold tabular-nums leading-none"
            style={{ color: accent }}
          >
            {value}
          </p>
          <p className="text-[11px] text-zinc-600 mt-1.5 group-hover:text-zinc-500 transition-colors">
            {label}
          </p>
        </Link>
      ))}
    </div>
  );
}
