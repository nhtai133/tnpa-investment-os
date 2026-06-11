'use client';

import { useFormStatus } from 'react-dom';
import type { Asset } from '@/db/schema';
import { TRANSACTION_TYPES } from '@/db/schema';
import { TRANSACTION_TYPE_LABELS } from '@/lib/formatters';

const inputClass =
  'w-full bg-[#1C1C21] border border-[#26262B] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors';
const labelClass =
  'block text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-1.5';

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
      {pending ? 'Saving…' : 'Add Transaction'}
    </button>
  );
}

interface TransactionFormProps {
  action: (formData: FormData) => Promise<void>;
  assets: Asset[];
  preselectedAssetId?: number;
  cancelHref?: string;
}

export function TransactionForm({
  action,
  assets,
  preselectedAssetId,
  cancelHref = '/transactions',
}: TransactionFormProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <form action={action} className="space-y-5">

      {/* Date + Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Date">
          <input
            type="date"
            name="transaction_date"
            defaultValue={todayStr}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Type">
          <select
            name="type"
            required
            defaultValue=""
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="" disabled>Select type…</option>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TRANSACTION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Asset */}
      {preselectedAssetId ? (
        <input type="hidden" name="asset_id" value={preselectedAssetId} />
      ) : (
        <Field label="Asset (optional)">
          <select
            name="asset_id"
            defaultValue=""
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="">No asset — cash / general transaction</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}{a.symbol ? ` (${a.symbol})` : ''}
              </option>
            ))}
          </select>
        </Field>
      )}

      {/* Amount + Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Amount">
          <input
            type="number"
            inputMode="decimal"
            name="amount"
            step="0.01"
            required
            placeholder="e.g. 5000"
            className={inputClass}
          />
        </Field>
        <Field label="Currency">
          <select
            name="currency"
            defaultValue="USD"
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="USD">USD</option>
            <option value="VND">VND</option>
          </select>
        </Field>
      </div>

      {/* Quantity + Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Quantity (optional)">
          <input
            type="number"
            inputMode="decimal"
            name="quantity"
            step="any"
            placeholder="e.g. 0.05 BTC"
            className={inputClass}
          />
        </Field>
        <Field label="Price per unit (optional)">
          <input
            type="number"
            inputMode="decimal"
            name="price"
            step="0.01"
            placeholder="e.g. 95000"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Fees */}
      <Field label="Fees (optional)">
        <input
          type="number"
          inputMode="decimal"
          name="fees"
          step="0.01"
          placeholder="e.g. 2.50"
          className={inputClass}
        />
      </Field>

      {/* Notes */}
      <Field label="Notes (optional)">
        <textarea
          name="notes"
          rows={3}
          placeholder="Order ID, broker, context…"
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <SubmitButton />
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
