import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { formatValue, formatDate, formatWeight } from '@/lib/formatters';
import { getPortfolioLocations, GROUP_ORDER } from '@/lib/locations';

export const dynamic = 'force-dynamic';

export default async function LocationsPage() {
  const { locations, totalValue, grouped } = await getPortfolioLocations();

  const totalCash = locations.reduce((sum, l) => sum + l.cashBalance, 0);
  const totalCustody = locations.reduce((sum, l) => sum + l.custodyValue, 0);
  const activeCount = locations.filter((l) => !l.isEmpty).length;

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">
              Portfolio · System Map
            </p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
              Portfolio Locations
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              System-wide map of where money and assets are stored.
            </p>
          </div>
          <Link
            href="/accounts"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Account Registry →
          </Link>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-8">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Active Locations" value={String(activeCount)} sub={`${locations.length} total`} />
          <KpiCard label="Total Cash" value={formatValue(totalCash, 'VND')} />
          <KpiCard label="Asset / Custody Value" value={formatValue(totalCustody, 'VND')} />
          <KpiCard label="Total Value Tracked" value={formatValue(totalValue, 'VND')} highlight />
        </div>

        {/* Grouped sections */}
        {GROUP_ORDER.map((groupName) => {
          const rows = grouped[groupName];
          if (!rows || rows.length === 0) return null;

          const groupTotal = rows.reduce((sum, r) => sum + r.totalValue, 0);
          const groupCash = rows.reduce((sum, r) => sum + r.cashBalance, 0);
          const groupCustody = rows.reduce((sum, r) => sum + r.custodyValue, 0);
          const hasActivity = rows.some((r) => !r.isEmpty);
          const summary = `${formatValue(groupTotal, rows[0].account.currency)} · ${rows.length} location${rows.length !== 1 ? 's' : ''}`;

          return (
            <CollapsibleSection
              key={groupName}
              title={groupName}
              summary={summary}
              defaultOpen={hasActivity}
            >
              <div className="space-y-3">
                {/* Group totals strip */}
                {hasActivity && (
                  <div className="flex flex-wrap gap-x-6 gap-y-1 px-1 pb-1 text-xs text-zinc-600">
                    <span>Cash: <span className="text-zinc-400">{formatValue(groupCash, rows[0].account.currency)}</span></span>
                    <span>Assets: <span className="text-zinc-400">{formatValue(groupCustody, rows[0].account.currency)}</span></span>
                    <span>Total: <span className="text-zinc-300 font-medium">{formatValue(groupTotal, rows[0].account.currency)}</span></span>
                  </div>
                )}

                <Card className="overflow-hidden">
                  {/* Table header */}
                  <div className="hidden lg:grid grid-cols-[1fr_repeat(6,auto)] gap-x-4 px-5 py-2.5 border-b border-[#26262B]">
                    {['Location', 'Cash Balance', 'Asset Value', 'Total', '% of Tracked', 'Positions', 'Transactions', 'Last Activity'].map(
                      (col, i) => (
                        <span
                          key={col}
                          className={`text-[10px] font-semibold tracking-widest uppercase text-zinc-600 ${i > 0 ? 'text-right' : ''}`}
                        >
                          {col}
                        </span>
                      ),
                    )}
                  </div>

                  <div className="divide-y divide-[#1A1A1F]">
                    {rows.map((loc) => (
                      <div
                        key={loc.account.id}
                        className={`flex items-center gap-4 px-5 py-3 hover:bg-[#101014] transition-colors ${
                          loc.isEmpty ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/locations/${loc.account.id}`}
                            className="text-sm text-zinc-200 hover:text-indigo-300 transition-colors block truncate"
                          >
                            {loc.account.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            {loc.account.institution && (
                              <span className="text-[11px] text-zinc-600">{loc.account.institution}</span>
                            )}
                            <span className={`text-[11px] text-zinc-700 ${loc.account.institution ? 'before:content-["·"] before:mr-2' : ''}`}>
                              {loc.account.status !== 'active' && (
                                <span className="text-amber-600 mr-1">{loc.account.status}</span>
                              )}
                              {loc.account.currency}
                            </span>
                          </div>
                        </div>

                        {/* Cash */}
                        <div className="text-right hidden sm:block w-[110px]">
                          <p className="text-xs text-zinc-400 tabular-nums">
                            {formatValue(loc.cashBalance, loc.account.currency)}
                          </p>
                          <p className="text-[11px] text-zinc-700">cash</p>
                        </div>

                        {/* Custody */}
                        <div className="text-right hidden md:block w-[110px]">
                          {loc.custodyValue > 0 ? (
                            <>
                              <p className="text-xs text-zinc-400 tabular-nums">
                                {formatValue(loc.custodyValue, loc.account.currency)}
                              </p>
                              <p className="text-[11px] text-zinc-700">{loc.positionCount} position{loc.positionCount !== 1 ? 's' : ''}</p>
                            </>
                          ) : (
                            <p className="text-xs text-zinc-700">—</p>
                          )}
                        </div>

                        {/* Total */}
                        <div className="text-right w-[110px]">
                          <p className="text-sm text-zinc-100 tabular-nums font-medium">
                            {formatValue(loc.totalValue, loc.account.currency)}
                          </p>
                          <p className="text-[11px] text-zinc-600 tabular-nums">
                            {formatWeight(loc.netWorthPct)}
                          </p>
                        </div>

                        {/* Last activity */}
                        <div className="text-right hidden xl:block w-[90px]">
                          {loc.lastActivity ? (
                            <p className="text-[11px] text-zinc-600 whitespace-nowrap">
                              {formatDate(loc.lastActivity)}
                            </p>
                          ) : (
                            <p className="text-[11px] text-zinc-800">No activity</p>
                          )}
                          <p className="text-[11px] text-zinc-700">{loc.transactionCount} txns</p>
                        </div>

                        {/* View link */}
                        <Link
                          href={`/locations/${loc.account.id}`}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex-shrink-0 whitespace-nowrap"
                        >
                          View →
                        </Link>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </CollapsibleSection>
          );
        })}

        {locations.length === 0 && (
          <Card className="px-6 py-16 text-center">
            <p className="text-sm text-zinc-600 mb-3">No accounts in the registry yet.</p>
            <p className="text-xs text-zinc-700 mb-4">
              Accounts are created from their domain modules (Banking, Stocks, Crypto, etc.)
            </p>
            <Link href="/accounts" className="text-xs text-indigo-400 hover:text-indigo-300">
              Go to Account Registry →
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card className="p-5">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">{label}</p>
      <p className={`text-xl font-light tracking-tight tabular-nums ${highlight ? 'text-zinc-50' : 'text-zinc-100'}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>}
    </Card>
  );
}
