import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';

interface DecisionIntelligenceProps {
  total: number;
  open: number;
  reviewed: number;
  winRate: number | null;
  overdueCount: number;
}

export function DecisionIntelligence({
  total,
  open,
  reviewed,
  winRate,
  overdueCount,
}: DecisionIntelligenceProps) {
  const metrics = [
    {
      label: 'Open',
      value: open,
      color: open > 5 ? '#F87171' : open > 0 ? '#FBBF24' : '#52525B',
      href: '/decisions',
    },
    {
      label: 'Reviewed',
      value: reviewed,
      color: reviewed > 0 ? '#34D399' : '#52525B',
      href: '/decisions',
    },
    {
      label: 'Win Rate',
      value: winRate != null ? `${winRate}%` : '—',
      color: winRate != null ? (winRate >= 60 ? '#34D399' : winRate >= 40 ? '#FBBF24' : '#F87171') : '#52525B',
      href: '/decisions',
    },
    {
      label: 'Overdue',
      value: overdueCount,
      color: overdueCount > 0 ? '#F87171' : '#52525B',
      href: '/decisions',
    },
  ];

  return (
    <Card>
      <CardHeader
        label="Decisions"
        action={
          <Link href="/decisions/new" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            + Log →
          </Link>
        }
      />
      <div className="grid grid-cols-2 divide-x divide-y divide-[#26262B]">
        {metrics.map(({ label, value, color, href }) => (
          <Link
            key={label}
            href={href}
            className="p-4 hover:bg-[#1C1C21] transition-colors"
          >
            <p className="text-xl font-semibold tabular-nums" style={{ color }}>
              {value}
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">{label}</p>
          </Link>
        ))}
      </div>
      {total === 0 && (
        <div className="px-5 py-3 border-t border-[#26262B] text-center">
          <Link href="/decisions/new" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            Log your first decision →
          </Link>
        </div>
      )}
    </Card>
  );
}
