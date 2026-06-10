'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';

const PURPOSE_OPTIONS = [
  { value: 'wealth_compounder', label: 'Wealth Compounder' },
  { value: 'income_generator', label: 'Income Generator' },
  { value: 'liquidity_reserve', label: 'Liquidity Reserve' },
  { value: 'opportunity_capital', label: 'Opportunity Capital' },
  { value: 'store_of_value', label: 'Store of Value' },
  { value: 'strategic_asset', label: 'Strategic Asset' },
];

const SYMBOL_SUGGESTIONS = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'BNB', 'MATIC', 'AVAX', 'DOGE', 'ADA'];

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
      {pending ? 'Saving…' : '+ Add Crypto Asset'}
    </button>
  );
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

interface CryptoAssetFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function CryptoAssetForm({ action }: CryptoAssetFormProps) {
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');

  const qty = parseFloat(quantity) || 0;
  const avg = parseFloat(avgCost) || 0;
  const price = parseFloat(currentPrice) || 0;

  const costBasis = qty * avg;
  const currentValue = qty * price;
  const pnl = currentValue - costBasis;
  const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

  const hasCalc = qty > 0 && (avg > 0 || price > 0);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="asset_class" value="crypto" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className={labelClass}>
            Asset Name <span className="text-zinc-700">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="Bitcoin"
            maxLength={200}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Symbol <span className="text-zinc-700">*</span>
          </label>
          <input
            type="text"
            name="symbol"
            required
            list="symbol-suggestions"
            placeholder="BTC"
            maxLength={20}
            className={`${inputClass} uppercase`}
          />
          <datalist id="symbol-suggestions">
            {SYMBOL_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div>
          <label className={labelClass}>Quantity</label>
          <input
            type="number"
            name="quantity"
            placeholder="0.00000000"
            min="0"
            step="0.00000001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Average Cost Per Coin (USD)</label>
          <input
            type="number"
            name="avg_cost_per_coin"
            placeholder="89000"
            min="0"
            step="any"
            value={avgCost}
            onChange={(e) => setAvgCost(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Current Price Per Coin (USD)</label>
          <input
            type="number"
            name="current_price_per_coin"
            placeholder="106000"
            min="0"
            step="any"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {hasCalc && (
        <div className="rounded-lg border border-[#26262B] bg-[#0C0C0E] px-4 py-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">
            Calculated
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-zinc-600 mb-0.5">Cost Basis</p>
              <p className="text-sm font-medium text-zinc-200 tabular-nums">
                {formatUSD(costBasis)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 mb-0.5">Current Value</p>
              <p className="text-sm font-medium text-zinc-200 tabular-nums">
                {formatUSD(currentValue)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 mb-0.5">Unrealized PnL</p>
              <p
                className={`text-sm font-medium tabular-nums ${
                  pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-red-400' : 'text-zinc-400'
                }`}
              >
                {pnl >= 0 ? '+' : ''}
                {formatUSD(pnl)}
                {costBasis > 0 && (
                  <span className="text-[10px] ml-1 opacity-70">
                    ({pnlPct >= 0 ? '+' : ''}
                    {pnlPct.toFixed(2)}%)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className={labelClass}>Wallet / Source</label>
          <input
            type="text"
            name="wallet_source"
            placeholder="e.g. Coinbase, Hardware Wallet, Binance"
            maxLength={200}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Purpose <span className="text-zinc-700">*</span>
          </label>
          <select
            name="purpose"
            defaultValue="wealth_compounder"
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
            placeholder="Thesis, custody notes, review triggers…"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <SubmitButton />
        <Link
          href="/crypto"
          className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
