import { tr } from '@/i18n';
import { normalizeToUsd } from '@/lib/fx';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import {
  formatCurrency,
  formatWeight,
  formatPercent,
  formatDate,
  ASSET_CLASS_LABELS,
  ASSET_CLASS_COLORS,
  PURPOSE_LABELS,
  PURPOSE_COLORS,
} from '@/lib/formatters';
import type { Asset } from '@/db/schema';

interface PositionSummaryCardProps {
  asset: Asset;
  totalNetWorth: number;
  usdVndRate: number;
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#1C1C21] last:border-0">
      <span className="text-xs text-zinc-600 flex-shrink-0">{label}</span>
      <div className="text-xs text-zinc-300 text-right">{children}</div>
    </div>
  );
}

export function PositionSummaryCard({ asset, totalNetWorth, usdVndRate }: PositionSummaryCardProps) {
  const weight = totalNetWorth > 0 ? (normalizeToUsd(asset.current_value, asset.currency, usdVndRate) / totalNetWorth) * 100 : 0;
  const gain = asset.cost_basis != null ? asset.current_value - asset.cost_basis : null;
  const gainPct =
    asset.cost_basis != null && asset.cost_basis > 0
      ? ((asset.current_value - asset.cost_basis) / asset.cost_basis) * 100
      : null;

  return (
    <Card>
      <CardHeader label={tr("Position Summary")} />
      <div className="p-5">
        {/* Primary metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-5 border-b border-[#26262B]">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1">
              {tr("Current Value")}</p>
            <p className="text-2xl font-light text-zinc-50 tabular-nums">
              {formatCurrency(asset.current_value)}
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">{asset.currency}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1">
              {tr("Portfolio Weight")}</p>
            <p className="text-2xl font-light text-zinc-50 tabular-nums">
              {formatWeight(weight)}
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">{tr("of Total Net Worth")}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1">
              {tr("Unrealized Gain / Loss")}</p>
            {gain != null && gainPct != null ? (
              <>
                <p className={`text-2xl font-light tabular-nums ${gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {gain >= 0 ? '+' : ''}{formatCurrency(gain)}
                </p>
                <p className={`text-xs tabular-nums mt-0.5 ${gainPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {formatPercent(gainPct)}
                </p>
              </>
            ) : (
              <p className="text-2xl font-light text-zinc-700">—</p>
            )}
          </div>
        </div>

        {/* Metadata grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <MetaRow label={tr("Asset Class")}>
              <Badge
                label={ASSET_CLASS_LABELS[asset.asset_class]}
                color={ASSET_CLASS_COLORS[asset.asset_class]}
              />
            </MetaRow>
            <MetaRow label={tr("Purpose")}>
              <span style={{ color: PURPOSE_COLORS[asset.purpose] }}>
                {PURPOSE_LABELS[asset.purpose]}
              </span>
            </MetaRow>
            <MetaRow label={tr("Currency")}>
              <span className="text-zinc-300">{asset.currency}</span>
            </MetaRow>
            <MetaRow label={tr("Quantity")}>
              {asset.quantity != null ? (
                <span className="text-zinc-300 tabular-nums">{asset.quantity.toLocaleString()}</span>
              ) : (
                <span className="text-zinc-700">—</span>
              )}
            </MetaRow>
          </div>
          <div>
            <MetaRow label={tr("Cost Basis")}>
              {asset.cost_basis != null ? (
                <span className="text-zinc-300 tabular-nums">{formatCurrency(asset.cost_basis)}</span>
              ) : (
                <span className="text-zinc-700">—</span>
              )}
            </MetaRow>
            <MetaRow label={tr("In Investment NW")}>
              <span className={asset.include_in_investment_net_worth ? 'text-emerald-400' : 'text-zinc-600'}>
                {asset.include_in_investment_net_worth ? 'Yes' : 'No'}
              </span>
            </MetaRow>
            <MetaRow label={tr("Added")}>
              <span className="text-zinc-400">{formatDate(asset.created_at)}</span>
            </MetaRow>
            <MetaRow label={tr("Last updated")}>
              <span className="text-zinc-400">{formatDate(asset.updated_at)}</span>
            </MetaRow>
          </div>
        </div>

        {/* Notes */}
        {asset.notes && (
          <div className="mt-4 pt-4 border-t border-[#26262B]">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1.5">{tr("Notes")}</p>
            <p className="text-sm text-zinc-400 leading-relaxed">{asset.notes}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
