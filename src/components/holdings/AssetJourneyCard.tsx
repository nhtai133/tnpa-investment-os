import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { formatValue, formatPercent } from '@/lib/formatters';
import type { AssetLifecycleSummary } from '@/lib/asset-lifecycle';

interface Props {
  lifecycle: AssetLifecycleSummary;
  asset: {
    current_value: number;
    currency: string;
    quantity: number | null;
  };
}

export function AssetJourneyCard({ lifecycle, asset }: Props) {
  const fundingAccount = lifecycle.firstFundingAccount;
  const executionAccount = lifecycle.firstExecutionAccount;
  const custodyPositions = lifecycle.currentCustody;

  const totalGainLoss = lifecycle.unrealizedPnl + lifecycle.realizedPnl;
  const gainLossPct =
    lifecycle.lifetimeCashOut > 0
      ? (totalGainLoss / lifecycle.lifetimeCashOut) * 100
      : null;

  return (
    <Card>
      <div className="px-5 pt-4 pb-1">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
          Asset Journey
        </p>
        <p className="text-[11px] text-zinc-700 mt-0.5">
          Where money came from · where it went · what it&apos;s worth
        </p>
      </div>

      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-0">

          {/* Step 1: Funding Source */}
          <JourneyStep
            label="Funding Source"
            value={fundingAccount?.name ?? '—'}
            sub={fundingAccount ? 'Bank / Cash Account' : 'Not recorded'}
            href={fundingAccount ? `/locations/${fundingAccount.id}` : undefined}
            accent="text-blue-400"
          />

          <Connector />

          {/* Step 2: Execution Venue */}
          <JourneyStep
            label="Execution Venue"
            value={executionAccount?.name ?? '—'}
            sub={executionAccount ? 'Broker / Exchange' : 'Not recorded'}
            href={executionAccount ? `/locations/${executionAccount.id}` : undefined}
            accent="text-indigo-400"
          />

          <Connector />

          {/* Step 3: Custody Location(s) */}
          <JourneyStep
            label="Custody Location"
            value={
              custodyPositions.length === 0
                ? '—'
                : custodyPositions.map((p) => p.account.name).join(', ')
            }
            sub={
              custodyPositions.length === 0
                ? 'No positions'
                : `${custodyPositions.reduce((s, p) => s + p.quantity, 0).toLocaleString()} units held`
            }
            href={
              custodyPositions.length === 1
                ? `/locations/${custodyPositions[0].account.id}`
                : custodyPositions.length > 1
                ? '/locations'
                : undefined
            }
            accent="text-violet-400"
          />

          <Connector />

          {/* Step 4: Current Value */}
          <JourneyStep
            label="Current Value"
            value={formatValue(asset.current_value, asset.currency)}
            sub={asset.quantity != null ? `${asset.quantity.toLocaleString()} units` : undefined}
            accent="text-zinc-200"
          />

          <Connector />

          {/* Step 5: Gain / Loss */}
          <JourneyStep
            label="Total Return"
            value={`${totalGainLoss >= 0 ? '+' : ''}${formatValue(totalGainLoss, asset.currency)}`}
            sub={gainLossPct != null ? formatPercent(gainLossPct) : undefined}
            accent={totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />
        </div>
      </div>

      {/* Custody split detail (only when multi-location) */}
      {custodyPositions.length > 1 && (
        <div className="border-t border-[#1A1A1F] px-5 py-3 flex flex-wrap gap-3">
          {custodyPositions.map((pos) => (
            <Link
              key={pos.account.id}
              href={`/locations/${pos.account.id}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#26262B] bg-[#101014] hover:border-zinc-600 transition-colors group"
            >
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                {pos.account.name}
              </span>
              <span className="text-[11px] text-zinc-600 tabular-nums">
                {pos.quantity.toLocaleString()} units
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function JourneyStep({
  label,
  value,
  sub,
  href,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  accent: string;
}) {
  const content = (
    <div
      className={`flex-1 min-w-[120px] rounded-lg border border-[#26262B] bg-[#101014] px-3 py-2.5 ${
        href ? 'hover:border-zinc-600 transition-colors cursor-pointer group' : ''
      }`}
    >
      <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-1">
        {label}
      </p>
      <p className={`text-sm font-medium break-words leading-snug ${accent} ${href ? 'group-hover:opacity-80' : ''}`}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-zinc-700 mt-0.5 leading-tight">{sub}</p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="flex-1 min-w-[120px] block">{content}</Link>;
  }
  return <div className="flex-1 min-w-[120px]">{content}</div>;
}

function Connector() {
  return (
    <>
      {/* Horizontal arrow (sm+) */}
      <div className="hidden sm:flex items-center px-1 text-zinc-700 flex-shrink-0">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {/* Vertical arrow (mobile) */}
      <div className="flex sm:hidden items-center py-0.5 text-zinc-700 self-start pl-3">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
}
