import { tr } from '@/i18n';
import { Card, CardHeader } from '@/components/ui/Card';
import type { AssetLifecycleSummary } from '@/lib/asset-lifecycle';
import { formatDate, formatValue } from '@/lib/formatters';

export function AssetLifecycleCard({
  lifecycle,
  currency,
}: {
  lifecycle: AssetLifecycleSummary;
  currency: string;
}) {
  return (
    <Card>
      <CardHeader label={tr("Lifecycle")} />
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Metric label={tr("Bought From")} value={lifecycle.firstFundingAccount?.name ?? '-'} />
          <Metric label={tr("Bought Through")} value={lifecycle.firstExecutionAccount?.name ?? '-'} />
          <Metric
            label={tr("Current Custody")}
            value={lifecycle.currentCustody.map((row) => row.account.name).join(', ') || '-'}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Metric label={tr("Lifetime Cash In")} value={formatValue(lifecycle.lifetimeCashIn, currency)} />
          <Metric label={tr("Lifetime Cash Out")} value={formatValue(lifecycle.lifetimeCashOut, currency)} />
          <Metric label={tr("Realized P&L")} value={formatValue(lifecycle.realizedPnl, currency)} />
          <Metric label={tr("Unrealized P&L")} value={formatValue(lifecycle.unrealizedPnl, currency)} />
          <Metric label={tr("Total Return")} value={formatValue(lifecycle.totalReturn, currency)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-2">
              {tr("Custody Positions")}</p>
            <div className="space-y-2">
              {lifecycle.currentCustody.length === 0 ? (
                <EmptyRow />
              ) : (
                lifecycle.currentCustody.map((row) => (
                  <div key={row.account.id} className="rounded-lg border border-[#26262B] px-3 py-2">
                    <p className="text-sm text-zinc-200">{row.account.name}</p>
                    <p className="text-xs text-zinc-600 tabular-nums">
                      {row.quantity.toLocaleString()} {'' + tr("units -") + ' '}{formatValue(row.costBasis, currency)} {tr("cost")}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-2">
              {tr("Transfer History")}</p>
            <div className="space-y-2">
              {lifecycle.transferHistory.length === 0 ? (
                <EmptyRow />
              ) : (
                lifecycle.transferHistory.map((transfer) => (
                  <div key={transfer.id} className="rounded-lg border border-[#26262B] px-3 py-2">
                    <p className="text-sm text-zinc-200">
                      {transfer.from?.name ?? '-'} {'->'} {transfer.to?.name ?? '-'}
                    </p>
                    <p className="text-xs text-zinc-600 tabular-nums">
                      {formatDate(transfer.date)} - {transfer.quantity?.toLocaleString() ?? '-'} {tr("units")}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-2">
              {tr("Sell History")}</p>
            <div className="space-y-2">
              {lifecycle.sellHistory.length === 0 ? (
                <EmptyRow />
              ) : (
                lifecycle.sellHistory.map((sale) => (
                  <div key={sale.id} className="rounded-lg border border-[#26262B] px-3 py-2">
                    <p className="text-sm text-zinc-200">
                      {'' + tr("To") + ' '}{sale.receiveAccount?.name ?? '-'}
                    </p>
                    <p className="text-xs text-zinc-600 tabular-nums">
                      {formatDate(sale.date)} {'' + tr("- P&L") + ' '}{formatValue(sale.realizedPnl ?? 0, currency)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#26262B] bg-[#101014] p-3">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">
        {label}
      </p>
      <p className="mt-1 text-sm text-zinc-100 break-words">{value}</p>
    </div>
  );
}

function EmptyRow() {
  return (
    <div className="rounded-lg border border-dashed border-[#26262B] px-3 py-2 text-xs text-zinc-700">
      {tr("No records.")}</div>
  );
}
