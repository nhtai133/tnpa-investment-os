import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';

interface PipelineSummaryProps {
  inbox: number;
  researching: number;
  watchlistCount: number;
  highConviction: number;
}

export function PipelineSummary({
  inbox,
  researching,
  watchlistCount,
  highConviction,
}: PipelineSummaryProps) {
  const stages = [
    {
      label: 'Inbox',
      value: inbox,
      description: 'New signals',
      color: '#818CF8',
      href: '/pipeline',
    },
    {
      label: 'Researching',
      value: researching,
      description: 'Under review',
      color: '#FBBF24',
      href: '/pipeline',
    },
    {
      label: 'Watchlist',
      value: watchlistCount,
      description: 'Active monitoring',
      color: '#F472B6',
      href: '/watchlist',
    },
    {
      label: 'High Conviction',
      value: highConviction,
      description: 'Ready to act',
      color: '#34D399',
      href: '/watchlist',
    },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader
        label="Opportunity Pipeline"
        action={
          <Link href="/pipeline" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            View all →
          </Link>
        }
      />
      <div className="grid grid-cols-2 divide-x divide-y divide-[#26262B] flex-1">
        {stages.map(({ label, value, description, color, href }) => (
          <Link
            key={label}
            href={href}
            className="p-4 hover:bg-[#1C1C21] transition-colors"
          >
            <p className="text-2xl font-light tabular-nums" style={{ color: value > 0 ? color : '#3F3F46' }}>
              {value}
            </p>
            <p className="text-xs font-medium text-zinc-300 mt-1">{label}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{description}</p>
          </Link>
        ))}
      </div>

      {inbox === 0 && researching === 0 && watchlistCount === 0 && (
        <div className="px-5 py-3 border-t border-[#26262B] text-center">
          <Link href="/pipeline" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Add opportunities to your pipeline →
          </Link>
        </div>
      )}
    </Card>
  );
}
