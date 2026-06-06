'use client';

import { useFormStatus } from 'react-dom';
import { RESEARCH_NOTE_TYPES } from '@/db/schema';
import { RESEARCH_NOTE_TYPE_LABELS } from '@/lib/formatters';

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
      {pending ? 'Saving…' : 'Save Note'}
    </button>
  );
}

interface NoteFormProps {
  action: (formData: FormData) => Promise<void>;
  assetId?: number;
  opportunityId?: number;
  cancelHref: string;
  redirectTo?: string;
}

export function NoteForm({ action, assetId, opportunityId, cancelHref, redirectTo }: NoteFormProps) {
  return (
    <form action={action} className="space-y-5">
      {assetId && <input type="hidden" name="asset_id" value={assetId} />}
      {opportunityId && <input type="hidden" name="opportunity_id" value={opportunityId} />}
      {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}

      <Field label="Note Type">
        <select
          name="note_type"
          defaultValue="research"
          className={`${inputClass} appearance-none cursor-pointer`}
        >
          {RESEARCH_NOTE_TYPES.map((t) => (
            <option key={t} value={t}>{RESEARCH_NOTE_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </Field>

      <Field label="Note">
        <textarea
          name="body"
          required
          rows={6}
          placeholder="Write your research note, observation, or insight here…"
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Source URL (optional)">
          <input
            type="url"
            name="source_url"
            placeholder="https://…"
            className={inputClass}
          />
        </Field>
        <Field label="Source Label (optional)">
          <input
            type="text"
            name="source_label"
            placeholder="e.g. Q2 2026 Earnings Call"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <SubmitButton />
        <a href={cancelHref} className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
