import { OPPORTUNITY_STATUS_LABELS, OPPORTUNITY_STATUS_COLORS } from '@/lib/formatters';
import type { OpportunityStatus } from '@/db/schema';

export function OpportunityStatusBadge({ status }: { status: OpportunityStatus }) {
  const color = OPPORTUNITY_STATUS_COLORS[status] ?? '#9CA3AF';
  const label = OPPORTUNITY_STATUS_LABELS[status] ?? status;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  );
}
