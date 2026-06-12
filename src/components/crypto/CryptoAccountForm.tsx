'use client';

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
  const [accountType, setAccountType] = useState<'crypto_exchange' | 'crypto_wallet'>('crypto_exchange');

  const isExchange = accountType === 'crypto_exchange';

  return (
    <form action={action} className="space-y-5">
      {returnUrl && <input type="hidden" name="return_url" value={returnUrl} />}

      <Field label="Account Type">
        <select
          name="type"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value as 'crypto_exchange' | 'crypto_wallet')}
          className={`${inputClass} appearance-none cursor-pointer`}
        >
          <option value="crypto_exchange">Exchange (Binance, Bybit, OKX…)</option>
          <option value="crypto_wallet">Wallet (Ledger, Trezor, Metamask…)</option>
        </select>
      </Field>

      <Field label="Account Name">
        <input
          name="name"
          required
          placeholder={isExchange ? 'Binance Main' : 'Ledger Nano X'}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={isExchange ? 'Exchange Platform' : 'Wallet Brand / Chain'}>
          <input
            name="institution"
            placeholder={isExchange ? 'Binance, Bybit, OKX, Coinbase…' : 'Ledger, Trezor, Metamask, Rabby…'}
            className={inputClass}
          />
        </Field>
        <Field label={isExchange ? 'Account / UID (masked)' : 'Public Address (optional)'}>
          <input
            name="account_number_masked"
            placeholder={isExchange ? '****5678 or UID 12345' : '0x…abcd'}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Currency">
          <select name="currency" defaultValue="USD" className={`${inputClass} appearance-none cursor-pointer`}>
            <option value="USD">USD</option>
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>
        </Field>
        <Field label="Current Balance">
          <input
            name="current_balance"
            type="number"
            inputMode="decimal"
            step="0.00000001"
            defaultValue="0"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Notes (optional)">
        <textarea
          name="notes"
          rows={3}
          placeholder={isExchange ? 'Margin enabled, API key linked, spot/futures…' : 'Chain, security setup, purpose…'}
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <SubmitButton />
        <a
          href={returnUrl ?? '/crypto/accounts'}
          className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
