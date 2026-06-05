'use client';

import { useFormStatus } from 'react-dom';
import { ASSET_CLASSES, OPPORTUNITY_SOURCES, type Opportunity } from '@/db/schema';
import { ASSET_CLASS_LABELS, OPPORTUNITY_SOURCE_LABELS } from '@/lib/formatters';

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

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
    >
      {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Opportunity'}
    </button>
  );
}

interface OpportunityFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: Opportunity | null;
  cancelHref: string;
}

export function OpportunityForm({ action, defaultValues, cancelHref }: OpportunityFormProps) {
  const isEdit = !!defaultValues;
  const d = defaultValues;

  return (
    <form action={action} className="space-y-5">
      {/* Name + Symbol */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Field label="Name">
            <input
              type="text"
              name="name"
              required
              maxLength={200}
              defaultValue={d?.name ?? ''}
              placeholder="e.g. Nvidia Corp"
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
            placeholder="e.g. NVDA"
            className={`${inputClass} uppercase`}
          />
        </Field>
      </div>

      {/* Asset Class + Source */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Asset Class">
          <select
            name="asset_class"
            defaultValue={d?.asset_class ?? ''}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="">Select class… (optional)</option>
            {ASSET_CLASSES.map((c) => (
              <option key={c} value={c}>{ASSET_CLASS_LABELS[c]}</option>
            ))}
          </select>
        </Field>
        <Field label="Source">
          <select
            name="source"
            defaultValue={d?.source ?? 'manual'}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            {OPPORTUNITY_SOURCES.map((s) => (
              <option key={s} value={s}>{OPPORTUNITY_SOURCE_LABELS[s]}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Raw Note */}
      <Field label="Raw Note">
        <textarea
          name="raw_note"
          rows={5}
          defaultValue={d?.raw_note ?? ''}
          placeholder="Paste the original Telegram message, research note, or tip here…"
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Parsed Thesis */}
      <Field label="Parsed Thesis (optional)">
        <textarea
          name="parsed_thesis"
          rows={3}
          defaultValue={d?.parsed_thesis ?? ''}
          placeholder="Cleaned-up thesis or key insight. Leave blank — AI will populate this in a future version."
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
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
