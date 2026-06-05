interface ConvictionBadgeProps {
  score: number | null | undefined;
}

function convictionColor(score: number): string {
  if (score >= 7) return '#34D399'; // emerald
  if (score >= 4) return '#FBBF24'; // amber
  return '#9CA3AF';                 // zinc
}

export function ConvictionBadge({ score }: ConvictionBadgeProps) {
  if (score == null) {
    return <span className="text-xs text-zinc-700">—</span>;
  }
  const color = convictionColor(score);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {score}/10
    </span>
  );
}
