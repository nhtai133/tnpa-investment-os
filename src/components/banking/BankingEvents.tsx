import Link from 'next/link';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import { formatDate, formatValue } from '@/lib/formatters';
import { formatDaysRemaining, type BankingEvent } from '@/lib/banking-events';

function statusColor(daysRemaining: number) {
  if (daysRemaining < 0) return '#F87171';
  if (daysRemaining <= 7) return '#FBBF24';
  if (daysRemaining <= 30) return '#FACC15';
  return '#34D399';
}

function daysLabel(event: BankingEvent) {
  const label = formatDaysRemaining(event.daysRemaining);
  if (event.daysRemaining < 0) return `${label}`;
  if (event.daysRemaining === 0) return 'Matures today';
  if (event.daysRemaining === 1) return 'Matures tomorrow';
  return `Matures in ${label}`;
}

export function BankingAlertsCard({ events }: { events: BankingEvent[] }) {
  const alerts = events.filter((event) => event.daysRemaining <= 30).slice(0, 6);

  return (
    <Card className="overflow-hidden">
      <CardHeader label="Banking Alerts" action={`${alerts.length} active`} />
      {alerts.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-zinc-600">No banking alerts in the next 30 days.</p>
        </div>
      ) : (
        <div>
          {alerts.map((event, index) => (
            <Link
              key={event.key}
              href={event.href}
              className={`block px-5 py-4 hover:bg-[#1C1C21] transition-colors ${index < alerts.length - 1 ? 'border-b border-[#26262B]' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300 text-sm">!</span>
                    <p className="text-sm font-medium text-zinc-100 truncate">{event.bankName} {event.name}</p>
                  </div>
                  <p className="mt-1 text-sm text-zinc-300 tabular-nums">{formatValue(event.amount, 'VND')}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{daysLabel(event)}</p>
                </div>
                <Badge label={event.maturityStatus} color={statusColor(event.daysRemaining)} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export function UpcomingBankingEvents({ events }: { events: BankingEvent[] }) {
  const upcoming = events.slice(0, 10);

  return (
    <Card className="overflow-hidden">
      <CardHeader label="Upcoming Banking Events" action={`${upcoming.length} events`} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#26262B]">
              {['Date', 'Event Type', 'Bank', 'Amount', 'Days Remaining'].map((heading) => (
                <th key={heading} className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {upcoming.map((event) => (
              <tr key={event.key} className="border-b border-[#1C1C21] hover:bg-[#1C1C21] transition-colors">
                <td className="px-4 py-3.5 text-zinc-300 tabular-nums">{formatDate(event.date)}</td>
                <td className="px-4 py-3.5 text-zinc-300">{event.eventType}</td>
                <td className="px-4 py-3.5">
                  <Link href={event.href} className="text-zinc-100 hover:text-indigo-300 transition-colors">
                    {event.bankName}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-zinc-100 tabular-nums">{formatValue(event.amount, 'VND')}</td>
                <td className="px-4 py-3.5">
                  <span style={{ color: statusColor(event.daysRemaining) }}>{formatDaysRemaining(event.daysRemaining)}</span>
                </td>
              </tr>
            ))}
            {upcoming.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-600">
                  No upcoming banking events.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
