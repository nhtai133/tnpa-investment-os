import { RESEARCH_NOTE_TYPE_LABELS, RESEARCH_NOTE_TYPE_COLORS } from '@/lib/formatters';
import type { ResearchNoteType } from '@/db/schema';

export function NoteTypeBadge({ type }: { type: ResearchNoteType }) {
  const color = RESEARCH_NOTE_TYPE_COLORS[type] ?? '#9CA3AF';
  const label = RESEARCH_NOTE_TYPE_LABELS[type] ?? type;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  );
}
