import Link from 'next/link';
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

interface DecisionLogCardProps {
  decisions: DecisionLog[];
  addHref: string;
  allHref?: string;
  title?: string;
}

export function DecisionLogCard({ decisions, addHref, allHref, title = 'Decision Log' }: DecisionLogCardProps) {
  return (
    <Card>
      <CardHeader
        label={title}
        action={
          <div className="flex items-center gap-3">
            {allHref && decisions.length > 0 && (
              <Link href={allHref} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                All →
              </Link>
            )}
            <Link href={addHref} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              + Log Decision
            </Link>
          </div>
        }
      />
      {decisions.length > 0 ? (
        <div className="divide-y divide-[#1C1C21]">
          {decisions.slice(0, 5).map((d) => {
            const typeColor = DECISION_TYPE_COLORS[d.decision_type] ?? '#9CA3AF';
            const typeLabel = DECISION_TYPE_LABELS[d.decision_type] ?? d.decision_type;
            return (
              <div key={d.id} className="px-5 py-3.5">
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 w-9 h-6 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                    style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                  >
                    {typeLabel.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {d.asset_class && (
                        <Badge
                          label={ASSET_CLASS_LABELS[d.asset_class]}
                          color={ASSET_CLASS_COLORS[d.asset_class]}
                        />
                      )}
                      {d.amount != null && (
                        <span className="text-xs tabular-nums" style={{ color: d.amount >= 0 ? '#34D399' : '#F87171' }}>
                          {d.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(d.amount), true)}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-600">{formatDate(d.decision_date)}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed line-clamp-2">{d.rationale}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-zinc-700 mb-3">No decisions logged yet.</p>
          <Link
            href={addHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Log Decision
          </Link>
        </div>
      )}
    </Card>
  );
}
