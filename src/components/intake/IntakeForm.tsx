'use client';

import { useFormStatus } from 'react-dom';
import { ASSET_CLASSES } from '@/db/schema';
import { ASSET_CLASS_LABELS } from '@/lib/formatters';

const SOURCES = [
  { value: 'manual', label: 'Manual' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'ai', label: 'AI' },
  { value: 'other', label: 'Other' },
] as const;

const inputClass =
  'w-full bg-[#1C1C21] border border-[#26262B] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-700 transition-colors';
const labelClass = 'block text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-1.5';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
    >
      {pending ? 'Parsing & saving…' : 'Intake Signal →'}
    </button>
  );
}

interface IntakeFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function IntakeForm({ action }: IntakeFormProps) {
  return (
    <form action={action} className="space-y-5">
      {/* Raw note — primary input */}
      <Field label="Raw Signal">
        <textarea
          name="raw_note"
          required
          rows={6}
          placeholder={`Paste your signal here. Examples:\n"$NVDA — data center demand exploding, AI capex cycle still early. Looking at $500–520 entry."\n"Telegram: BTC breaking above 70k, next target 80k. Strong on-chain metrics."`}
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Source */}
      <Field label="Source">
        <select
          name="source"
          defaultValue="manual"
          className={`${inputClass} appearance-none cursor-pointer`}
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      {/* Optional overrides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Name (optional — inferred if blank)">
          <input
            type="text"
            name="name"
            placeholder="e.g. NVIDIA Corp"
            className={inputClass}
          />
        </Field>
        <Field label="Symbol (optional)">
          <input
            type="text"
            name="symbol"
            placeholder="e.g. NVDA"
            className={`${inputClass} uppercase`}
          />
        </Field>
      </div>

      <Field label="Asset Class (optional — inferred if blank)">
        <select
          name="asset_class"
          defaultValue=""
          className={`${inputClass} appearance-none cursor-pointer`}
        >
          <option value="">Auto-detect…</option>
          {ASSET_CLASSES.map((c) => (
            <option key={c} value={c}>
              {ASSET_CLASS_LABELS[c]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Thesis Override (optional — auto-extracted if blank)">
        <textarea
          name="parsed_thesis"
          rows={2}
          placeholder="Override the auto-extracted thesis…"
          className={`${inputClass} resize-none`}
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
