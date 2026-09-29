'use client';
import { tr } from '@/i18n';


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

export function AccountForm({ action, banks = [] }: { banks?: { id: number; bank_name: string; account_name: string }[]; action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="space-y-5">
      <Field label={tr("Name")}>
        <input name="name" required placeholder={tr("Main bank account")} className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={tr("Type")}>
          <select name="type" required defaultValue="bank_account" className={`${inputClass} appearance-none`}>
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {tr(type.replaceAll('_', ' '))}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr("Currency")}>
          <select name="currency" defaultValue="USD" className={`${inputClass} appearance-none`}>
            <option value="USD">{tr("USD")}</option>
            <option value="VND">{tr("VND")}</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={tr("Institution")}>
          <input name="institution" placeholder={tr("BIDV, VCBS, Binance")} className={inputClass} />
        </Field>
        <Field label={tr("Masked Account Number")}>
          <input name="account_number_masked" placeholder="****1234" className={inputClass} />
        </Field>
      </div>

      <Field label={tr("Existing Banking account (optional)")}>
        <select name="bank_account_id" className={inputClass} defaultValue="">
          <option value="">{tr("Separate cash account")}</option>
          {banks.map(b => <option key={b.id} value={b.id}>{b.bank_name} · {b.account_name}</option>)}
        </select>
        <p className="text-xs text-zinc-500">{tr("For an existing Banking account, use its balance once. The balance below is ignored when linked.")}</p>
      </Field>
      <Field label={tr("Current Balance")}>
        <input name="current_balance" type="number" inputMode="decimal" step="0.01" defaultValue="0" className={inputClass} />
      </Field>

      <Field label={tr("Notes")}>
        <textarea name="notes" rows={3} className={`${inputClass} resize-none`} />
      </Field>

      <div className="flex items-center gap-3">
        <SubmitButton />
        <a href="/accounts" className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          {tr("Cancel")}</a>
      </div>
    </form>
  );
}
