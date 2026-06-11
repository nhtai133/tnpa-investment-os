import { Card } from '@/components/ui/Card';

interface WealthScoreProps {
  score: number;
  allocationScore: number;
  decisionScore: number;
  reviewScore: number;
  configScore: number;
}

function getGrade(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: '#34D399' };
  if (score >= 60) return { label: 'Good', color: '#60A5FA' };
  if (score >= 40) return { label: 'Fair', color: '#FBBF24' };
  return { label: 'Needs Attention', color: '#F87171' };
}

function subColor(pct: number): string {
  if (pct >= 0.8) return '#34D399';
  if (pct >= 0.5) return '#60A5FA';
  if (pct >= 0.3) return '#FBBF24';
  return '#F87171';
}

export function WealthScore({
  score,
  allocationScore,
  decisionScore,
  reviewScore,
  configScore,
}: WealthScoreProps) {
  const { label, color } = getGrade(score);
  const circumference = 2 * Math.PI * 15.9;
  const filled = (score / 100) * circumference;

  const subScores = [
    { label: 'Allocation', score: allocationScore, max: 25 },
    { label: 'Decisions', score: decisionScore, max: 25 },
    { label: 'Reviews', score: reviewScore, max: 25 },
    { label: 'Configuration', score: configScore, max: 25 },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">Wealth Score</p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-4xl font-light tabular-nums" style={{ color }}>{score}</span>
            <span className="text-sm text-zinc-600">/100</span>
          </div>
          <p className="text-sm font-semibold mt-0.5" style={{ color }}>{label}</p>
        </div>
        {/* SVG ring */}
        <svg className="w-16 h-16" viewBox="0 0 36 36">
          <circle
            cx="18" cy="18" r="15.9"
            fill="none" stroke="#26262B" strokeWidth="2.5"
          />
          <circle
            cx="18" cy="18" r="15.9"
            fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={`${filled} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
      </div>

      <div className="space-y-2.5 border-t border-[#26262B] pt-4">
        {subScores.map(({ label: l, score: s, max }) => {
          const pct = s / max;
          return (
            <div key={l}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-500">{l}</span>
                <span className="text-[10px] tabular-nums text-zinc-600">{s}/{max}</span>
              </div>
              <div className="h-1 bg-[#26262B] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct * 100}%`, backgroundColor: subColor(pct) }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-zinc-700 mt-4 pt-3 border-t border-[#26262B] leading-relaxed">
        Planning heuristic only. Not investment advice.
      </p>
    </Card>
  );
}
