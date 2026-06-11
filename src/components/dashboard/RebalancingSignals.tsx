import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';

interface DriftSignal {
  label: string;
  currentPct: number;
  targetPct: number;
  differencePct: number; // positive = underweight, negative = overweight
  action: string;
  color: string;
}

interface RebalancingSignalsProps {
  classSignal: DriftSignal | null;
  purposeSignal: DriftSignal | null;
  classDriftScore: number;
  purposeDriftScore: number;
}

function SignalRow({ signal, domain }: { signal: DriftSignal; domain: string }) {
  const isUnder = signal.differencePct > 0;
  const statusColor = Math.abs(signal.differencePct) > 15 ? '#F87171' : '#FBBF24';
  const actionColor = isUnder ? '#F87171' : '#FBBF24';
  const actionLabel = isUnder ? 'UNDERWEIGHT' : 'OVERWEIGHT';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: signal.color }} />
          <span className="text-xs text-zinc-300">{signal.label}</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: actionColor, backgroundColor: `${actionColor}15` }}>
            {actionLabel}
          </span>
        </div>
        <span className="text-xs tabular-nums font-medium" style={{ color: statusColor }}>
          {signal.differencePct >= 0 ? '+' : ''}{signal.differencePct.toFixed(1)}pp
        </span>
      </div>
      <div className="relative h-1.5 bg-[#1C1C21] rounded-full overflow-hidden">
        <div
          className="absolute top-0 h-full rounded-full"
          style={{ width: `${Math.min(signal.currentPct * 2.5, 100)}%`, backgroundColor: `${signal.color}50` }}
        />
        <div
          className="absolute top-0 w-0.5 h-full"
          style={{ left: `${Math.min(signal.targetPct * 2.5, 100)}%`, backgroundColor: signal.color }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-zinc-600">
        <span>Current: {signal.currentPct.toFixed(1)}%</span>
        <span>Target: {signal.targetPct.toFixed(1)}%</span>
      </div>
      <p className="text-[10px] text-zinc-700">{domain} · {signal.action}</p>
    </div>
  );
}

export function RebalancingSignals({
  classSignal,
  purposeSignal,
  classDriftScore,
  purposeDriftScore,
}: RebalancingSignalsProps) {
  const hasSignals = classSignal || purposeSignal;

  return (
    <Card className="flex flex-col">
      <CardHeader
        label="Rebalancing Signals"
        action={
          <Link href="/rebalancing" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Full analysis →
          </Link>
        }
      />
      <div className="p-5 space-y-5 flex-1">
        {!hasSignals ? (
          <div className="text-center py-6">
            <p className="text-sm text-emerald-400">All allocations on target</p>
            <p className="text-xs text-zinc-600 mt-1">Class drift: {classDriftScore.toFixed(1)}pp · Purpose drift: {purposeDriftScore.toFixed(1)}pp</p>
          </div>
        ) : (
          <>
            {classSignal && (
              <SignalRow signal={classSignal} domain="Asset Class" />
            )}
            {purposeSignal && classSignal && (
              <div className="border-t border-[#26262B]" />
            )}
            {purposeSignal && (
              <SignalRow signal={purposeSignal} domain="Purpose Bucket" />
            )}
          </>
        )}
        <div className="border-t border-[#26262B] pt-3">
          <div className="flex items-center justify-between text-[10px] text-zinc-600">
            <span>Class drift score: {classDriftScore.toFixed(1)}pp</span>
            <span>Purpose drift: {purposeDriftScore.toFixed(1)}pp</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
