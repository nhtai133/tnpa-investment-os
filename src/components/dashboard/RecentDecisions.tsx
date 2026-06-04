import { Card, CardHeader, Badge } from '@/components/ui/Card';
import {
  formatDate,
  formatCurrency,
  ASSET_CLASS_LABELS,
  ASSET_CLASS_COLORS,
  DECISION_TYPE_LABELS,
  DECISION_TYPE_COLORS,
} from '@/lib/formatters';
import type { DecisionLog } from '@/db/schema';

interface RecentDecisionsProps {
  decisions: DecisionLog[];
}

export function RecentDecisions({ decisions }: RecentDecisionsProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader label="Recent Decisions" action={`${decisions.length} entries`} />
      <div className="divide-y divide-[#1C1C21]">
        {decisions.map((decision) => {
          const typeColor = DECISION_TYPE_COLORS[decision.decision_type] ?? '#9CA3AF';
          const typeLabel = DECISION_TYPE_LABELS[decision.decision_type] ?? decision.decision_type;

          return (
            <div key={decision.id} className="px-5 py-4 hover:bg-[#1C1C21] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="mt-0.5 w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                    style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                  >
                    {typeLabel.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-100">
                        {decision.asset_name}
                      </span>
                      {decision.asset_class && (
                        <Badge
                          label={ASSET_CLASS_LABELS[decision.asset_class]}
                          color={ASSET_CLASS_COLORS[decision.asset_class]}
                        />
                      )}
                      {decision.amount != null && (
                        <span
                          className="text-xs tabular-nums"
                          style={{ color: decision.amount >= 0 ? '#34D399' : '#F87171' }}
                        >
                          {decision.amount >= 0 ? '+' : ''}
                          {formatCurrency(Math.abs(decision.amount), true)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">
                      {decision.rationale}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-600 flex-shrink-0 mt-0.5 tabular-nums">
                  {formatDate(decision.decision_date)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
