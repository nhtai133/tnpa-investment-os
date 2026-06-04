import { Card, CardHeader } from '@/components/ui/Card';
import {
  ASSET_CLASS_LABELS,
  ASSET_CLASS_COLORS,
  formatWeight,
} from '@/lib/formatters';
import type { RebalanceAlert } from '@/db/schema';

interface RebalanceAlertsProps {
  alerts: RebalanceAlert[];
}

function AlertRow({ alert }: { alert: RebalanceAlert }) {
  const color = ASSET_CLASS_COLORS[alert.asset_class];
  const isMajor = alert.severity === 'major';
  const isUnder = alert.direction === 'underweight';

  const severityColor = isMajor ? '#F87171' : '#FBBF24';
  const severityLabel = isMajor ? 'Major' : 'Minor';
  const directionLabel = isUnder ? 'Underweight' : 'Overweight';
  const actionHint = isUnder
    ? `Add to ${ASSET_CLASS_LABELS[alert.asset_class]} to reach target`
    : `Trim ${ASSET_CLASS_LABELS[alert.asset_class]} to return to target`;

  const deviationDisplay = `${alert.deviation >= 0 ? '+' : ''}${alert.deviation.toFixed(1)}pp`;

  return (
    <div
      className="px-5 py-4 flex items-start gap-4 hover:bg-[#1C1C21] transition-colors border-b border-[#1C1C21] last:border-0"
    >
      {/* Severity indicator */}
      <div
        className="flex-shrink-0 mt-0.5 w-1 h-12 rounded-full"
        style={{ backgroundColor: severityColor }}
      />

      {/* Asset class */}
      <div className="flex-shrink-0 w-28">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium text-zinc-100">
            {ASSET_CLASS_LABELS[alert.asset_class]}
          </span>
        </div>
        <span
          className="text-[11px] font-medium px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${severityColor}15`, color: severityColor }}
        >
          {severityLabel}
        </span>
      </div>

      {/* Allocation bars */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-baseline gap-1">
            <span
              className="text-xl font-light tabular-nums"
              style={{ color: severityColor }}
            >
              {formatWeight(alert.actual_weight)}
            </span>
            <span className="text-xs text-zinc-500">actual</span>
          </div>
          <span className="text-zinc-700">→</span>
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-zinc-400 tabular-nums">
              {formatWeight(alert.target_weight)}
            </span>
            <span className="text-xs text-zinc-600">target</span>
          </div>
          <span
            className="text-xs tabular-nums font-medium ml-1"
            style={{ color: isUnder ? '#F87171' : '#FBBF24' }}
          >
            {deviationDisplay}
          </span>
        </div>

        {/* Band visual */}
        <div className="relative w-full h-1.5 bg-[#26262B] rounded-full overflow-hidden">
          {/* Target zone */}
          <div
            className="absolute top-0 h-full bg-[#303037] rounded-full"
            style={{
              left: `${Math.min(alert.lower_band / 50 * 100, 100)}%`,
              width: `${Math.min((alert.upper_band - alert.lower_band) / 50 * 100, 100)}%`,
            }}
          />
          {/* Actual position */}
          <div
            className="absolute top-0 h-full w-1 rounded-full"
            style={{
              left: `${Math.min(alert.actual_weight / 50 * 100, 100)}%`,
              backgroundColor: severityColor,
            }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px] text-zinc-700">
            {formatWeight(alert.lower_band)} floor
          </span>
          <span className="text-[10px] text-zinc-700">
            {formatWeight(alert.upper_band)} ceiling
          </span>
        </div>
      </div>

      {/* Direction and action */}
      <div className="flex-shrink-0 text-right hidden sm:block">
        <p
          className="text-xs font-medium"
          style={{ color: isUnder ? '#F87171' : '#FBBF24' }}
        >
          {directionLabel}
        </p>
        <p className="text-[11px] text-zinc-600 mt-1 max-w-[140px]">{actionHint}</p>
      </div>
    </div>
  );
}

export function RebalanceAlerts({ alerts }: RebalanceAlertsProps) {
  const open = alerts.filter((a) => a.status === 'open');

  if (open.length === 0) {
    return (
      <Card>
        <CardHeader label="Rebalance Alerts" />
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-zinc-500">All allocations within target bands</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        label="Rebalance Alerts"
        action={`${open.length} open`}
      />
      <div>
        {open
          .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
          .map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
      </div>
    </Card>
  );
}
