import { OPPORTUNITY_SOURCE_LABELS, OPPORTUNITY_SOURCE_COLORS } from '@/lib/formatters';
import type { OpportunitySource } from '@/db/schema';

export function SourceBadge({ source }: { source: OpportunitySource }) {
  const color = OPPORTUNITY_SOURCE_COLORS[source] ?? '#9CA3AF';
  const label = OPPORTUNITY_SOURCE_LABELS[source] ?? source;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  );
}
