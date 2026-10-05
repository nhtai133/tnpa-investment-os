import Link from 'next/link';
import { tr } from '@/i18n';
import { StockActionCenter, StockPriceEditor } from '@/components/stocks/StockActionCenter';
import { StockOpeningManager } from '@/components/stocks/StockOpeningManager';
import { formatDate, formatPercent, formatValue } from '@/lib/formatters';
import { getStockWorkspaceData } from '@/lib/stock-workspace';
import { getAppSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

type SearchParams = { broker?: string; ticker?: string; type?: string; from?: string; to?: string };

export default async function StocksPage({ searchParams }: { searchParams: SearchParams }) {
  const data = await getStockWorkspaceData();
  const trackingStartDate = await getAppSetting('wealth_tracking_start_date') ?? new Date().toISOString().slice(0, 10);
  const activeBrokers = data.brokers.filter((row) => row.account.status === 'active' && !row.account.archived_at);
  const visiblePositions = data.positions.filter(p => !p.broker?.archived_at);
  const activeAssetIds = [...new Set(data.positions.map((row) => row.asset.id))];
  const pricedStocks = activeAssetIds.map((id) => data.assetMap.get(id)!).filter(Boolean);
  const filters = searchParams ?? {};
  const transactions = data.transactions.filter((txn) => {
    const accountIds = [txn.funding_account_id, txn.execution_account_id, txn.custody_account_id, txn.receive_account_id, txn.from_custody_account_id, txn.to_custody_account_id];
    if (filters.broker && !accountIds.includes(Number(filters.broker))) return false;
    const asset = txn.asset_id ? data.assetMap.get(txn.asset_id) : null;
    if (filters.ticker && asset?.symbol !== filters.ticker) return false;
    if (filters.type && txn.type !== filters.type) return false;
    if (filters.from && txn.transaction_date < filters.from) return false;
    if (filters.to && txn.transaction_date > filters.to) return false;
    return true;
  });

  const kpis: [string, number | null][] = [
    ['Total Workspace', data.totals.workspaceVnd],
    ['Stock Market Value', data.totals.marketValueVnd],
    ['Broker Cash', data.totals.cashVnd],
    ['Cost Basis', data.totals.costBasisVnd],
    ['Unrealized P&L', data.totals.unrealizedPnlVnd],
    ['Realized P&L', data.totals.realizedPnlVnd],
    ['Dividend Income', data.totals.dividendIncomeVnd],
  ];

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-4 sm:px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-zinc-600 font-semibold">{tr('Wealth')}</p>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">{tr('Stocks')}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/stocks/accounts" className="text-indigo-400">Tài khoản & lưu trữ</Link><Link href="/capital-allocation#unassigned" className="text-indigo-400">Phân loại vốn</Link><Link href="/stocks/accounts/new" className="px-3 py-2 border border-[#303037] hover:border-zinc-500 text-xs text-zinc-300 rounded-lg">+ {tr('Add Broker Account')}</Link>
            <Link href="#stock-opening" className="px-3 py-2 border border-[#303037] hover:border-zinc-500 text-xs text-zinc-300 rounded-lg">+ {tr('Add existing stock')}</Link>
            <Link href="/watchlist" className="px-3 py-2 border border-[#303037] hover:border-zinc-500 text-xs text-zinc-300 rounded-lg">{tr('Watchlist')}</Link>
            <Link href="/research" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs text-white rounded-lg">{tr('Research Notes')}</Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        <section aria-labelledby="stocks-overview"><p className="text-xs text-zinc-400">Tổng giá trị gồm tài khoản đã lưu trữ; danh sách thao tác mặc định chỉ hiện tài khoản đang hoạt động.</p>
          <div className="flex items-center justify-between mb-3">
            <h2 id="stocks-overview" className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{tr('Overview')}</h2>
            <span className="text-[10px] text-zinc-600">{tr('Converted to VND for workspace totals')}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3">
            {kpis.map(([label, value], index) => <Kpi key={label} label={tr(label)} value={value == null ? tr('Unknown cost basis') : formatValue(value, 'VND')} emphasis={index === 0} />)}
          </div>
        </section>

        {visiblePositions.length === 0 && (
          <section className="rounded-xl border border-indigo-500/30 bg-[#131316] p-5">
            <h2 className="text-sm font-semibold text-zinc-100">{tr('Start your stock workspace')}</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-400">
              <div className="rounded-lg bg-[#101014] p-3"><p className="font-medium text-zinc-200">{tr('Already own stocks')}</p><ol className="mt-2 space-y-1"><li>1. {activeBrokers.length ? tr('Broker account ready') : tr('Add a broker account')}</li><li>2. {tr('Add existing stock')}</li><li>3. {tr('Enter known or unknown cost basis')}</li></ol></div>
              <div className="rounded-lg bg-[#101014] p-3"><p className="font-medium text-zinc-200">{tr('Starting new transactions')}</p><ol className="mt-2 space-y-1"><li>1. {tr('Add a broker account')}</li><li>2. {tr('Deposit broker cash')}</li><li>3. {tr('Record your first stock purchase')}</li></ol></div>
            </div>
            <p className="mt-3 text-[11px] text-zinc-600">{tr('Add the ticker in the transaction area before recording the purchase.')}</p>
            <Link href={activeBrokers.length ? '#stock-actions' : '/stocks/accounts/new'} className="inline-block mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-xs text-white">{activeBrokers.length ? tr('Continue to transactions') : `+ ${tr('Add Broker Account')}`}</Link>
          </section>
        )}

        <section aria-labelledby="broker-accounts" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="broker-accounts" className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{tr('Broker Accounts')}</h2>
            <Link href="/stocks/accounts/new" className="text-xs text-indigo-400 hover:text-indigo-300">+ {tr('Add Broker Account')}</Link>
          </div>
          {activeBrokers.length === 0 ? <Empty>{tr('Add a broker account to track cash and stock positions here.')}</Empty> : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {activeBrokers.map(({ account, cash, stockValue, totalValue, realizedPnl, unrealizedPnl }) => {
                return <article key={account.id} className="rounded-xl border border-[#26262B] bg-[#131316] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{account.institution ?? account.name}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{account.name}{account.account_number_masked ? ` · ${account.account_number_masked}` : ''}</p>
                    </div>
                    <Link href={`/stocks/accounts/${account.id}`} className="text-xs text-indigo-400">{tr('Details')} →</Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <SmallMetric label={tr('Cash')} value={formatValue(cash, account.currency)} />
                    <SmallMetric label={tr('Stock Market Value')} value={formatValue(stockValue, account.currency)} />
                    <SmallMetric label={tr('Total Value')} value={formatValue(totalValue, account.currency)} />
                    <SmallMetric label={tr('Gain / Loss')} value={realizedPnl == null || unrealizedPnl == null ? tr('Unknown cost basis') : formatValue(realizedPnl + unrealizedPnl, account.currency)} signed={realizedPnl == null || unrealizedPnl == null ? undefined : realizedPnl + unrealizedPnl} />
                  </div>
                  <div className="mt-3 flex gap-4 text-[10px] text-zinc-600">
                    <span>{tr('Realized P&L')}: {realizedPnl == null ? tr('Unknown cost basis') : formatValue(realizedPnl, account.currency)}</span>
                    <span>{tr('Unrealized P&L')}: {unrealizedPnl == null ? tr('Unknown cost basis') : formatValue(unrealizedPnl, account.currency)}</span>
                  </div>
                </article>;
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="stock-actions" className="space-y-3">
          <h2 id="stock-actions" className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{tr('Transactions')}</h2>
          <StockActionCenter
            accounts={activeBrokers.map(({ account, cash }) => ({ id: account.id, name: account.name, institution: account.institution, currency: account.currency, cash }))}
            stocks={data.assets.map((asset) => ({ id: asset.id, symbol: asset.symbol, name: asset.name, currency: asset.currency, isArchived: asset.is_archived }))}
            positions={visiblePositions.flatMap((position) => position.broker ? [{ assetId: position.asset.id, brokerId: position.broker.id, quantity: position.quantity }] : [])}
          />
        </section>

        <StockOpeningManager
          accounts={activeBrokers.map(({ account }) => ({ id: account.id, name: account.name, institution: account.institution, currency: account.currency }))}
          stocks={data.assets.map((asset) => ({ id: asset.id, symbol: asset.symbol, name: asset.name, currency: asset.currency, isArchived: asset.is_archived }))}
          positions={visiblePositions.flatMap((position) => position.broker ? [{ assetId: position.asset.id, brokerId: position.broker.id, symbol: position.asset.symbol ?? position.asset.name, name: position.asset.name, currency: position.asset.currency, quantity: position.quantity, averageCost: position.averageCost, currentPrice: position.currentPrice, marketValue: position.marketValue, costBasis: position.costBasis, costBasisKnown: position.costBasisKnown, openingTransactionId: position.openingTransactionId, openingDate: position.openingDate, canCorrectOpening: position.canCorrectOpening }] : [])}
          trackingStartDate={trackingStartDate}
        />

        <section aria-labelledby="open-positions" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 id="open-positions" className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{tr('Open stock positions')}</h2>
            <span className="text-[10px] text-zinc-600">{visiblePositions.length} {tr('positions')}</span>
          </div>
          {visiblePositions.length === 0 ? <Empty>{tr('No open stock positions yet. Create a ticker above, deposit cash, then record a buy.')}</Empty> : (
            <div className="overflow-x-auto rounded-xl border border-[#26262B] bg-[#131316]">
              <table className="w-full min-w-[1200px] text-xs">
                <thead><tr className="border-b border-[#26262B] text-left text-[10px] uppercase tracking-wide text-zinc-600">
                  {['Ticker', 'Company', 'Broker', 'Quantity', 'Average Cost', 'Current Price', 'Cost Basis', 'Market Value', 'Gain / Loss', '%', 'Weight'].map((label) => <th key={label} className="px-3 py-3 whitespace-nowrap">{tr(label)}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-[#202024]">
                  {visiblePositions.map((row) => <tr key={`${row.asset.id}-${row.broker?.id ?? 'legacy'}`} className="hover:bg-[#18181D]">
                    <td className="px-3 py-3 font-mono font-semibold text-zinc-200">{row.asset.symbol}</td>
                    <td className="px-3 py-3 text-zinc-300">{row.asset.name}</td>
                    <td className="px-3 py-3">{row.broker ? <Link href={`/stocks/accounts/${row.broker.id}`} className="text-indigo-400">{row.broker.institution ?? row.broker.name}</Link> : <span className="text-zinc-600">{tr('Unassigned')}</span>}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-300">{row.quantity.toLocaleString('vi-VN')}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-400">{row.averageCost == null ? tr('Unknown cost basis') : formatValue(row.averageCost, row.asset.currency)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-300">{formatValue(row.currentPrice, row.asset.currency)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-400">{row.costBasis == null ? tr('Unknown cost basis') : formatValue(row.costBasis, row.asset.currency)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-200">{formatValue(row.marketValue, row.asset.currency)}</td>
                    <td className={`px-3 py-3 text-right tabular-nums ${row.gainLoss == null ? 'text-zinc-500' : row.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{row.gainLoss == null ? tr('Unknown cost basis') : `${row.gainLoss >= 0 ? '+' : ''}${formatValue(row.gainLoss, row.asset.currency)}`}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-400">{row.gainLossPct == null ? '—' : formatPercent(row.gainLossPct)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-400">{row.weight.toFixed(1)}%</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {pricedStocks.length > 0 && <section className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{tr('Manual market prices')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {pricedStocks.map((asset) => <StockPriceEditor key={asset.id} assetId={asset.id} symbol={asset.symbol ?? asset.name} currency={asset.currency} price={(asset.quantity ?? 0) > 0 ? asset.current_value / asset.quantity! : 0} />)}
          </div>
        </section>}

        <section aria-labelledby="stock-history" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="stock-history" className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{tr('Stock transaction history')}</h2>
            <span className="text-[10px] text-zinc-600">{transactions.length} {tr('records')}</span>
          </div>
          <form method="get" className="grid grid-cols-2 md:grid-cols-5 gap-2 rounded-xl border border-[#26262B] bg-[#131316] p-3">
            <select name="broker" defaultValue={filters.broker ?? ''} className="rounded-lg bg-[#0C0C0E] border border-[#303037] px-2 py-2 text-xs text-zinc-300"><option value="">{tr('All brokers')}</option>{data.brokers.map(({ account }) => <option key={account.id} value={account.id}>{account.institution ?? account.name}</option>)}</select>
            <select name="ticker" defaultValue={filters.ticker ?? ''} className="rounded-lg bg-[#0C0C0E] border border-[#303037] px-2 py-2 text-xs text-zinc-300"><option value="">{tr('All tickers')}</option>{data.assets.filter((asset) => asset.symbol).map((asset) => <option key={asset.id} value={asset.symbol!}>{asset.symbol}</option>)}</select>
            <select name="type" defaultValue={filters.type ?? ''} className="rounded-lg bg-[#0C0C0E] border border-[#303037] px-2 py-2 text-xs text-zinc-300"><option value="">{tr('All transaction types')}</option>{['opening_balance', 'opening_position', 'basis_adjustment', 'deposit', 'withdraw', 'buy', 'sell', 'dividend', 'fee'].map((type) => <option key={type} value={type}>{tr(type)}</option>)}</select>
            <input name="from" type="date" defaultValue={filters.from} aria-label={tr('From date')} className="rounded-lg bg-[#0C0C0E] border border-[#303037] px-2 py-2 text-xs text-zinc-300" />
            <div className="flex gap-2"><input name="to" type="date" defaultValue={filters.to} aria-label={tr('To date')} className="min-w-0 flex-1 rounded-lg bg-[#0C0C0E] border border-[#303037] px-2 py-2 text-xs text-zinc-300" /><button className="px-3 rounded-lg bg-[#24242B] text-xs text-zinc-200">{tr('Filter')}</button></div>
          </form>
          <div className="overflow-x-auto rounded-xl border border-[#26262B] bg-[#131316]">
            {transactions.length === 0 ? <div className="px-5 py-10 text-center text-sm text-zinc-600">{tr('No stock transactions match these filters.')}</div> : <table className="w-full min-w-[900px] text-xs">
              <thead><tr className="border-b border-[#26262B] text-left text-[10px] uppercase tracking-wide text-zinc-600">{['Date', 'Type', 'Ticker', 'Broker', 'Quantity', 'Price', 'Amount', 'Fees / Tax', 'Realized P&L'].map((label) => <th key={label} className="px-3 py-3">{tr(label)}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#202024]">{transactions.map((txn) => {
                const asset = txn.asset_id ? data.assetMap.get(txn.asset_id) : null;
                const brokerId = txn.execution_account_id ?? txn.receive_account_id ?? txn.funding_account_id ?? txn.custody_account_id;
                const broker = brokerId ? data.brokerMap.get(brokerId) : null;
                const amount = txn.gross_proceeds ?? txn.total_amount ?? txn.amount;
                return <tr key={txn.id} className="hover:bg-[#18181D]">
                  <td className="px-3 py-3 text-zinc-400 whitespace-nowrap">{formatDate(txn.transaction_date)}</td>
                  <td className="px-3 py-3 text-zinc-300">{tr(txn.type)}</td>
                  <td className="px-3 py-3 font-mono text-zinc-300">{asset?.symbol ?? '—'}</td>
                  <td className="px-3 py-3 text-zinc-400">{broker?.institution ?? broker?.name ?? '—'}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-400">{txn.quantity?.toLocaleString('vi-VN') ?? '—'}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-400">{txn.price == null ? '—' : formatValue(txn.price, txn.currency)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-300">{formatValue(amount, txn.currency)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-500">{formatValue(txn.type === 'fee' ? txn.amount : (txn.fees ?? 0) + (txn.tax ?? 0), txn.currency)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-300">{txn.realized_pnl == null ? '—' : formatValue(txn.realized_pnl, txn.currency)}</td>
                </tr>;
              })}</tbody>
            </table>}
          </div>
        </section>

        <section aria-labelledby="closed-positions" className="space-y-3">
          <h2 id="closed-positions" className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{tr('Closed stock positions')}</h2>
          {data.closedAssets.length === 0 ? <Empty>{tr('Fully exited stock positions will remain listed here with their transaction history.')}</Empty> : <div className="overflow-x-auto rounded-xl border border-[#26262B] bg-[#131316]"><table className="w-full text-xs"><thead><tr className="border-b border-[#26262B] text-left text-[10px] uppercase text-zinc-600">{['Ticker', 'Company', 'Realized P&L', 'Transactions', 'Status'].map((label) => <th key={label} className="px-4 py-3">{tr(label)}</th>)}</tr></thead><tbody className="divide-y divide-[#202024]">{data.closedAssets.map((asset) => {
            const history = data.transactions.filter((txn) => txn.asset_id === asset.id);
            const realized = history.filter((txn) => txn.type === 'sell').reduce((sum, txn) => sum + (txn.realized_pnl ?? 0), 0);
            return <tr key={asset.id}><td className="px-4 py-3 font-mono text-zinc-300">{asset.symbol}</td><td className="px-4 py-3 text-zinc-300">{asset.name}</td><td className="px-4 py-3 text-zinc-300">{formatValue(realized, asset.currency)}</td><td className="px-4 py-3 text-zinc-400">{history.length}</td><td className="px-4 py-3 text-zinc-500">{tr('Closed')}</td></tr>;
          })}</tbody></table></div>}
        </section>

        <section aria-labelledby="stock-research" className="space-y-3">
          <h2 id="stock-research" className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{tr('Research & decisions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ContextLink href="/watchlist" label="Watchlist" />
            <ContextLink href="/research" label="Research Notes" />
            <ContextLink href="/decisions" label="Decisions" />
          </div>
        </section>
      </main>
    </div>
  );
}

function Kpi({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return <div className={`rounded-xl border bg-[#131316] p-3 ${emphasis ? 'border-indigo-500/40' : 'border-[#26262B]'}`}><p className="text-[10px] text-zinc-500 min-h-7">{label}</p><p className="text-sm font-semibold tabular-nums text-zinc-100">{value}</p></div>;
}

function SmallMetric({ label, value, signed }: { label: string; value: string; signed?: number }) {
  return <div><p className="text-[10px] text-zinc-600">{label}</p><p className={`mt-1 text-xs font-medium tabular-nums ${signed == null ? 'text-zinc-200' : signed >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>{value}</p></div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-[#303037] bg-[#111114] p-6 text-sm text-zinc-600">{children}</div>;
}

function ContextLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="rounded-xl border border-[#26262B] bg-[#131316] px-4 py-4 text-sm text-zinc-300 hover:border-zinc-500">{tr(label)} →</Link>;
}
