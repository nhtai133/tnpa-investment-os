'use client';

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { AccountRegistry, Asset, TransactionType } from '@/db/schema';
import { TRANSACTION_TYPES } from '@/db/schema';
import { TRANSACTION_TYPE_LABELS } from '@/lib/formatters';
import type { TransactionFormState } from '@/app/transactions/actions';

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

const ASSET_REQUIRED_TYPES: TransactionType[] = ['buy', 'sell', 'transfer'];

interface TransactionFormProps {
  action: (prevState: TransactionFormState, formData: FormData) => Promise<TransactionFormState>;
  assets: Asset[];
  accounts: AccountRegistry[];
  preselectedAssetId?: number;
  cancelHref?: string;
}

export function TransactionForm({
  action,
  assets,
  accounts,
  preselectedAssetId,
  cancelHref = '/transactions',
}: TransactionFormProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [state, formAction] = useFormState(action, null);
  const [type, setType] = useState<TransactionType | ''>('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [fee, setFee] = useState('');
  const [tax, setTax] = useState('');

  const computedTradeAmount = useMemo(() => {
    const q = parseFloat(quantity);
    const p = parseFloat(price);
    return Number.isFinite(q) && Number.isFinite(p) ? q * p : 0;
  }, [quantity, price]);

  const feeAmount = parseFloat(fee) || 0;
  const taxAmount = parseFloat(tax) || 0;
  const totalCash = computedTradeAmount + feeAmount + taxAmount;

  const fundingAccounts = accounts.filter((account) =>
    ['bank_account', 'cash_location', 'crypto_exchange', 'crypto_wallet'].includes(account.type),
  );
  const executionAccounts = accounts.filter((account) =>
    ['broker_account', 'crypto_exchange'].includes(account.type),
  );
  const custodyAccounts = accounts.filter((account) =>
    ['broker_account', 'crypto_exchange', 'crypto_wallet', 'gold_storage', 'real_estate_registry', 'other_custody'].includes(account.type),
  );
  const receiveAccounts = accounts.filter((account) =>
    ['bank_account', 'broker_account', 'crypto_exchange', 'cash_location'].includes(account.type),
  );

  function AccountSelect({
    name,
    accounts: options,
    placeholder,
  }: {
    name: string;
    accounts: AccountRegistry[];
    placeholder: string;
  }) {
    return (
      <select name={name} defaultValue="" className={`${inputClass} appearance-none cursor-pointer`}>
        <option value="">{placeholder}</option>
        {options.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} - {account.type.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
    );
  }

  const assetRequired = ASSET_REQUIRED_TYPES.includes(type as TransactionType);

  return (
    <form action={formAction} className="space-y-5">

      {state?.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{state.error}</p>
        </div>
      )}

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
            onChange={(event) => setType(event.target.value as TransactionType)}
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
        <Field label={assetRequired ? 'Asset' : 'Asset (optional)'}>
          <select
            name="asset_id"
            defaultValue=""
            required={assetRequired}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="" disabled={assetRequired}>
              {assetRequired ? 'Select an asset…' : 'No asset - cash / general transaction'}
            </option>
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
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
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
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <input type="hidden" name="total_amount" value={type === 'buy' && computedTradeAmount > 0 ? computedTradeAmount : ''} />
      <input type="hidden" name="gross_proceeds" value={type === 'sell' && computedTradeAmount > 0 ? computedTradeAmount : ''} />

      {/* Fees + Tax */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Fee">
          <input
            type="number"
            inputMode="decimal"
            name="fees"
            step="0.01"
            placeholder="e.g. 2.50"
            value={fee}
            onChange={(event) => setFee(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Tax">
          <input
            type="number"
            inputMode="decimal"
            name="tax"
            step="0.01"
            placeholder="e.g. 0"
            value={tax}
            onChange={(event) => setTax(event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Settlement Date">
        <input type="date" name="settlement_date" className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Funding Source">
          <AccountSelect name="funding_account_id" accounts={fundingAccounts} placeholder="Select funding source..." />
        </Field>
        <Field label="Execution Venue">
          <AccountSelect name="execution_account_id" accounts={executionAccounts} placeholder="Select broker / exchange..." />
        </Field>
        <Field label="Custody Location">
          <AccountSelect name="custody_account_id" accounts={custodyAccounts} placeholder="Select custody location..." />
        </Field>
        <Field label="Receive Destination">
          <AccountSelect name="receive_account_id" accounts={receiveAccounts} placeholder="Select receive destination..." />
        </Field>
        <Field label="Transfer From">
          <AccountSelect name="from_custody_account_id" accounts={custodyAccounts} placeholder="Select source custody..." />
        </Field>
        <Field label="Transfer To">
          <AccountSelect name="to_custody_account_id" accounts={custodyAccounts} placeholder="Select destination custody..." />
        </Field>
      </div>

      <Field label="Network / Transfer Fee">
        <input
          type="number"
          inputMode="decimal"
          name="transfer_fee"
          step="0.01"
          placeholder="e.g. 8"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[#26262B] bg-[#101014] p-4">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
            Cash Movement Preview
          </p>
          <p className="mt-2 text-sm text-zinc-300 tabular-nums">
            {type === 'sell'
              ? `Estimated cash in: ${Math.max(computedTradeAmount - feeAmount - taxAmount, 0).toLocaleString()}`
              : type === 'buy'
                ? `Estimated cash out: ${totalCash.toLocaleString()}`
                : type === 'transfer'
                  ? 'No cash principal movement; transfer fee will be recorded.'
                  : 'Cash effect depends on transaction type.'}
          </p>
        </div>
        <div className="rounded-lg border border-[#26262B] bg-[#101014] p-4">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
            Asset Lifecycle Preview
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            {type === 'buy'
              ? 'Position increases and custody is assigned.'
              : type === 'sell'
                ? 'Position decreases and realized P&L is calculated.'
                : type === 'transfer'
                  ? 'Quantity moves between custody locations with cost basis preserved.'
                  : 'Select a type to preview lifecycle impact.'}
          </p>
        </div>
      </div>

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
