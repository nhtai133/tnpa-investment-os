'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  ASSET_PURPOSES,
  BANK_ACCOUNT_STATUSES,
  BANK_ACCOUNT_TYPES,
  BANK_CREDIT_STATUSES,
  BANK_DEPOSIT_STATUSES,
  BANK_FACILITY_TYPES,
  type BankAccount,
  type BankCreditCard,
  type BankCreditFacility,
  type BankSavingsDeposit,
} from '@/db/schema';
import { PURPOSE_LABELS } from '@/lib/formatters';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
    >
      {pending ? 'Saving...' : label}
    </button>
  );
}

function Footer({ label, cancelHref }: { label: string; cancelHref: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <SubmitButton label={label} />
      <a href={cancelHref} className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        Cancel
      </a>
    </div>
  );
}

export function BankAccountForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: BankAccount;
}) {
  const [currency, setCurrency] = useState(defaultValues?.currency ?? 'VND');

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Bank">
          <input name="bank_name" required defaultValue={defaultValues?.bank_name} placeholder="Techcombank" className={inputClass} />
        </Field>
        <Field label="Account Name">
          <input name="account_name" required defaultValue={defaultValues?.account_name} placeholder="Main checking" className={inputClass} />
        </Field>
        <Field label="Account Number">
          <input name="account_number" defaultValue={defaultValues?.account_number ?? ''} placeholder="1234567890" className={inputClass} />
        </Field>
        <Field label="Account Type">
          <select name="account_type" defaultValue={defaultValues?.account_type ?? 'Reserve'} className={`${inputClass} appearance-none`}>
            {BANK_ACCOUNT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </Field>
        <Field label="Balance">
          <CurrencyInput name="balance" currency={currency} required defaultValue={defaultValues?.balance ?? 0} className={inputClass} />
        </Field>
        <Field label="Currency">
          <select name="currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className={`${inputClass} appearance-none`}>
            <option value="VND">VND</option>
            <option value="USD">USD</option>
          </select>
        </Field>
        <Field label="Portfolio Purpose">
          <select name="purpose" defaultValue={defaultValues?.purpose ?? 'liquidity_reserve'} className={`${inputClass} appearance-none`}>
            {ASSET_PURPOSES.map((purpose) => (
              <option key={purpose} value={purpose}>
                {PURPOSE_LABELS[purpose]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="VIP Tier">
          <input name="vip_tier" defaultValue={defaultValues?.vip_tier ?? ''} placeholder="Priority, Private..." className={inputClass} />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={defaultValues?.status ?? 'active'} className={`${inputClass} appearance-none`}>
            {BANK_ACCOUNT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Custom Purpose">
        <textarea
          name="custom_purpose"
          rows={3}
          defaultValue={defaultValues?.custom_purpose ?? ''}
          placeholder="BIDV dùng để trữ tiền đầu tư chứng khoán và cho vay cá nhân"
          className={`${inputClass} resize-none`}
        />
      </Field>
      <Field label="Notes">
        <textarea name="notes" rows={4} defaultValue={defaultValues?.notes ?? ''} className={`${inputClass} resize-none`} />
      </Field>

      {!defaultValues && (
        <div className="rounded-lg border border-[#26262B] bg-[#101014] px-4 py-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="link_to_lifecycle"
              className="mt-0.5 h-4 w-4 accent-indigo-600 flex-shrink-0"
            />
            <div>
              <p className="text-sm text-zinc-200 font-medium">Register for transaction tracking</p>
              <p className="text-xs text-zinc-500 mt-1">
                Use this account as a funding source in transactions. Adds it to the Lifecycle Account Registry.
              </p>
            </div>
          </label>
        </div>
      )}

      <Footer label={defaultValues ? 'Update Account' : 'Add Account'} cancelHref="/banking" />
    </form>
  );
}

export function SavingsDepositForm({
  action,
  accounts,
  defaultValues,
}: {
  action: (formData: FormData) => Promise<void>;
  accounts: BankAccount[];
  defaultValues?: BankSavingsDeposit;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Linked Account">
          <select name="bank_account_id" defaultValue={defaultValues?.bank_account_id ?? ''} className={`${inputClass} appearance-none`}>
            <option value="">No linked account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.bank_name} - {account.account_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Bank">
          <input name="bank_name" defaultValue={defaultValues?.bank_name ?? ''} placeholder="Techcombank" className={inputClass} />
        </Field>
        <Field label="Deposit Name">
          <input name="deposit_name" required defaultValue={defaultValues?.deposit_name} placeholder="6M savings ladder" className={inputClass} />
        </Field>
        <Field label="Principal">
          <CurrencyInput name="principal" currency="VND" required defaultValue={defaultValues?.principal ?? 0} className={inputClass} />
        </Field>
        <Field label="Interest Rate">
          <input type="number" step="0.01" name="interest_rate" defaultValue={defaultValues?.interest_rate ?? 0} className={inputClass} />
        </Field>
        <Field label="Term Months">
          <input type="number" name="term_months" defaultValue={defaultValues?.term_months ?? 0} className={inputClass} />
        </Field>
        <Field label="Start Date">
          <input type="date" name="start_date" defaultValue={defaultValues?.start_date ?? ''} className={inputClass} />
        </Field>
        <Field label="Maturity Date">
          <input type="date" name="maturity_date" defaultValue={defaultValues?.maturity_date ?? ''} className={inputClass} />
        </Field>
        <Field label="Payout Type">
          <input name="interest_payout_type" defaultValue={defaultValues?.interest_payout_type ?? ''} placeholder="At maturity, monthly..." className={inputClass} />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={defaultValues?.status ?? 'active'} className={`${inputClass} appearance-none`}>
            {BANK_DEPOSIT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </Field>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" name="auto_renew" defaultChecked={defaultValues?.auto_renew ?? false} className="h-4 w-4 accent-indigo-600" />
        Auto renew
      </label>
      <Field label="Notes">
        <textarea name="notes" rows={4} defaultValue={defaultValues?.notes ?? ''} className={`${inputClass} resize-none`} />
      </Field>
      <Footer label={defaultValues ? 'Update Deposit' : 'Add Deposit'} cancelHref="/banking" />
    </form>
  );
}

export function CreditCardForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: BankCreditCard;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Bank">
          <input name="bank_name" required defaultValue={defaultValues?.bank_name} placeholder="Techcombank" className={inputClass} />
        </Field>
        <Field label="Card Name">
          <input name="card_name" required defaultValue={defaultValues?.card_name} placeholder="Visa Signature" className={inputClass} />
        </Field>
        <Field label="Network">
          <input name="card_network" defaultValue={defaultValues?.card_network ?? ''} placeholder="Visa, Mastercard..." className={inputClass} />
        </Field>
        <Field label="Credit Limit">
          <CurrencyInput name="credit_limit" currency="VND" defaultValue={defaultValues?.credit_limit ?? 0} className={inputClass} />
        </Field>
        <Field label="Current Used">
          <CurrencyInput name="current_used" currency="VND" defaultValue={defaultValues?.current_used ?? 0} className={inputClass} />
        </Field>
        <Field label="Available Limit">
          <CurrencyInput name="available_limit" currency="VND" defaultValue={defaultValues?.available_limit ?? 0} className={inputClass} />
        </Field>
        <Field label="Statement Date">
          <input type="date" name="statement_date" defaultValue={defaultValues?.statement_date ?? ''} className={inputClass} />
        </Field>
        <Field label="Due Date">
          <input type="date" name="due_date" defaultValue={defaultValues?.due_date ?? ''} className={inputClass} />
        </Field>
        <Field label="Annual Fee">
          <CurrencyInput name="annual_fee" currency="VND" defaultValue={defaultValues?.annual_fee ?? 0} className={inputClass} />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={defaultValues?.status ?? 'active'} className={`${inputClass} appearance-none`}>
            {BANK_CREDIT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Notes">
        <textarea name="notes" rows={4} defaultValue={defaultValues?.notes ?? ''} className={`${inputClass} resize-none`} />
      </Field>
      <Footer label={defaultValues ? 'Update Card' : 'Add Card'} cancelHref="/banking" />
    </form>
  );
}

export function CreditFacilityForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: BankCreditFacility;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Bank">
          <input name="bank_name" required defaultValue={defaultValues?.bank_name} placeholder="Techcombank" className={inputClass} />
        </Field>
        <Field label="Facility Name">
          <input name="facility_name" required defaultValue={defaultValues?.facility_name} placeholder="Techcombank ShopCash" className={inputClass} />
        </Field>
        <Field label="Facility Type">
          <select name="facility_type" defaultValue={defaultValues?.facility_type ?? 'Other'} className={`${inputClass} appearance-none`}>
            {BANK_FACILITY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </Field>
        <Field label="Limit Amount">
          <CurrencyInput name="limit_amount" currency="VND" defaultValue={defaultValues?.limit_amount ?? 0} className={inputClass} />
        </Field>
        <Field label="Current Used">
          <CurrencyInput name="current_used" currency="VND" defaultValue={defaultValues?.current_used ?? 0} className={inputClass} />
        </Field>
        <Field label="Available Amount">
          <CurrencyInput name="available_amount" currency="VND" defaultValue={defaultValues?.available_amount ?? 0} className={inputClass} />
        </Field>
        <Field label="Interest Rate">
          <input type="number" step="0.01" name="interest_rate" defaultValue={defaultValues?.interest_rate ?? 0} className={inputClass} />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={defaultValues?.status ?? 'active'} className={`${inputClass} appearance-none`}>
            {BANK_CREDIT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Fee Rule">
        <input name="fee_rule" defaultValue={defaultValues?.fee_rule ?? ''} className={inputClass} />
      </Field>
      <Field label="Due Rule">
        <input name="due_rule" defaultValue={defaultValues?.due_rule ?? ''} className={inputClass} />
      </Field>
      <Field label="Notes">
        <textarea name="notes" rows={4} defaultValue={defaultValues?.notes ?? ''} className={`${inputClass} resize-none`} />
      </Field>
      <Footer label={defaultValues ? 'Update Facility' : 'Add Facility'} cancelHref="/banking" />
    </form>
  );
}
