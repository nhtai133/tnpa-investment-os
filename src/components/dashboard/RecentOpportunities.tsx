import Link from 'next/link';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import { SourceBadge } from '@/components/opportunities/SourceBadge';
import { OpportunityStatusBadge } from '@/components/opportunities/StatusBadge';
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS, formatDate } from '@/lib/formatters';
import type { Opportunity } from '@/db/schema';

interface RecentOpportunitiesProps {
  opportunities: Opportunity[];
}

export function RecentOpportunities({ opportunities }: RecentOpportunitiesProps) {
  return (
    <Card>
      <CardHeader
        label="Recent Signals"
        action={
          <div className="flex items-center gap-3">
            {opportunities.length > 0 && (
              <Link href="/pipeline" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                All →
              </Link>
            )}
            <Link href="/intake" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              + Intake
            </Link>
          </div>
        }
      />
      {opportunities.length > 0 ? (
        <div className="divide-y divide-[#1C1C21]">
          {opportunities.map((opp) => (
            <Link
              key={opp.id}
              href={`/opportunities/${opp.id}`}
              className="block px-5 py-3.5 hover:bg-[#1C1C21] transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors">
                      {opp.name}
                    </span>
                    {opp.symbol && (
                      <span className="text-[11px] text-zinc-600">{opp.symbol}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <SourceBadge source={opp.source} />
                    <OpportunityStatusBadge status={opp.status} />
                    {opp.asset_class && (
                      <Badge
                        label={ASSET_CLASS_LABELS[opp.asset_class]}
                        color={ASSET_CLASS_COLORS[opp.asset_class]}
                      />
                    )}
                  </div>
                </div>
                <span className="flex-shrink-0 text-[11px] text-zinc-700 tabular-nums">
                  {formatDate(opp.created_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-zinc-700 mb-3">No signals yet.</p>
          <Link
            href="/intake"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Signal
          </Link>
        </div>
      )}
    </Card>
  );
}
