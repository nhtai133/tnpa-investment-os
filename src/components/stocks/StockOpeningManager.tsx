'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { tr } from '@/i18n';
import { correctStockOpeningPositionAction, recordStockOpeningPositionAction, recordStockWorkspaceTransaction, supplyStockCostBasisAction, type StockActionState } from '@/app/stocks/actions';
import { formatValue } from '@/lib/formatters';

interface Account { id: number; name: string; institution: string | null; currency: string }
interface Stock { id: number; symbol: string | null; name: string; currency: string; isArchived: boolean }
interface Position {
  assetId: number; brokerId: number; symbol: string; name: string; currency: string; quantity: number;
  averageCost: number | null; currentPrice: number; marketValue: number; costBasis: number | null;
  costBasisKnown: boolean; openingTransactionId: number | null; openingDate: string; canCorrectOpening: boolean;
}
type EditMode = { kind: 'correct' | 'basis'; position: Position } | null;
const inputClass = 'w-full bg-[#0C0C0E] border border-[#303037] rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500';

export function StockOpeningManager({ accounts, stocks, positions, trackingStartDate }: { accounts: Account[]; stocks: Stock[]; positions: Position[]; trackingStartDate: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<'average' | 'total' | 'unknown'>('average');
  const [edit, setEdit] = useState<EditMode>(null);
  const [result, setResult] = useState<StockActionState>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>, action: (data: FormData) => Promise<StockActionState>, closeOnSuccess = false) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    startTransition(async () => {
      const next = await action(data);
      setResult(next);
      if (next?.success) {
        router.refresh();
        if (closeOnSuccess) setEdit(null);
        if (!edit) form.reset();
      }
    });
  }

  const selectedPosition = edit?.position;
  const editMode = edit?.kind === 'correct';
  const visibleStocks = stocks.filter((stock) => !stock.isArchived);

  return <section id="stock-opening" className="rounded-xl border border-[#26262B] bg-[#131316] p-5 space-y-5">
    <div>
      <h2 className="text-sm font-semibold text-zinc-100">{tr('Existing wealth at tracking start')}</h2>
      <p className="mt-1 text-xs text-zinc-500">{tr('Enter broker holdings and cash already owned. These entries are not purchases, deposits, income or realized profit.')}</p>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <form onSubmit={(event) => submit(event, recordStockOpeningPositionAction)} className="rounded-lg border border-[#28282E] p-4 space-y-3">
        <h3 className="text-xs font-semibold text-zinc-200">{tr('Add existing stock')}</h3>
        {accounts.length === 0 ? <p className="text-xs text-zinc-500">{tr('Add a broker account first.')}</p> : <>
          <label className="block space-y-1 text-[11px] text-zinc-500"><span>{tr('Broker account')}</span><select name="broker_account_id" required className={inputClass}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.institution ?? account.name} · {account.currency}</option>)}</select></label>
          <label className="block space-y-1 text-[11px] text-zinc-500"><span>{tr('Ticker')}</span><select name="asset_id" required className={inputClass}>{visibleStocks.map((stock) => <option key={stock.id} value={stock.id}>{stock.symbol} · {stock.name}</option>)}</select></label>
          {visibleStocks.length === 0 && <p className="text-[11px] text-amber-300">{tr('Create the ticker in the stock workspace above first.')}</p>}
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-[11px] text-zinc-500"><span>{tr('Quantity')}</span><input name="quantity" type="number" min="0.000001" step="any" required className={inputClass} /></label>
            <label className="space-y-1 text-[11px] text-zinc-500"><span>{tr('Cost basis option')}</span><select name="cost_basis_mode" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)} className={inputClass}><option value="average">{tr('Average acquisition price')}</option><option value="total">{tr('Total cost basis')}</option><option value="unknown">{tr('Unknown cost basis')}</option></select></label>
          </div>
          {mode !== 'unknown' && <label className="block space-y-1 text-[11px] text-zinc-500"><span>{tr(mode === 'average' ? 'Average acquisition price' : 'Total cost basis')}</span><input name="cost_basis_value" type="number" min="0.000001" step="any" required className={inputClass} /></label>}
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-[11px] text-zinc-500"><span>{tr('Tracking date')}</span><input name="transaction_date" type="date" defaultValue={trackingStartDate} required className={inputClass} /></label>
            <label className="space-y-1 text-[11px] text-zinc-500"><span>{tr('Current manual price')} · {tr('optional')}</span><input name="market_price" type="number" min="0" step="any" className={inputClass} /></label>
          </div>
          <label className="block space-y-1 text-[11px] text-zinc-500"><span>{tr('Notes')}</span><input name="notes" maxLength={500} className={inputClass} /></label>
          <button disabled={pending || visibleStocks.length === 0} className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white">{pending ? tr('Saving...') : `+ ${tr('Add existing stock')}`}</button>
        </>}
      </form>

      <form onSubmit={(event) => submit(event, (data) => {
        data.set('type', 'opening_balance');
        return recordStockWorkspaceTransaction(data);
      })} className="rounded-lg border border-[#28282E] p-4 space-y-3">
        <h3 className="text-xs font-semibold text-zinc-200">{tr('Opening broker cash balance')}</h3>
        {accounts.length === 0 ? <p className="text-xs text-zinc-500">{tr('Add a broker account first.')}</p> : <>
          <label className="block space-y-1 text-[11px] text-zinc-500"><span>{tr('Broker account')}</span><select name="broker_account_id" required className={inputClass}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.institution ?? account.name} · {account.currency}</option>)}</select></label>
          <label className="block space-y-1 text-[11px] text-zinc-500"><span>{tr('Opening cash balance')}</span><input name="amount" type="number" min="0.01" step="any" required className={inputClass} /></label>
          <label className="block space-y-1 text-[11px] text-zinc-500"><span>{tr('Tracking date')}</span><input name="transaction_date" type="date" defaultValue={trackingStartDate} required className={inputClass} /></label>
          <p className="text-[11px] text-zinc-600">{tr('This opening balance increases broker cash without recording income or a deposit transaction.')}</p>
          <button disabled={pending} className="px-4 py-2.5 rounded-lg border border-[#303037] hover:border-zinc-500 disabled:opacity-50 text-xs text-zinc-200">{pending ? tr('Saving...') : tr('Record opening cash')}</button>
        </>}
      </form>
    </div>

    {positions.length > 0 && <div className="border-t border-[#26262B] pt-4 space-y-2">
      <h3 className="text-xs font-semibold text-zinc-300">{tr('Opening entry maintenance')}</h3>
      {positions.map((position) => <div key={`${position.assetId}-${position.brokerId}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#101014] px-3 py-2">
        <span className="text-xs text-zinc-400">{position.symbol} · {accounts.find((account) => account.id === position.brokerId)?.institution ?? accounts.find((account) => account.id === position.brokerId)?.name ?? position.brokerId} · {position.quantity.toLocaleString('vi-VN')} · {position.costBasisKnown ? formatValue(position.costBasis ?? 0, position.currency) : tr('Unknown cost basis')}</span>
        <div className="flex gap-2">{!position.costBasisKnown && <button type="button" onClick={() => { setEdit({ kind: 'basis', position }); setResult(null); }} className="text-[11px] text-amber-300">{tr('Add known cost basis')}</button>}{position.canCorrectOpening && <button type="button" onClick={() => { setEdit({ kind: 'correct', position }); setResult(null); setMode(position.costBasisKnown ? 'average' : 'unknown'); }} className="text-[11px] text-indigo-300">{tr('Correct opening position')}</button>}</div>
      </div>)}
    </div>}

    {edit && selectedPosition && <form onSubmit={(event) => submit(event, editMode ? correctStockOpeningPositionAction : supplyStockCostBasisAction, true)} className="rounded-lg border border-amber-500/30 bg-[#101014] p-4 space-y-3">
      <h3 className="text-xs font-semibold text-zinc-200">{tr(editMode ? 'Correct opening position' : 'Add known cost basis')} · {selectedPosition.symbol} · {selectedPosition.brokerId}</h3>
      <input type="hidden" name="broker_account_id" value={selectedPosition.brokerId} /><input type="hidden" name="asset_id" value={selectedPosition.assetId} />
      {editMode && <input type="hidden" name="transaction_id" value={selectedPosition.openingTransactionId ?? ''} />}
      {!editMode ? <>
        <label className="block space-y-1 text-[11px] text-zinc-500"><span>{tr('Total cost basis')}</span><input name="total_cost_basis" type="number" min="0" step="any" required className={inputClass} /></label>
        <label className="block space-y-1 text-[11px] text-zinc-500"><span>{tr('Date')}</span><input name="transaction_date" type="date" defaultValue={trackingStartDate} required className={inputClass} /></label>
      </> : <>
        <div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-[11px] text-zinc-500"><span>{tr('Quantity')}</span><input name="quantity" type="number" min="0.000001" step="any" defaultValue={selectedPosition.quantity} required className={inputClass} /></label><label className="space-y-1 text-[11px] text-zinc-500"><span>{tr('Cost basis option')}</span><select name="cost_basis_mode" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)} className={inputClass}><option value="average">{tr('Average acquisition price')}</option><option value="total">{tr('Total cost basis')}</option><option value="unknown">{tr('Unknown cost basis')}</option></select></label></div>
        {mode !== 'unknown' && <label className="block space-y-1 text-[11px] text-zinc-500"><span>{tr(mode === 'average' ? 'Average acquisition price' : 'Total cost basis')}</span><input name="cost_basis_value" type="number" min="0.000001" step="any" defaultValue={mode === 'average' ? selectedPosition.averageCost ?? '' : selectedPosition.costBasis ?? ''} required className={inputClass} /></label>}
        <div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-[11px] text-zinc-500"><span>{tr('Tracking date')}</span><input name="transaction_date" type="date" defaultValue={selectedPosition.openingDate || trackingStartDate} required className={inputClass} /></label><label className="space-y-1 text-[11px] text-zinc-500"><span>{tr('Current manual price')}</span><input name="market_price" type="number" min="0" step="any" defaultValue={selectedPosition.currentPrice} className={inputClass} /></label></div>
      </>}
      <label className="block space-y-1 text-[11px] text-zinc-500"><span>{tr('Notes')}</span><input name="notes" maxLength={500} className={inputClass} /></label>
      <div className="flex gap-2"><button disabled={pending} className="px-4 py-2 rounded-lg bg-indigo-600 disabled:opacity-50 text-xs text-white">{tr('Save')}</button><button type="button" onClick={() => setEdit(null)} className="px-4 py-2 rounded-lg border border-[#303037] text-xs text-zinc-400">{tr('Cancel')}</button></div>
    </form>}
    {result?.error && <p role="alert" className="text-xs text-red-400">{tr(result.error)}</p>}
    {result?.success && <p role="status" className="text-xs text-emerald-400">{tr(result.success)}</p>}
  </section>;
}
