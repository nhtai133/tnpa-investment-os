'use client';
import { tr } from '@/i18n';


import { useState } from 'react';
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
      {pending ? 'Saving...' : 'Add Account'}
    </button>
  );
}

interface Props {
  action: (formData: FormData) => Promise<void>;
  returnUrl?: string;
}

export function CryptoAccountForm({ action, returnUrl }: Props) {
  const [accountType, setAccountType] = useState<'EXCHANGE' | 'HOT_WALLET' | 'COLD_WALLET'>('EXCHANGE');

  const isExchange = accountType === 'EXCHANGE';

  return (
    <form action={action} className="space-y-5">
      {returnUrl && <input type="hidden" name="return_url" value={returnUrl} />}

      <Field label={tr("Account Type")}>
        <select
          name="custody_type"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value as 'EXCHANGE' | 'HOT_WALLET' | 'COLD_WALLET')}
          className={`${inputClass} appearance-none cursor-pointer`}
        >
          <option value="EXCHANGE">{tr("Exchange (Binance, Bybit, OKX…)")}</option>
          <option value="HOT_WALLET">{tr("Hot wallet")}</option>
          <option value="COLD_WALLET">{tr("Cold wallet")}</option>
        </select>
      </Field>

      <Field label={tr("Account Name")}>
        <input
          name="name"
          required
          placeholder={isExchange ? 'Binance Main' : 'Ledger Nano X'}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={isExchange ? 'Exchange platform' : 'Wallet brand'}>
          <input
            name="institution"
            placeholder={isExchange ? 'Binance, Bybit, OKX' : 'Ledger, MetaMask'}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={tr("Currency")}>
          <select name="currency" defaultValue="USDT" className={`${inputClass} appearance-none cursor-pointer`}>
            <option value="USD">{tr("USD")}</option>
            <option value="USDT">{tr("USDT")}</option>
            <option value="USDC">{tr("USDC")}</option>
          </select>
        </Field>
      </div>

      <Field label={tr("Notes (optional)")}>
        <textarea
          name="notes"
          rows={3}
          placeholder={isExchange ? 'Manual tracking notes…' : 'Network, security setup…'}
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <SubmitButton />
        <a
          href={returnUrl ?? '/crypto/accounts'}
          className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {tr("Cancel")}</a>
      </div>
    </form>
  );
}
