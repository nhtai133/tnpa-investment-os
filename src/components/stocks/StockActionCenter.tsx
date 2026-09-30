'use client';

import { useMemo, useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { tr } from '@/i18n';
import { createStockInstrument, recordStockWorkspaceTransaction, updateStockMarketPrice, type StockActionState } from '@/app/stocks/actions';
import { formatValue } from '@/lib/formatters';

type ActionType = 'deposit' | 'withdraw' | 'buy' | 'sell' | 'dividend' | 'fee';
interface AccountOption { id: number; name: string; institution: string | null; currency: string; cash: number }
interface StockOption { id: number; symbol: string | null; name: string; currency: string; isArchived: boolean }
interface PositionOption { assetId: number; brokerId: number; quantity: number }

const ACTIONS: { type: ActionType; label: string }[] = [
  { type: 'deposit', label: 'Deposit cash' },
  { type: 'withdraw', label: 'Withdraw cash' },
  { type: 'buy', label: 'Record Buy' },
  { type: 'sell', label: 'Record Sell' },
  { type: 'dividend', label: 'Record Dividend' },
  { type: 'fee', label: 'Record Fee' },
];

const inputClass = 'w-full bg-[#0C0C0E] border border-[#303037] rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500';

export function StockActionCenter({ accounts, stocks, positions }: { accounts: AccountOption[]; stocks: StockOption[]; positions: PositionOption[] }) {
  const router = useRouter();
  const [actionType, setActionType] = useState<ActionType>('deposit');
  const [accountId, setAccountId] = useState(String(accounts[0]?.id ?? ''));
  const [assetId, setAssetId] = useState('');
  const [confirmation, setConfirmation] = useState<string[] | null>(null);
  const [result, setResult] = useState<StockActionState>(null);
  const [pending, startTransition] = useTransition();
  const [instrumentResult, setInstrumentResult] = useState<StockActionState>(null);
  const [instrumentPending, startInstrumentTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const pendingForm = useRef<FormData | null>(null);

  const account = accounts.find((row) => row.id === Number(accountId));
  const availableStocks = useMemo(() => {
    const candidates = actionType === 'sell'
      ? positions.filter((position) => position.brokerId === Number(accountId)).map((position) => position.assetId)
      : stocks.map((stock) => stock.id);
    return stocks.filter((stock) => candidates.includes(stock.id) && (!account || stock.currency === account.currency));
  }, [accountId, actionType, account, positions, stocks]);
  const selectedAssetId = availableStocks.some((stock) => String(stock.id) === assetId) ? assetId : String(availableStocks[0]?.id ?? '');
  const selectedStock = availableStocks.find((stock) => stock.id === Number(selectedAssetId));
  const heldQuantity = positions.find((position) => position.assetId === Number(selectedAssetId) && position.brokerId === Number(accountId))?.quantity ?? 0;

  function changeType(type: ActionType) {
    setActionType(type);
    setConfirmation(null);
    setResult(null);
  }

  function prepareConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const broker = accounts.find((row) => row.id === Number(data.get('broker_account_id')));
    const stock = stocks.find((row) => row.id === Number(data.get('asset_id')));
    const quantity = Number(data.get('quantity') || 0);
    const price = Number(data.get('price') || 0);
    const fee = Number(data.get('fees') || 0);
    const tax = Number(data.get('tax') || 0);
    const amount = Number(data.get('amount') || 0);
    const gross = ['buy', 'sell'].includes(actionType) ? quantity * price : amount;
    const delta = actionType === 'buy' ? -(gross + fee + tax)
      : actionType === 'sell' ? gross - fee - tax
        : actionType === 'deposit' ? amount
          : actionType === 'withdraw' || actionType === 'fee' ? -amount
            : gross - tax;
    const after = (broker?.cash ?? 0) + delta;
    const lines = [
      `${tr(ACTIONS.find((item) => item.type === actionType)?.label ?? actionType).toLocaleUpperCase('vi-VN')}${stock ? ` ${stock.symbol ?? stock.name}` : ''}`,
    ];
    if (['buy', 'sell'].includes(actionType)) {
      lines.push(`${quantity.toLocaleString('vi-VN')} ${tr('shares')} × ${formatValue(price, broker?.currency ?? 'VND')}`);
      lines.push(`${tr('Value')}: ${formatValue(gross, broker?.currency ?? 'VND')}`);
      if (fee > 0) lines.push(`${tr('Fee')}: ${formatValue(fee, broker?.currency ?? 'VND')}`);
      if (actionType === 'buy') lines.push(`${tr('Total cash out')}: ${formatValue(gross + fee + tax, broker?.currency ?? 'VND')}`);
      if (actionType === 'sell') lines.push(`${tr('Net proceeds')}: ${formatValue(gross - fee - tax, broker?.currency ?? 'VND')}`);
    } else if (actionType === 'dividend') {
      lines.push(`${tr('Gross dividend')}: ${formatValue(gross, broker?.currency ?? 'VND')}`);
      lines.push(`${tr('Withholding tax')}: ${formatValue(tax, broker?.currency ?? 'VND')}`);
      lines.push(`${tr('Net dividend')}: ${formatValue(gross - tax, broker?.currency ?? 'VND')}`);
    } else {
      lines.push(`${tr('Amount')}: ${formatValue(amount, broker?.currency ?? 'VND')}`);
    }
    lines.push(`${tr('Account')}: ${broker?.institution ?? broker?.name ?? '—'}`);
    lines.push(`${tr('Cash after transaction')}: ${formatValue(after, broker?.currency ?? 'VND')}`);
    pendingForm.current = data;
    setConfirmation(lines);
    setResult(null);
  }

  function confirmTransaction() {
    if (!pendingForm.current) return;
    const data = pendingForm.current;
    const quantity = Number(data.get('quantity') || 0);
    const price = Number(data.get('price') || 0);
    if (actionType === 'buy' || actionType === 'sell') data.set('amount', String(quantity * price));
    if (['buy', 'sell', 'dividend'].includes(actionType) && selectedAssetId) {
      data.set('asset_id', selectedAssetId);
      if (selectedStock) data.set('currency', selectedStock.currency);
    } else {
      data.delete('asset_id');
      if (account) data.set('currency', account.currency);
    }
    startTransition(async () => {
      const next = await recordStockWorkspaceTransaction(data);
      setResult(next);
      setConfirmation(null);
      pendingForm.current = null;
      if (next?.success) router.refresh();
    });
  }

  function confirmInstrument(form: HTMLFormElement) {
    const data = new FormData(form);
    startInstrumentTransition(async () => {
      const next = await createStockInstrument(data);
      setInstrumentResult(next);
      if (next?.success) {
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(({ type, label }) => (
          <button key={type} type="button" onClick={() => changeType(type)} aria-pressed={actionType === type}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${actionType === type ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#131316] border-[#303037] text-zinc-400 hover:text-zinc-200'}`}>
            + {tr(label)}
          </button>
        ))}
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-[#26262B] bg-[#131316] p-5 text-sm text-zinc-400">
          {tr('Add a broker account before recording stock transactions.')}{' '}
          <a className="text-indigo-400 hover:text-indigo-300" href="/stocks/accounts/new">{tr('+ Add Broker Account')}</a>
        </div>
      ) : (
        <form ref={formRef} onSubmit={prepareConfirmation} className="rounded-xl border border-[#26262B] bg-[#131316] p-5 space-y-4">
          <fieldset disabled={Boolean(confirmation)} className="contents">
          <input type="hidden" name="type" value={actionType} />
          <input type="hidden" name="currency" value={selectedStock?.currency ?? account?.currency ?? 'VND'} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Broker Accounts')}</span>
              <select name="broker_account_id" required className={inputClass} value={accountId} onChange={(event) => { setAccountId(event.target.value); setAssetId(''); setConfirmation(null); }}>
                {accounts.map((row) => <option key={row.id} value={row.id}>{row.institution ?? row.name} · {row.currency}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Date')}</span>
              <input name="transaction_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
            </label>
            {['buy', 'sell', 'dividend'].includes(actionType) && (
              <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Ticker')}</span>
                <select name="asset_id" required value={selectedAssetId} onChange={(event) => { setAssetId(event.target.value); setConfirmation(null); }} className={inputClass}>
                  {availableStocks.map((stock) => <option key={stock.id} value={stock.id}>{stock.symbol} · {stock.name}{stock.isArchived ? ` · ${tr('Closed')}` : ''}</option>)}
                </select>
              </label>
            )}
          </div>

          {['buy', 'sell'].includes(actionType) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Quantity')}{actionType === 'sell' ? ` · ${tr('Available')}: ${heldQuantity.toLocaleString('vi-VN')}` : ''}</span>
                <input name="quantity" type="number" min="0.00000001" step="any" required max={actionType === 'sell' ? heldQuantity : undefined} className={inputClass} /></label>
              <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Execution price')}</span>
                <input name="price" type="number" min="0.00000001" step="any" required className={inputClass} /></label>
              <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Fee')}</span>
                <input name="fees" type="number" min="0" step="any" defaultValue="0" className={inputClass} /></label>
            </div>
          )}
          {actionType === 'dividend' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Gross dividend')}</span><input name="amount" type="number" min="0.01" step="any" required className={inputClass} /></label>
              <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Withholding tax')}</span><input name="tax" type="number" min="0" step="any" defaultValue="0" className={inputClass} /></label>
            </div>
          )}
          {['deposit', 'withdraw', 'fee'].includes(actionType) && (
            <label className="block max-w-sm space-y-1.5 text-[11px] text-zinc-500"><span>{tr(actionType === 'deposit' ? 'Deposit amount' : actionType === 'withdraw' ? 'Withdrawal amount' : 'Fee amount')}</span>
              <input name="amount" type="number" min="0.01" step="any" required className={inputClass} /></label>
          )}
          </fieldset>

          {confirmation ? (
            <div className="rounded-lg border border-indigo-500/40 bg-[#101016] p-4 space-y-3" role="dialog" aria-label={tr('Confirm transaction')}>
              <div className="space-y-1">{confirmation.map((line, index) => <p key={index} className={index === 0 ? 'text-sm font-semibold text-zinc-100' : 'text-xs text-zinc-400'}>{line}</p>)}</div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setConfirmation(null); pendingForm.current = null; }} className="px-4 py-2 rounded-lg border border-[#303037] text-xs text-zinc-400">{tr('Cancel')}</button>
                <button type="button" disabled={pending} onClick={confirmTransaction} className="px-4 py-2 rounded-lg bg-indigo-600 disabled:opacity-50 text-xs font-medium text-white">{pending ? tr('Saving...') : tr(`Confirm ${actionType}`)}</button>
              </div>
            </div>
          ) : (
            <button type="submit" className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white">{tr('Review transaction')}</button>
          )}
          {result?.error && <p role="alert" className="text-xs text-red-400">{tr(result.error)}</p>}
          {result?.success && <p role="status" className="text-xs text-emerald-400">{tr(result.success)}</p>}
        </form>
      )}

      <form className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end rounded-xl border border-[#26262B] bg-[#131316] p-4"
        onSubmit={(event) => { event.preventDefault(); confirmInstrument(event.currentTarget); }}>
        <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Ticker')}</span><input name="symbol" required maxLength={20} placeholder="VCB" className={inputClass} /></label>
        <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Company')}</span><input name="name" required placeholder={tr('Vietcombank')} className={inputClass} /></label>
        <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Currency')}</span><select name="currency" defaultValue="VND" className={inputClass}><option value="VND">VND</option><option value="USD">USD</option></select></label>
        <button disabled={instrumentPending} className="px-4 py-2.5 rounded-lg border border-[#303037] hover:border-zinc-500 text-xs text-zinc-300 disabled:opacity-50">{instrumentPending ? tr('Saving...') : tr('+ Add ticker')}</button>
        {instrumentResult?.error && <p role="alert" className="sm:col-span-4 text-xs text-red-400">{tr(instrumentResult.error)}</p>}
        {instrumentResult?.success && <p role="status" className="sm:col-span-4 text-xs text-emerald-400">{tr(instrumentResult.success)}</p>}
      </form>
    </section>
  );
}

export function StockPriceEditor({ assetId, symbol, currency, price }: { assetId: number; symbol: string; currency: string; price: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<StockActionState>(null);
  return <form className="rounded-xl border border-[#26262B] bg-[#131316] p-4"
    onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      startTransition(async () => {
        const next = await updateStockMarketPrice(data);
        setResult(next);
        if (next?.success) router.refresh();
      });
    }}>
    <input type="hidden" name="asset_id" value={assetId} />
    <label className="block text-[11px] text-zinc-500">{symbol} · {tr('Manual market price')} ({currency})</label>
    <div className="flex gap-2 mt-2">
      <input name="price" type="number" min="0" step="any" defaultValue={price} required className={inputClass} />
      <button disabled={pending} className="px-3 rounded-lg bg-[#24242B] text-xs text-zinc-200 disabled:opacity-50">{pending ? tr('Saving...') : tr('Update price')}</button>
    </div>
    {result?.error && <p role="alert" className="mt-2 text-[10px] text-red-400">{tr(result.error)}</p>}
    {result?.success && <p role="status" className="mt-2 text-[10px] text-emerald-400">{tr(result.success)}</p>}
  </form>;
}
