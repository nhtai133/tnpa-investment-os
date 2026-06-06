import Link from 'next/link';
import { db } from '@/db';
import { opportunities } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import { OpportunityStatusBadge } from '@/components/opportunities/StatusBadge';
import { SourceBadge } from '@/components/opportunities/SourceBadge';
import { IntakeForm } from '@/components/intake/IntakeForm';
import { createIntake } from '@/app/intake/actions';
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS, formatDate } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function IntakePage() {
  const recent = await db
    .select()
    .from(opportunities)
    .orderBy(desc(opportunities.created_at))
    .limit(10);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">TNPA</p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight">Signal Intake</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-600">{recent.length} recent signals</span>
            <Link
              href="/pipeline"
              className="px-4 py-2 border border-[#303037] hover:border-zinc-500 text-sm text-zinc-300 hover:text-zinc-100 rounded-lg transition-colors"
            >
              Pipeline →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Intake form — 3 cols */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader label="New Signal" />
              <div className="p-5">
                <IntakeForm action={createIntake} />
              </div>
            </Card>

            {/* API info callout */}
            <div className="mt-4 bg-[#131316] border border-[#26262B] rounded-xl px-5 py-4">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-2">
                Programmatic Intake
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                POST to <code className="text-zinc-400 bg-[#1C1C21] px-1.5 py-0.5 rounded">/api/intake</code> to
                create signals programmatically — from Telegram bots, automations, or scripts.
              </p>
              <pre className="text-[11px] text-zinc-500 bg-[#1C1C21] rounded-lg p-3 overflow-x-auto leading-relaxed">{`POST /api/intake
Content-Type: application/json

{
  "source": "telegram",
  "raw_note": "$BTC breaking above 70k...",
  "name": "Bitcoin",       // optional
  "symbol": "BTC",         // optional
  "asset_class": "crypto"  // optional
}`}</pre>
            </div>
          </div>

          {/* Recent history — 2 cols */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
                label="Recent Signals"
                action={
                  <Link href="/pipeline" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                    All →
                  </Link>
                }
              />
              {recent.length > 0 ? (
                <div className="divide-y divide-[#1C1C21]">
                  {recent.map((opp) => (
                    <Link
                      key={opp.id}
                      href={`/opportunities/${opp.id}`}
                      className="block px-5 py-3.5 hover:bg-[#131316] transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors truncate">
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
                          {opp.parsed_thesis && (
                            <p className="text-xs text-zinc-600 mt-1 line-clamp-2 leading-relaxed">
                              {opp.parsed_thesis}
                            </p>
                          )}
                        </div>
                        <span className="flex-shrink-0 text-[11px] text-zinc-700 tabular-nums">
                          {formatDate(opp.created_at)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-zinc-700">No signals yet.</p>
                  <p className="text-xs text-zinc-800 mt-1">
                    Submit a signal using the form to get started.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
