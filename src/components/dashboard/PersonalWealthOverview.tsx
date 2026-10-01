import { tr } from '@/i18n';
import { Card } from '@/components/ui/Card';
import { formatValue } from '@/lib/formatters';
import { buildPersonalWealthSummaryVnd, type PortfolioSummary } from '@/lib/portfolio-model';

export function PersonalWealthOverview({ portfolio }: { portfolio: PortfolioSummary }) {
  const summary = buildPersonalWealthSummaryVnd(portfolio);
  const domains: [string, number][] = [
    ['Banking & Savings', summary.banking],
    ['Stocks', summary.stocks],
    ['Crypto', summary.crypto],
    ['Gold', summary.gold],
    ['Real Estate', summary.realEstate],
  ];
  return <section aria-labelledby="personal-wealth-overview" className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-[#171720] to-[#111114] p-5 sm:p-6 space-y-5">
    <div><p id="personal-wealth-overview" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">{tr('Total Wealth')}</p><p className="mt-2 text-3xl sm:text-4xl font-light tracking-tight tabular-nums text-white">{formatValue(summary.netWorth, 'VND')}</p><p className="mt-1 text-xs text-zinc-500">{tr('Current household net worth · VND')}</p></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">{domains.map(([label, value]) => <div key={label} className="rounded-lg border border-[#292932] bg-[#101014] px-3 py-3"><p className="text-[10px] text-zinc-500">{tr(label)}</p><p className="mt-1 text-sm font-medium tabular-nums text-zinc-100">{formatValue(value, 'VND')}</p></div>)}</div>
    <div className="grid grid-cols-2 gap-3 border-t border-[#292932] pt-4 sm:max-w-xl"><Metric label="Total Assets" value={summary.totalAssets} /><Metric label="Liabilities" value={summary.liabilities} /></div>
  </section>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div><p className="text-[10px] uppercase tracking-wider text-zinc-600">{tr(label)}</p><p className="mt-1 text-sm tabular-nums text-zinc-300">{formatValue(value, 'VND')}</p></div>; }
