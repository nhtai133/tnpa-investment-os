'use client';

import { useFormStatus } from 'react-dom';
import type { Asset, ResearchNote } from '@/db/schema';
import { ASSET_CLASSES, RESEARCH_NOTE_TYPES, CONVICTION_LEVELS, RESEARCH_STATUSES } from '@/db/schema';
import { ASSET_CLASS_LABELS, RESEARCH_NOTE_TYPE_LABELS } from '@/lib/formatters';

const inputClass =
  'w-full bg-[#1C1C21] border border-[#26262B] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors';
const labelClass =
  'block text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-1.5';
const sectionClass = 'text-[10px] font-semibold tracking-widest uppercase text-zinc-700 mb-3 mt-2';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
    >
      {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Research Note'}
    </button>
  );
}

const CONVICTION_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
};

interface ResearchNoteFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: ResearchNote | null;
  assets?: Asset[];
  cancelHref?: string;
}

export function ResearchNoteForm({
  action,
  defaultValues,
  assets = [],
  cancelHref = '/research',
}: ResearchNoteFormProps) {
  const isEdit = !!defaultValues;
  const d = defaultValues;

  return (
    <form action={action} className="space-y-5">
      <p className={sectionClass}>Identification</p>

      {/* Title + Symbol */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Field label="Title">
            <input
              type="text"
              name="title"
              maxLength={200}
              defaultValue={d?.title ?? ''}
              placeholder="e.g. Bitcoin Bull Case 2025"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Symbol (optional)">
          <input
            type="text"
            name="symbol"
            maxLength={20}
            defaultValue={d?.symbol ?? ''}
            placeholder="e.g. BTC"
            className={`${inputClass} uppercase`}
          />
        </Field>
      </div>

      {/* Asset Class + Note Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Asset Class (optional)">
          <select
            name="asset_class"
            defaultValue={d?.asset_class ?? ''}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="">Select class…</option>
            {ASSET_CLASSES.map((c) => (
              <option key={c} value={c}>{ASSET_CLASS_LABELS[c]}</option>
            ))}
          </select>
        </Field>
        <Field label="Note Type">
          <select
            name="note_type"
            defaultValue={d?.note_type ?? 'research'}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            {RESEARCH_NOTE_TYPES.map((t) => (
              <option key={t} value={t}>{RESEARCH_NOTE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Related Asset */}
      {assets.length > 0 && (
        <Field label="Related Asset (optional)">
          <select
            name="asset_id"
            defaultValue={d?.asset_id ?? ''}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="">No linked asset</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}{a.symbol ? ` (${a.symbol})` : ''}
              </option>
            ))}
          </select>
        </Field>
      )}

      <p className={sectionClass}>Research</p>

      {/* Thesis */}
      <Field label="Thesis">
        <textarea
          name="thesis"
          rows={4}
          defaultValue={d?.thesis ?? ''}
          placeholder="Core investment thesis — why is this interesting?"
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Valuation + Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Valuation Notes (optional)">
          <textarea
            name="valuation_notes"
            rows={3}
            defaultValue={d?.valuation_notes ?? ''}
            placeholder="P/E, DCF, fair value estimate…"
            className={`${inputClass} resize-none`}
          />
        </Field>
        <Field label="Risk Notes (optional)">
          <textarea
            name="risk_notes"
            rows={3}
            defaultValue={d?.risk_notes ?? ''}
            placeholder="Key risks, concerns, red flags…"
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>

      {/* Action Plan */}
      <Field label="Action Plan (optional)">
        <textarea
          name="action_plan"
          rows={2}
          defaultValue={d?.action_plan ?? ''}
          placeholder="What will you do? Buy trigger, sizing, entry conditions…"
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* General Notes */}
      <Field label="Additional Notes (optional)">
        <textarea
          name="body"
          rows={3}
          defaultValue={d?.body ?? ''}
          placeholder="Supplementary notes, data sources, links…"
          className={`${inputClass} resize-none`}
        />
      </Field>

      <p className={sectionClass}>Meta</p>

      {/* Conviction + Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Conviction">
          <select
            name="conviction"
            defaultValue={d?.conviction ?? ''}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="">— not set —</option>
            {CONVICTION_LEVELS.map((c) => (
              <option key={c} value={c}>{CONVICTION_LABELS[c]}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            name="research_status"
            defaultValue={d?.research_status ?? 'active'}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            {RESEARCH_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </Field>
        <Field label="Source Label (optional)">
          <input
            type="text"
            name="source_label"
            defaultValue={d?.source_label ?? ''}
            placeholder="e.g. Bloomberg, Twitter"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Source URL */}
      <Field label="Source URL (optional)">
        <input
          type="url"
          name="source_url"
          defaultValue={d?.source_url ?? ''}
          placeholder="https://…"
          className={inputClass}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton isEdit={isEdit} />
        <a
          href={cancelHref}
          className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
