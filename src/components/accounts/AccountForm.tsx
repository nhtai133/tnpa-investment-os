'use client';

import { useFormStatus } from 'react-dom';
import { ACCOUNT_TYPES } from '@/db/schema';

const inputClass =
  'w-full bg-[#1C1C21] border border-[#26262B] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors';
const labelClass = 'block text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-1.5';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
    >
      {pending ? 'Saving...' : 'Add Account'}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

export function AccountForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="space-y-5">
      <Field label="Name">
        <input name="name" required placeholder="BIDV 8888791996" className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Type">
          <select name="type" required defaultValue="bank_account" className={`${inputClass} appearance-none`}>
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Currency">
          <select name="currency" defaultValue="USD" className={`${inputClass} appearance-none`}>
            <option value="USD">USD</option>
            <option value="VND">VND</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Institution">
          <input name="institution" placeholder="BIDV, VCBS, Binance" className={inputClass} />
        </Field>
        <Field label="Masked Account Number">
          <input name="account_number_masked" placeholder="****91996" className={inputClass} />
        </Field>
      </div>

      <Field label="Current Balance">
        <input name="current_balance" type="number" inputMode="decimal" step="0.01" defaultValue="0" className={inputClass} />
      </Field>

      <Field label="Notes">
        <textarea name="notes" rows={3} className={`${inputClass} resize-none`} />
      </Field>

      <div className="flex items-center gap-3">
        <SubmitButton />
        <a href="/accounts" className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
