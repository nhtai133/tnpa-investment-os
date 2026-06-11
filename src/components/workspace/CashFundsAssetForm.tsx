'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';

const PURPOSE_OPTIONS = [
  { value: 'liquidity_reserve', label: 'Liquidity Reserve' },
  { value: 'wealth_compounder', label: 'Wealth Compounder' },
  { value: 'income_generator', label: 'Income Generator' },
  { value: 'opportunity_capital', label: 'Opportunity Capital' },
  { value: 'store_of_value', label: 'Store of Value' },
  { value: 'strategic_asset', label: 'Strategic Asset' },
];

const ACCOUNT_TYPES = [
  { value: 'Cash', label: 'Cash', assetClass: 'cash', purpose: 'liquidity_reserve' },
  { value: 'Savings', label: 'Savings', assetClass: 'cash', purpose: 'liquidity_reserve' },
  { value: 'Term Deposit', label: 'Term Deposit', assetClass: 'cash', purpose: 'liquidity_reserve' },
  { value: 'Fund', label: 'Fund', assetClass: 'funds', purpose: 'wealth_compounder' },
  { value: 'ETF', label: 'ETF', assetClass: 'funds', purpose: 'wealth_compounder' },
] as const;

const inputClass =
  'w-full bg-[#1C1C21] border border-[#26262B] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-700 transition-colors';

const labelClass =
  'block text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-1.5';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
    >
      {pending ? 'Saving…' : '+ Add Asset'}
    </button>
  );
}

interface CashFundsAssetFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function CashFundsAssetForm({ action }: CashFundsAssetFormProps) {
  const [accountType, setAccountType] = useState<string>('Cash');
  const [purpose, setPurpose] = useState<string>('liquidity_reserve');

  function handleAccountTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newType = e.target.value;
    const config = ACCOUNT_TYPES.find((t) => t.value === newType);
    setAccountType(newType);
    if (config) setPurpose(config.purpose);
  }

  const assetClass =
    ACCOUNT_TYPES.find((t) => t.value === accountType)?.assetClass ?? 'cash';

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="asset_class" value={assetClass} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className={labelClass}>
            Asset Name <span className="text-zinc-700">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="Emergency Fund, VFMVF4, Fixed Deposit…"
            maxLength={200}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Type <span className="text-zinc-700">*</span>
          </label>
          <select
            name="account_type"
            value={accountType}
            onChange={handleAccountTypeChange}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-zinc-600">
            {assetClass === 'funds' ? 'Saved as: Funds' : 'Saved as: Cash'}
          </p>
        </div>

        <div>
          <label className={labelClass}>Institution / Bank / Broker</label>
          <input
            type="text"
            name="institution"
            placeholder="Vietcombank, Techcombank, VCBS…"
            maxLength={200}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Balance / Current Value <span className="text-zinc-700">*</span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            name="current_value"
            required
            placeholder="50000000"
            min="0"
            step="any"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Cost Basis (optional)</label>
          <input
            type="number"
            inputMode="decimal"
            name="cost_basis"
            placeholder="Initial deposit / NAV cost"
            min="0"
            step="any"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Interest / Return Rate (% p.a.)</label>
          <input
            type="number"
            inputMode="decimal"
            name="interest_rate"
            placeholder="5.5"
            min="0"
            step="any"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Maturity Date</label>
          <input
            type="date"
            name="maturity_date"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Currency</label>
          <select
            name="currency"
            defaultValue="VND"
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="VND">VND</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>
            Purpose <span className="text-zinc-700">*</span>
          </label>
          <select
            name="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            {PURPOSE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Notes</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Account details, renewal strategy, withdrawal conditions…"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <SubmitButton />
        <Link
          href="/cash-funds"
          className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
