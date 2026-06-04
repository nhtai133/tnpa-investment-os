'use client';

import { useFormStatus } from 'react-dom';
import { ASSET_CLASSES, ASSET_PURPOSES, type Asset } from '@/db/schema';
import { ASSET_CLASS_LABELS, PURPOSE_LABELS } from '@/lib/formatters';

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
      {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Asset'}
    </button>
  );
}

interface AssetFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: Partial<Asset>;
}

export function AssetForm({ action, defaultValues }: AssetFormProps) {
  const isEdit = !!defaultValues;

  return (
    <form action={action} className="space-y-5">
      {/* Row 1: Name + Symbol */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Field label="Name">
            <input
              type="text"
              name="name"
              required
              maxLength={200}
              defaultValue={defaultValues?.name ?? ''}
              placeholder="e.g. Apple Inc."
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Symbol (optional)">
          <input
            type="text"
            name="symbol"
            maxLength={20}
            defaultValue={defaultValues?.symbol ?? ''}
            placeholder="e.g. AAPL"
            className={`${inputClass} uppercase`}
          />
        </Field>
      </div>

      {/* Row 2: Asset Class + Purpose */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Asset Class">
          <select
            name="asset_class"
            required
            defaultValue={defaultValues?.asset_class ?? ''}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="" disabled>Select class…</option>
            {ASSET_CLASSES.map((c) => (
              <option key={c} value={c}>{ASSET_CLASS_LABELS[c]}</option>
            ))}
          </select>
        </Field>
        <Field label="Asset Purpose">
          <select
            name="purpose"
            required
            defaultValue={defaultValues?.purpose ?? ''}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="" disabled>Select purpose…</option>
            {ASSET_PURPOSES.map((p) => (
              <option key={p} value={p}>{PURPOSE_LABELS[p]}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Row 3: Value + Currency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Field label="Current Value">
            <input
              type="number"
              name="current_value"
              required
              min="0"
              step="0.01"
              defaultValue={defaultValues?.current_value ?? ''}
              placeholder="0.00"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Currency">
          <input
            type="text"
            name="currency"
            maxLength={10}
            defaultValue={defaultValues?.currency ?? 'USD'}
            placeholder="USD"
            className={`${inputClass} uppercase`}
          />
        </Field>
      </div>

      {/* Row 4: Quantity + Cost Basis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Quantity (optional)">
          <input
            type="number"
            name="quantity"
            min="0"
            step="any"
            defaultValue={defaultValues?.quantity ?? ''}
            placeholder="e.g. 100 shares"
            className={inputClass}
          />
        </Field>
        <Field label="Cost Basis (optional)">
          <input
            type="number"
            name="cost_basis"
            min="0"
            step="0.01"
            defaultValue={defaultValues?.cost_basis ?? ''}
            placeholder="Total amount paid"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Notes */}
      <Field label="Notes (optional)">
        <textarea
          name="notes"
          rows={3}
          maxLength={1000}
          defaultValue={defaultValues?.notes ?? ''}
          placeholder="Thesis summary, terms, review triggers…"
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <SubmitButton isEdit={isEdit} />
        <a
          href={isEdit && defaultValues?.id ? `/holdings/${defaultValues.id}` : '/holdings'}
          className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
