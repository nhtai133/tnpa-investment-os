'use client';
import { tr } from '@/i18n';


import { useFormStatus } from 'react-dom';

const inputClass =
  'w-full bg-[#1C1C21] border border-[#26262B] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors';
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
      {pending ? tr('Saving...') : tr('Add Broker Account')}
    </button>
  );
}

export function BrokerAccountForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="space-y-5">
      <Field label={tr("Account Name")}>
        <input
          name="name"
          required
          placeholder={tr("VCBS Main, SSI Flexi...")}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={tr("Broker / Institution")}>
          <input
            name="institution"
            list="stock-broker-options"
            placeholder={tr("ACBS, VPBankS, or another broker")}
            className={inputClass}
          />
          <datalist id="stock-broker-options"><option value="ACBS" /><option value="VPBankS" /></datalist>
        </Field>
        <Field label={tr("Masked Account Number")}>
          <input
            name="account_number_masked"
            placeholder="****1234"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label={tr("Currency")}>
        <select name="currency" defaultValue="VND" className={`${inputClass} appearance-none cursor-pointer`}>
          <option value="VND">{tr("VND")}</option>
          <option value="USD">{tr("USD")}</option>
        </select>
      </Field>

      <p className="text-xs text-zinc-600">
        {tr("Broker cash is calculated from opening cash, deposits, withdrawals, trades, dividends and fees. Enter any cash already held using the opening cash action inside Stocks.")}
      </p>

      <Field label={tr("Notes (optional)")}>
        <textarea
          name="notes"
          rows={3}
          placeholder={tr("Margin enabled, linked bank account...")}
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <SubmitButton />
        <a
          href="/stocks/accounts"
          className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {tr("Cancel")}</a>
      </div>
    </form>
  );
}
