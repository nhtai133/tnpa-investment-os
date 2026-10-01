'use client';

import { useMemo, useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { tr } from '@/i18n';
import { formatValue } from '@/lib/formatters';
import { correctCryptoOpeningPosition, createCryptoCustody, createCryptoOpeningBalance, createCryptoOpeningPosition, createCryptoWorkspaceAsset, recordCryptoWorkspaceActivity, supplyCryptoPositionCostBasis, updateCryptoMarketPrice, type CryptoActionState } from '@/app/crypto/actions';

type ActionType = 'deposit' | 'withdraw' | 'buy' | 'sell' | 'transfer' | 'fee';
interface Custody { id: number; name: string; type: string; currency: string; cash: number }
interface AssetOption { id: number; symbol: string | null; name: string; currency: string; isArchived: boolean }
interface Position { assetId: number; custodyId: number; quantity: number; costBasisKnown: boolean }
interface HistoryRow { id: number; date: string; type: string; symbol: string; source: string; destination: string; quantity: number | null; amount: number; currency: string }
const ACTIONS: { type: ActionType; label: string }[] = [
  { type: 'deposit', label: '+ Deposit stablecoin' }, { type: 'withdraw', label: '+ Withdraw stablecoin' },
  { type: 'buy', label: '+ Record buy' }, { type: 'sell', label: '+ Record sell' },
  { type: 'transfer', label: '+ Transfer coin' }, { type: 'fee', label: '+ Record fee' },
];
const inputClass = 'w-full bg-[#0C0C0E] border border-[#303037] rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500';

export function CryptoWorkspaceClient({ accounts, assets, positions, history }: { accounts: Custody[]; assets: AssetOption[]; positions: Position[]; history: HistoryRow[] }) {
  const router = useRouter();
  const [type, setType] = useState<ActionType>('deposit');
  const [accountId, setAccountId] = useState(String(accounts[0]?.id ?? ''));
  const [fromId, setFromId] = useState(String(accounts[0]?.id ?? ''));
  const [toId, setToId] = useState(String(accounts.find((row) => row.id !== accounts[0]?.id)?.id ?? ''));
  const [assetId, setAssetId] = useState('');
  const [confirmation, setConfirmation] = useState<string[] | null>(null);
  const [result, setResult] = useState<CryptoActionState>(null);
  const [pending, startTransition] = useTransition();
  const [custodyResult, setCustodyResult] = useState<CryptoActionState>(null);
  const [assetResult, setAssetResult] = useState<CryptoActionState>(null);
  const [openingResult, setOpeningResult] = useState<CryptoActionState>(null);
  const [openingBalanceResult, setOpeningBalanceResult] = useState<CryptoActionState>(null);
  const [openingBasisMode, setOpeningBasisMode] = useState<'average' | 'total' | 'unknown'>('average');
  const pendingForm = useRef<FormData | null>(null);

  const account = accounts.find((row) => row.id === Number(accountId));
  const currentCurrency = type === 'transfer' ? accounts.find((row) => row.id === Number(fromId))?.currency : account?.currency;
  const actionAssets = useMemo(() => {
    const relevant = type === 'sell' || type === 'transfer'
      ? positions.filter((position) => position.custodyId === (type === 'sell' ? Number(accountId) : Number(fromId))).map((position) => position.assetId)
      : assets.map((asset) => asset.id);
    return assets.filter((row) => relevant.includes(row.id) && !row.isArchived && (type === 'deposit' || type === 'withdraw' || type === 'fee' || !currentCurrency || row.currency === currentCurrency));
  }, [type, accountId, fromId, currentCurrency, assets, positions]);
  const selectedAssetId = actionAssets.some((row) => String(row.id) === assetId) ? assetId : String(actionAssets[0]?.id ?? '');
  const selectedAsset = actionAssets.find((row) => row.id === Number(selectedAssetId));
  const held = positions.find((row) => row.assetId === Number(selectedAssetId) && row.custodyId === (type === 'transfer' ? Number(fromId) : Number(accountId)))?.quantity ?? 0;

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const qty = Number(data.get('quantity') || 0);
    const price = Number(data.get('price') || 0);
    const fee = Number(data.get(type === 'transfer' ? 'transfer_fee' : 'fees') || 0);
    const amount = Number(data.get('amount') || 0);
    const gross = ['buy','sell'].includes(type) ? qty * price : amount;
    const custody = accounts.find((row) => row.id === Number(data.get('custody_account_id')));
    const source = accounts.find((row) => row.id === Number(data.get('from_custody_account_id')));
    const destination = accounts.find((row) => row.id === Number(data.get('to_custody_account_id')));
    const lines = [`${tr(ACTIONS.find((row) => row.type === type)?.label ?? type).replace(/^\+\s*/, '').toLocaleUpperCase('vi-VN')}${selectedAsset ? ` ${selectedAsset.symbol ?? selectedAsset.name}` : ''}`];
    if (type === 'buy') {
      lines.push(`${qty.toLocaleString('vi-VN', { maximumFractionDigits: 8 })} ${selectedAsset?.symbol} × ${formatValue(price, account?.currency)}`);
      lines.push(`${tr('Value')}: ${formatValue(gross, account?.currency)}`);
      lines.push(`${tr('Fee')}: ${formatValue(fee, account?.currency)}`);
      lines.push(`${tr('Total cash out')}: ${formatValue(gross + fee, account?.currency)}`);
      lines.push(`${tr('Source')}: ${custody?.name ?? '—'}`);
      lines.push(`${tr('Stablecoin after transaction')}: ${formatValue((custody?.cash ?? 0) - gross - fee, account?.currency)}`);
    } else if (type === 'sell') {
      lines.push(`${qty.toLocaleString('vi-VN', { maximumFractionDigits: 8 })} ${selectedAsset?.symbol} × ${formatValue(price, account?.currency)}`);
      lines.push(`${tr('Net proceeds')}: ${formatValue(gross - fee, account?.currency)}`);
      lines.push(`${tr('Source')}: ${custody?.name ?? '—'}`);
      lines.push(`${tr('Stablecoin after transaction')}: ${formatValue((custody?.cash ?? 0) + gross - fee, account?.currency)}`);
    } else if (type === 'transfer') {
      lines.push(`${tr('From')}: ${source?.name ?? '—'}`); lines.push(`${tr('To')}: ${destination?.name ?? '—'}`);
      lines.push(`${tr('Send')}: ${qty.toLocaleString('vi-VN', { maximumFractionDigits: 8 })} ${selectedAsset?.symbol}`);
      lines.push(`${tr('Network fee')}: ${fee.toLocaleString('vi-VN', { maximumFractionDigits: 8 })} ${selectedAsset?.symbol}`);
      lines.push(`${tr('Receive')}: ${(qty - fee).toLocaleString('vi-VN', { maximumFractionDigits: 8 })} ${selectedAsset?.symbol}`);
      lines.push(tr('This transfer does not realize P&L.'));
    } else {
      lines.push(`${tr('Amount')}: ${formatValue(amount, custody?.currency)}`);
      lines.push(`${tr('Source')}: ${custody?.name ?? '—'}`);
      const cashDelta = type === 'deposit' ? amount : -amount;
      lines.push(`${tr('Stablecoin after transaction')}: ${formatValue((custody?.cash ?? 0) + cashDelta, custody?.currency)}`);
    }
    pendingForm.current = data; setConfirmation(lines); setResult(null);
  }

  function confirm() {
    if (!pendingForm.current) return;
    const data = pendingForm.current;
    if (['buy','sell','transfer'].includes(type)) data.set('asset_id', selectedAssetId);
    if (type === 'transfer') data.set('currency', selectedAsset?.currency ?? 'USDT');
    else data.set('currency', account?.currency ?? 'USDT');
    startTransition(async () => {
      const next = await recordCryptoWorkspaceActivity(data);
      setResult(next); setConfirmation(null); pendingForm.current = null;
      if (next?.success) router.refresh();
    });
  }

  function runSimpleAction(event: FormEvent<HTMLFormElement>, action: (data: FormData) => Promise<CryptoActionState>, set: (state: CryptoActionState) => void) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    startTransition(async () => { const next = await action(data); set(next); if (next?.success) { form.reset(); router.refresh(); } });
  }

  const needsAsset = ['buy','sell','transfer'].includes(type);
  return <div className="space-y-6">
    <section className="rounded-xl border border-[#26262B] bg-[#131316] p-5 space-y-4">
      <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-400">{tr('Custody locations')}</h2>
      <form onSubmit={(event) => runSimpleAction(event, createCryptoCustody, setCustodyResult)} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Source name')}</span><input name="name" required placeholder="Binance TEST" className={inputClass} /></label>
        <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Custody type')}</span><select name="custody_type" className={inputClass}><option value="EXCHANGE">{tr('Exchange')}</option><option value="HOT_WALLET">{tr('Hot wallet')}</option><option value="COLD_WALLET">{tr('Cold wallet')}</option></select></label>
        <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Platform / Brand')}</span><input name="institution" placeholder="Binance, MetaMask, Ledger" className={inputClass} /></label>
        <div className="flex gap-2"><select name="currency" defaultValue="USDT" aria-label={tr('Stablecoin')} className={inputClass}><option>USDT</option><option>USDC</option><option>USD</option></select><button disabled={pending} className="shrink-0 px-4 py-2.5 rounded-lg bg-indigo-600 text-xs font-semibold text-white disabled:opacity-50">{tr('+ Add source')}</button></div>
      </form>
      {custodyResult?.error && <p role="alert" className="text-xs text-red-400">{tr(custodyResult.error)}</p>}{custodyResult?.success && <p role="status" className="text-xs text-emerald-400">{tr(custodyResult.success)}</p>}
      <form onSubmit={(event) => runSimpleAction(event, createCryptoWorkspaceAsset, setAssetResult)} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_150px_auto] gap-3 items-end border-t border-[#26262B] pt-4">
        <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Coin name')}</span><input name="name" required placeholder="Bitcoin" className={inputClass} /></label>
        <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Symbol')}</span><input name="symbol" required maxLength={20} placeholder="BTC" className={inputClass} /></label>
        <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Reporting currency')}</span><select name="currency" defaultValue={accounts[0]?.currency ?? 'USDT'} className={inputClass}><option>USDT</option><option>USDC</option><option>USD</option></select></label>
        <button disabled={pending} className="px-4 py-2.5 rounded-lg border border-[#303037] text-xs text-zinc-200">{tr('+ Add coin')}</button>
        {assetResult?.error && <p role="alert" className="md:col-span-4 text-xs text-red-400">{tr(assetResult.error)}</p>}{assetResult?.success && <p role="status" className="md:col-span-4 text-xs text-emerald-400">{tr(assetResult.success)}</p>}
      </form>
      <div className="border-t border-[#26262B] pt-4 space-y-3">
        <h3 className="text-xs font-semibold text-zinc-300">{tr('Existing crypto assets')}</h3>
        <form onSubmit={(event) => runSimpleAction(event, createCryptoOpeningPosition, setOpeningResult)} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Custody source')}</span><select name="custody_account_id" required className={inputClass}>{accounts.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
          <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Coin')}</span><select name="asset_id" required className={inputClass}>{assets.filter((row) => !row.isArchived && !['USDT','USDC'].includes(row.symbol?.toUpperCase() ?? '')).map((row) => <option key={row.id} value={row.id}>{row.symbol} · {row.name}</option>)}</select></label>
          <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Quantity')}</span><input name="quantity" type="number" min="0.00000001" step="any" required className={inputClass} placeholder="1.20" /></label>
          <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Acquisition cost option')}</span><select name="cost_basis_mode" value={openingBasisMode} onChange={(event) => setOpeningBasisMode(event.target.value as typeof openingBasisMode)} className={inputClass}><option value="average">{tr('Average acquisition price')}</option><option value="total">{tr('Total cost basis')}</option><option value="unknown">{tr('Unknown cost basis')}</option></select></label>
          {openingBasisMode !== 'unknown' && <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr(openingBasisMode === 'average' ? 'Average acquisition price' : 'Total cost basis')}</span><input name="cost_basis_value" type="number" min="0.00000001" step="any" required className={inputClass} /></label>}
          <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Date tracking started')}</span><input name="transaction_date" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className={inputClass} /></label>
          <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Manual market price (optional)')}</span><input name="market_price" type="number" min="0" step="any" className={inputClass} /></label>
          <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Notes')}</span><input name="notes" className={inputClass} /></label>
          <button disabled={pending || !accounts.length || !assets.some((row) => !row.isArchived && !['USDT','USDC'].includes(row.symbol?.toUpperCase() ?? '') )} className="px-4 py-2.5 rounded-lg bg-indigo-600 text-xs font-semibold text-white">{tr('Add existing coin')}</button>
        </form>
        {openingResult?.error && <p role="alert" className="text-xs text-red-400">{tr(openingResult.error)}</p>}{openingResult?.success && <p role="status" className="text-xs text-emerald-400">{tr(openingResult.success)}</p>}
        <form onSubmit={(event) => runSimpleAction(event, createCryptoOpeningBalance, setOpeningBalanceResult)} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border-t border-[#26262B] pt-3">
          <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Custody source')}</span><select name="custody_account_id" required className={inputClass}>{accounts.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
          <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Opening stablecoin balance')}</span><input name="amount" type="number" min="0.00000001" step="any" required className={inputClass} /></label>
          <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Date tracking started')}</span><input name="transaction_date" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className={inputClass} /></label>
          <button disabled={pending || !accounts.length} className="px-4 py-2.5 rounded-lg border border-[#303037] text-xs text-zinc-200">{tr('Add existing stablecoin balance')}</button>
        </form>
        {openingBalanceResult?.error && <p role="alert" className="text-xs text-red-400">{tr(openingBalanceResult.error)}</p>}{openingBalanceResult?.success && <p role="status" className="text-xs text-emerald-400">{tr(openingBalanceResult.success)}</p>}
      </div>
    </section>

    <section className="rounded-xl border border-[#26262B] bg-[#131316] p-5 space-y-4">
      <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-400">{tr('Transactions')}</h2>
      <div className="flex flex-wrap gap-2">{ACTIONS.map((action) => <button key={action.type} type="button" onClick={() => { setType(action.type); setConfirmation(null); setResult(null); }} aria-pressed={type === action.type} className={`px-3 py-2 rounded-lg text-xs border ${type === action.type ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#0C0C0E] border-[#303037] text-zinc-400'}`}>{tr(action.label)}</button>)}</div>
      {accounts.length === 0 ? <div className="rounded-lg bg-[#0C0C0E] p-4 text-sm text-zinc-400">{tr('Start by adding an exchange or wallet.')}</div> : <form onSubmit={prepare} className="rounded-lg bg-[#0C0C0E] p-4 space-y-4">
        <fieldset disabled={Boolean(confirmation)} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="hidden" name="type" value={type} />
          <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Date')}</span><input name="transaction_date" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className={inputClass} /></label>
          {type === 'transfer' ? <>
            <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('From')}</span><select name="from_custody_account_id" value={fromId} onChange={(event) => { setFromId(event.target.value); setAssetId(''); }} className={inputClass}>{accounts.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
            <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('To')}</span><select name="to_custody_account_id" value={toId} onChange={(event) => setToId(event.target.value)} className={inputClass}>{accounts.filter((row) => row.id !== Number(fromId)).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
          </> : <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Custody source')}</span><select name="custody_account_id" value={accountId} onChange={(event) => { setAccountId(event.target.value); setAssetId(''); }} className={inputClass}>{accounts.map((row) => <option key={row.id} value={row.id}>{row.name} · {row.currency}</option>)}</select></label>}
          {needsAsset && <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Coin')}</span><select name="asset_id" required value={selectedAssetId} onChange={(event) => setAssetId(event.target.value)} className={inputClass}>{actionAssets.map((row) => <option key={row.id} value={row.id}>{row.symbol} · {row.name}</option>)}</select></label>}
          {['buy','sell','transfer'].includes(type) && <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Quantity')}{type === 'sell' || type === 'transfer' ? ` · ${tr('Available')}: ${held.toLocaleString('vi-VN', { maximumFractionDigits: 8 })}` : ''}</span><input name="quantity" type="number" min="0.00000001" step="any" max={type === 'sell' || type === 'transfer' ? held : undefined} required className={inputClass} /></label>}
          {['buy','sell'].includes(type) && <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Execution price')} ({account?.currency ?? 'USDT'})</span><input name="price" type="number" min="0.00000001" step="any" required className={inputClass} /></label>}
          {(type === 'buy' || type === 'sell') && <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Fee')} ({account?.currency ?? 'USDT'})</span><input name="fees" type="number" min="0" step="any" defaultValue="0" className={inputClass} /></label>}
          {type === 'transfer' && <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr('Network fee')} ({selectedAsset?.symbol ?? tr('Coin')})</span><input name="transfer_fee" type="number" min="0" step="any" defaultValue="0" className={inputClass} />{selectedAsset?.currency && <input type="hidden" name="currency" value={selectedAsset.currency} />}</label>}
          {['deposit','withdraw','fee'].includes(type) && <label className="space-y-1.5 text-[11px] text-zinc-500"><span>{tr(type === 'deposit' ? 'Stablecoin amount' : type === 'withdraw' ? 'Stablecoin amount' : 'Fee amount')} ({account?.currency ?? 'USDT'})</span><input name="amount" type="number" min="0.00000001" step="any" required className={inputClass} /></label>}
        </fieldset>
        {confirmation ? <div role="dialog" aria-label={tr('Confirm transaction')} className="rounded-lg border border-indigo-500/40 bg-[#101016] p-4 space-y-3"><div className="space-y-1">{confirmation.map((line, index) => <p key={index} className={index === 0 ? 'text-sm font-semibold text-zinc-100' : 'text-xs text-zinc-400'}>{line}</p>)}</div><div className="flex gap-2"><button type="button" onClick={() => { setConfirmation(null); pendingForm.current = null; }} className="px-4 py-2 rounded-lg border border-[#303037] text-xs text-zinc-400">{tr('Cancel')}</button><button type="button" disabled={pending} onClick={confirm} className="px-4 py-2 rounded-lg bg-indigo-600 text-xs font-medium text-white">{tr('Confirm transaction')}</button></div></div> : <button className="px-4 py-2.5 rounded-lg bg-indigo-600 text-xs font-semibold text-white">{tr('Review transaction')}</button>}
        {result?.error && <p role="alert" className="text-xs text-red-400">{tr(result.error)}</p>}{result?.success && <p role="status" className="text-xs text-emerald-400">{tr(result.success)}</p>}
      </form>}
    </section>
    <CryptoHistory history={history} assets={assets} accounts={accounts} />
  </div>;
}

function CryptoHistory({ history, assets, accounts }: { history: HistoryRow[]; assets: AssetOption[]; accounts: Custody[] }) {
  const [symbol, setSymbol] = useState('all'); const [source, setSource] = useState('all'); const [kind, setKind] = useState('all'); const [date, setDate] = useState('');
  const filtered = history.filter((row) => (symbol === 'all' || row.symbol === symbol) && (source === 'all' || row.source === source || row.destination === source) && (kind === 'all' || row.type === kind) && (!date || row.date === date));
  return <section className="rounded-xl border border-[#26262B] bg-[#131316] overflow-hidden">
    <div className="px-5 py-4 border-b border-[#26262B]"><h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-400">{tr('Crypto transaction history')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
        <select aria-label={tr('Coin')} value={symbol} onChange={(event) => setSymbol(event.target.value)} className={inputClass}><option value="all">{tr('All coins')}</option>{assets.map((row) => <option key={row.id} value={row.symbol ?? row.name}>{row.symbol ?? row.name}</option>)}</select>
        <select aria-label={tr('Custody source')} value={source} onChange={(event) => setSource(event.target.value)} className={inputClass}><option value="all">{tr('All custody sources')}</option>{accounts.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}</select>
        <select aria-label={tr('Transaction type')} value={kind} onChange={(event) => setKind(event.target.value)} className={inputClass}><option value="all">{tr('All activity')}</option>{['deposit','withdraw','buy','sell','transfer','fee','opening_position','opening_balance','basis_adjustment'].map((row) => <option key={row} value={row}>{tr(row)}</option>)}</select>
        <input aria-label={tr('Date')} type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} />
      </div>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-[10px] uppercase tracking-wider text-zinc-600"><tr>{['Date','Activity','Coin','Custody source','Quantity','Amount'].map((heading) => <th key={heading} className="px-5 py-3 font-semibold whitespace-nowrap">{tr(heading)}</th>)}</tr></thead><tbody className="divide-y divide-[#1A1A1F]">{filtered.map((row) => <tr key={row.id}><td className="px-5 py-3 text-zinc-500 whitespace-nowrap">{new Date(`${row.date}T00:00:00`).toLocaleDateString('vi-VN')}</td><td className="px-5 py-3 text-zinc-300">{tr(row.type)}</td><td className="px-5 py-3 text-zinc-200">{row.symbol}</td><td className="px-5 py-3 text-zinc-400">{row.source}{row.destination ? ` → ${row.destination}` : ''}</td><td className="px-5 py-3 text-zinc-300 tabular-nums">{row.quantity?.toLocaleString('vi-VN', { maximumFractionDigits: 8 }) ?? '—'}</td><td className="px-5 py-3 text-zinc-300 tabular-nums">{formatValue(row.amount, row.currency)}</td></tr>)}{filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-zinc-600">{tr('No crypto activity yet.')}</td></tr>}</tbody></table></div>
  </section>;
}

export function CryptoPriceEditor({ assetId, symbol, currency, price }: { assetId: number; symbol: string; currency: string; price: number }) {
  const router = useRouter(); const [pending, startTransition] = useTransition(); const [result, setResult] = useState<CryptoActionState>(null);
  return <form className="flex items-end gap-2" onSubmit={(event) => runPrice(event, assetId, updateCryptoMarketPrice, setResult, startTransition, router)}>
    <input type="hidden" name="asset_id" value={assetId} /><label className="min-w-28 flex-1 text-[10px] text-zinc-500">{tr('Manual price')} ({currency})<input name="price" type="number" min="0" step="any" defaultValue={price} required className={`${inputClass} mt-1`} aria-label={`${symbol} ${tr('Manual price')}`} /></label>
    <button disabled={pending} className="px-3 py-2.5 rounded-lg border border-[#303037] text-xs text-zinc-300 disabled:opacity-50">{pending ? tr('Saving...') : tr('Update price')}</button>
    {result?.error && <span role="alert" className="text-xs text-red-400">{tr(result.error)}</span>}
  </form>;
}

export function CryptoOpeningCorrection({ transactionId, custodyAccountId, custodyName, assetId, symbol, quantity, costBasisKnown, averageCost, openingDate }: { transactionId: number; custodyAccountId: number; custodyName: string; assetId: number; symbol: string; quantity: number; costBasisKnown: boolean; averageCost: number | null; openingDate: string }) {
  const router = useRouter(); const [pending, startTransition] = useTransition(); const [result, setResult] = useState<CryptoActionState>(null); const [mode, setMode] = useState<'average' | 'total' | 'unknown'>(costBasisKnown ? 'average' : 'unknown');
  return <form className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border-t border-[#26262B] pt-3" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); data.set('transaction_id', String(transactionId)); data.set('custody_account_id', String(custodyAccountId)); data.set('asset_id', String(assetId)); startTransition(async () => { const next = await correctCryptoOpeningPosition(data); setResult(next); if (next?.success) router.refresh(); }); }}>
    <p className="text-xs text-zinc-300">{symbol} · {custodyName}</p><label className="text-[10px] text-zinc-500">{tr('Quantity')}<input name="quantity" type="number" min="0.00000001" step="any" defaultValue={quantity} required className={`${inputClass} mt-1`} /></label>
    <label className="text-[10px] text-zinc-500">{tr('Acquisition cost option')}<select name="cost_basis_mode" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)} className={`${inputClass} mt-1`}><option value="average">{tr('Average acquisition price')}</option><option value="total">{tr('Total cost basis')}</option><option value="unknown">{tr('Unknown cost basis')}</option></select></label>
    {mode !== 'unknown' && <label className="text-[10px] text-zinc-500">{tr(mode === 'average' ? 'Average acquisition price' : 'Total cost basis')}<input name="cost_basis_value" type="number" min="0.00000001" step="any" defaultValue={mode === 'average' ? averageCost ?? '' : ''} required className={`${inputClass} mt-1`} /></label>}
    <label className="text-[10px] text-zinc-500">{tr('Date tracking started')}<input name="transaction_date" type="date" defaultValue={openingDate} required className={`${inputClass} mt-1`} /></label><button disabled={pending} className="px-3 py-2 rounded-lg border border-[#303037] text-xs text-zinc-300">{tr('Correct opening position')}</button>
    {result?.error && <span role="alert" className="md:col-span-5 text-xs text-red-400">{tr(result.error)}</span>}{result?.success && <span role="status" className="md:col-span-5 text-xs text-emerald-400">{tr(result.success)}</span>}
  </form>;
}

export function CryptoCostBasisEditor({ custodyAccountId, custodyName, assetId, symbol, quantity }: { custodyAccountId: number; custodyName: string; assetId: number; symbol: string; quantity: number }) {
  const router = useRouter(); const [pending, startTransition] = useTransition(); const [result, setResult] = useState<CryptoActionState>(null);
  return <form className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border-t border-[#26262B] pt-3" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); data.set('custody_account_id', String(custodyAccountId)); data.set('asset_id', String(assetId)); startTransition(async () => { const next = await supplyCryptoPositionCostBasis(data); setResult(next); if (next?.success) router.refresh(); }); }}>
    <p className="text-xs text-zinc-300">{symbol} · {custodyName} · {quantity.toLocaleString('vi-VN', { maximumFractionDigits: 8 })}</p><label className="text-[10px] text-zinc-500">{tr('Total cost basis')}<input name="total_cost_basis" type="number" min="0" step="any" required className={`${inputClass} mt-1`} /></label>
    <label className="text-[10px] text-zinc-500">{tr('Date')}<input name="transaction_date" type="date" defaultValue={new Date().toISOString().slice(0,10)} required className={`${inputClass} mt-1`} /></label><label className="text-[10px] text-zinc-500">{tr('Notes')}<input name="notes" className={`${inputClass} mt-1`} /></label><button disabled={pending} className="px-3 py-2 rounded-lg border border-[#303037] text-xs text-zinc-300">{tr('Record cost basis')}</button>
    {result?.error && <span role="alert" className="md:col-span-5 text-xs text-red-400">{tr(result.error)}</span>}{result?.success && <span role="status" className="md:col-span-5 text-xs text-emerald-400">{tr(result.success)}</span>}
  </form>;
}

function runPrice(event: FormEvent<HTMLFormElement>, assetId: number, action: typeof updateCryptoMarketPrice, set: (state: CryptoActionState) => void, startTransition: (fn: () => Promise<void>) => void, router: ReturnType<typeof useRouter>) {
  event.preventDefault(); const data = new FormData(event.currentTarget); data.set('asset_id', String(assetId));
  startTransition(async () => { const result = await action(data); set(result); if (result?.success) router.refresh(); });
}
