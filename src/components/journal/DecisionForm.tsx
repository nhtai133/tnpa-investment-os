'use client';

import { useFormStatus } from 'react-dom';
import type { Asset } from '@/db/schema';
import { DECISION_TYPE_LABELS } from '@/lib/formatters';

const DECISION_TYPES = ['buy', 'add', 'hold', 'review', 'reduce', 'trim', 'sell', 'reject', 'monitor'] as const;

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
      {pending ? 'Saving…' : 'Log Decision'}
    </button>
  );
}

interface DecisionFormProps {
  action: (formData: FormData) => Promise<void>;
  assets?: Asset[];
  preselectedAssetId?: number;
  preselectedType?: string;
  cancelHref: string;
  redirectTo?: string;
}

export function DecisionForm({
  action,
  assets,
  preselectedAssetId,
  preselectedType,
  cancelHref,
  redirectTo,
}: DecisionFormProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <form action={action} className="space-y-5">
      {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}

      {/* Asset selector — shown only on global form, hidden when asset is pre-selected */}
      {preselectedAssetId ? (
        <input type="hidden" name="asset_id" value={preselectedAssetId} />
      ) : assets && assets.length > 0 ? (
        <Field label="Asset">
          <select
            name="asset_id"
            required
            defaultValue=""
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="" disabled>Select asset…</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}{a.symbol ? ` (${a.symbol})` : ''}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {/* Decision Type + Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Decision Type">
          <select
            name="decision_type"
            required
            defaultValue={preselectedType ?? ''}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="" disabled>Select type…</option>
            {DECISION_TYPES.map((t) => (
              <option key={t} value={t}>{DECISION_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input
            type="date"
            name="decision_date"
            defaultValue={todayStr}
            required
            className={inputClass}
          />
        </Field>
      </div>

      {/* Rationale */}
      <Field label="Rationale">
        <textarea
          name="rationale"
          required
          rows={4}
          placeholder="Why are you making this decision? What does the thesis say?"
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Amount */}
      <Field label="Amount (optional)">
        <input
          type="number"
          name="amount"
          step="0.01"
          placeholder="e.g. 5000 for buy, -2000 for sell/reduce"
          className={inputClass}
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <SubmitButton />
        <a href={cancelHref} className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
