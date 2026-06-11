'use client';

import { useFormStatus } from 'react-dom';
import type { Asset } from '@/db/schema';
import { DECISION_TYPE_LABELS, PURPOSE_LABELS } from '@/lib/formatters';
import { ASSET_PURPOSES, REVIEW_CADENCES } from '@/db/schema';
import { REVIEW_CADENCE_LABELS } from '@/lib/calendar';

const DECISION_TYPES = ['buy', 'add', 'hold', 'rebalance', 'review', 'trim', 'reduce', 'sell', 'reject', 'monitor'] as const;

const inputClass =
  'w-full bg-[#1C1C21] border border-[#26262B] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-700 transition-colors';
const labelClass = 'block text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-1.5';

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {hint && <p className="text-[10px] text-zinc-700 mt-1">{hint}</p>}
    </div>
  );
}

function SubmitButton({ label = 'Save Decision' }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
    >
      {pending ? 'Saving…' : label}
    </button>
  );
}

interface DecisionFormProps {
  action: (formData: FormData) => Promise<void>;
  assets?: Asset[];
  preselectedAssetId?: number;
  preselectedType?: string;
  preselectedTitle?: string;
  cancelHref: string;
  redirectTo?: string;
  submitLabel?: string;
  defaultValues?: {
    title?: string | null;
    decision_type?: string | null;
    decision_date?: string | null;
    next_review_date?: string | null;
    review_cadence?: string | null;
    rationale?: string | null;
    purpose?: string | null;
    expected_return?: string | null;
    time_horizon?: string | null;
    risks?: string | null;
    invalidation_conditions?: string | null;
    confidence?: number | null;
    extended_notes?: string | null;
    amount?: number | null;
  };
}

export function DecisionForm({
  action,
  assets,
  preselectedAssetId,
  preselectedType,
  preselectedTitle,
  cancelHref,
  redirectTo,
  submitLabel = 'Save Decision',
  defaultValues,
}: DecisionFormProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <form action={action} className="space-y-5">
      {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}

      {/* Title */}
      <Field label="Title">
        <input
          type="text"
          name="title"
          required
          defaultValue={defaultValues?.title ?? preselectedTitle ?? ''}
          placeholder="e.g. Initiated BTC position ahead of halving"
          className={inputClass}
        />
      </Field>

      {/* Decision Type + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Decision Type">
          <select
            name="decision_type"
            required
            defaultValue={defaultValues?.decision_type ?? preselectedType ?? ''}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="" disabled>Select type…</option>
            {DECISION_TYPES.map((t) => (
              <option key={t} value={t}>{DECISION_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>
        <Field label="Decision Date">
          <input
            type="date"
            name="decision_date"
            defaultValue={defaultValues?.decision_date ?? todayStr}
            required
            className={inputClass}
          />
        </Field>
      </div>

      {/* Asset (optional) */}
      {preselectedAssetId ? (
        <input type="hidden" name="asset_id" value={preselectedAssetId} />
      ) : assets && assets.length > 0 ? (
        <Field label="Asset (optional)">
          <select
            name="asset_id"
            defaultValue=""
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="">No specific asset…</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}{a.symbol ? ` (${a.symbol})` : ''}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {/* Purpose Bucket */}
      <Field label="Purpose Bucket (optional)">
        <select
          name="purpose"
          defaultValue={defaultValues?.purpose ?? ''}
          className={`${inputClass} appearance-none cursor-pointer`}
        >
          <option value="">No bucket…</option>
          {ASSET_PURPOSES.map((p) => (
            <option key={p} value={p}>{PURPOSE_LABELS[p]}</option>
          ))}
        </select>
      </Field>

      {/* Thesis / Rationale */}
      <Field label="Thesis" hint="Why are you making this decision? What conviction drives it?">
        <textarea
          name="rationale"
          required
          rows={4}
          defaultValue={defaultValues?.rationale ?? ''}
          placeholder="The investment thesis behind this decision…"
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Expected Return + Time Horizon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Expected Return (optional)">
          <input
            type="text"
            name="expected_return"
            defaultValue={defaultValues?.expected_return ?? ''}
            placeholder="e.g. 20-30% over 12 months"
            className={inputClass}
          />
        </Field>
        <Field label="Time Horizon (optional)">
          <input
            type="text"
            name="time_horizon"
            defaultValue={defaultValues?.time_horizon ?? ''}
            placeholder="e.g. 12–18 months"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Risks */}
      <Field label="Risks (optional)" hint="Key risks that could invalidate the thesis.">
        <textarea
          name="risks"
          rows={3}
          defaultValue={defaultValues?.risks ?? ''}
          placeholder="What could go wrong?"
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Invalidation Conditions */}
      <Field label="Invalidation Conditions (optional)" hint="What specific events or signals would prove this decision wrong?">
        <textarea
          name="invalidation_conditions"
          rows={2}
          defaultValue={defaultValues?.invalidation_conditions ?? ''}
          placeholder="e.g. Price breaks below $X, fundamentals deteriorate…"
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Review Cadence + Next Review Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Review Cadence (optional)">
          <select
            name="review_cadence"
            defaultValue={defaultValues?.review_cadence ?? ''}
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
            name="next_review_date"
            defaultValue={defaultValues?.next_review_date ?? ''}
            className={inputClass}
          />
        </Field>
      </div>

      {/* Confidence + Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Confidence (1–10, optional)">
          <input
            type="number"
            inputMode="decimal"
            name="confidence"
            min={1}
            max={10}
            step={1}
            defaultValue={defaultValues?.confidence ?? ''}
            placeholder="7"
            className={inputClass}
          />
        </Field>
        <Field label="Amount (optional)">
          <input
            type="number"
            inputMode="decimal"
            name="amount"
            step="0.01"
            defaultValue={defaultValues?.amount ?? ''}
            placeholder="e.g. 5000"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Notes */}
      <Field label="Notes (optional)">
        <textarea
          name="extended_notes"
          rows={2}
          defaultValue={defaultValues?.extended_notes ?? ''}
          placeholder="Additional context, links, or follow-ups…"
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <SubmitButton label={submitLabel} />
        <a href={cancelHref} className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
