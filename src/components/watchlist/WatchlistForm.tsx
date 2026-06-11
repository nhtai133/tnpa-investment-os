'use client';

import { useFormStatus } from 'react-dom';
import { ASSET_CLASSES, CONVICTION_LEVELS, REVIEW_CADENCES, type WatchlistItem } from '@/db/schema';
import { ASSET_CLASS_LABELS } from '@/lib/formatters';
import { REVIEW_CADENCE_LABELS } from '@/lib/calendar';

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  archived: 'Archived',
  promoted: 'Promoted',
  rejected: 'Rejected',
};

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
      {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add to Watchlist'}
    </button>
  );
}

interface WatchlistFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: WatchlistItem | null;
  cancelHref: string;
  isEdit?: boolean;
}

export function WatchlistForm({ action, defaultValues, cancelHref }: WatchlistFormProps) {
  const isEdit = !!defaultValues;
  const d = defaultValues;
  const statuses = ['active', 'archived', 'promoted', 'rejected'] as const;

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

      {/* Asset Class + Priority */}
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
        <Field label="Priority">
          <select
            name="priority"
            defaultValue={d?.priority ?? ''}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="">— not set —</option>
            {CONVICTION_LEVELS.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Current Price + Fair Value + Currency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Current Price (optional)">
          <input
            type="text"
            name="current_price"
            defaultValue={d?.current_price ?? ''}
            placeholder="e.g. $182.50"
            className={inputClass}
          />
        </Field>
        <Field label="Fair Value (optional)">
          <input
            type="text"
            name="fair_value"
            defaultValue={d?.fair_value ?? ''}
            placeholder="e.g. $220"
            className={inputClass}
          />
        </Field>
        <Field label="Currency">
          <select
            name="currency"
            defaultValue={d?.currency ?? 'USD'}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="USD">USD</option>
            <option value="VND">VND</option>
          </select>
        </Field>
      </div>

      {/* Conviction Score */}
      <Field label="Conviction Score (1–10, optional)">
        <input
          type="number"
          inputMode="decimal"
          name="conviction_score"
          min="1"
          max="10"
          defaultValue={d?.conviction_score ?? ''}
          placeholder="e.g. 7"
          className={inputClass}
        />
      </Field>

      {/* Thesis */}
      <Field label="Thesis">
        <textarea
          name="thesis"
          rows={3}
          defaultValue={d?.thesis ?? ''}
          placeholder="Why are you watching this? Core investment case…"
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Conviction Rationale */}
      <Field label="Conviction Rationale (optional)">
        <textarea
          name="conviction_rationale"
          rows={2}
          defaultValue={d?.conviction_rationale ?? ''}
          placeholder="Why this score? What would increase or decrease it?"
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Target Entry + Next Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Target Entry (optional)">
          <input
            type="text"
            name="target_entry"
            defaultValue={d?.target_entry ?? ''}
            placeholder="e.g. $180–$200, below 20x P/E"
            className={inputClass}
          />
        </Field>
        <Field label="Next Action (optional)">
          <input
            type="text"
            name="next_action"
            defaultValue={d?.next_action ?? ''}
            placeholder="e.g. Wait for Q3 earnings"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Note */}
      <Field label="Short Note (optional)">
        <input
          type="text"
          name="note"
          defaultValue={d?.note ?? ''}
          placeholder="Quick label or flag note"
          className={inputClass}
        />
      </Field>

      {/* Review Cadence + Review Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Review Cadence (optional)">
          <select
            name="review_cadence"
            defaultValue={d?.review_cadence ?? ''}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="">No scheduled review</option>
            {REVIEW_CADENCES.map((c) => (
              <option key={c} value={c}>{REVIEW_CADENCE_LABELS[c]}</option>
            ))}
          </select>
        </Field>
        <Field label="Next Review Date (optional)">
          <input
            type="date"
            name="review_date"
            defaultValue={d?.review_date ?? ''}
            className={inputClass}
          />
        </Field>
      </div>

      {/* Status (edit only) + Alert flag */}
      <div className="flex items-center gap-6 flex-wrap">
        {isEdit && (
          <Field label="Status">
            <select
              name="status"
              defaultValue={d?.status ?? 'active'}
              className={`${inputClass} appearance-none cursor-pointer`}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </Field>
        )}
        <div className="flex items-center gap-3 pt-5">
          <input
            type="checkbox"
            name="alert_flag"
            id="alert_flag"
            defaultChecked={d?.alert_flag ?? false}
            className="w-4 h-4 rounded bg-[#1C1C21] border border-[#26262B] text-indigo-600"
          />
          <label htmlFor="alert_flag" className="text-sm text-zinc-400 cursor-pointer">
            Flag for alert
          </label>
        </div>
      </div>

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
