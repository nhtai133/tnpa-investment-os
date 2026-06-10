import { Card } from '@/components/ui/Card';

interface SectionPlaceholderProps {
  label: string;
  note?: string;
}

export function SectionPlaceholder({ label, note }: SectionPlaceholderProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">
        {label}
      </p>
      <Card className="px-6 py-10 text-center">
        <p className="text-sm text-zinc-600">
          {note ?? `${label} — coming in a future sprint.`}
        </p>
      </Card>
    </div>
  );
}
