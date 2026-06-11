import Link from 'next/link';
import { ModulePageHeader } from '@/components/markets/ModulePageHeader';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import { HoldingsTable } from '@/components/holdings/HoldingsTable';
import { getModuleData } from '@/lib/moduleData';
import {
  computeBankingSummary,
  getBankingData,
  getLegacyAssetBank,
  maskAccountNumber,
  resolveDepositBankName,
  slugBankName,
} from '@/lib/banking';
import { normalizeToUsd } from '@/lib/fx';
import { formatDate, formatPercent, formatValue, formatWeight, PURPOSE_LABELS, PURPOSE_COLORS } from '@/lib/formatters';
import { getPortfolioSummary } from '@/lib/portfolio-aggregation';
import { SourceContributionPanel } from '@/components/portfolio/SourceContributionPanel';

export const dynamic = 'force-dynamic';

function SummaryCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'green' | 'amber' | 'red' }) {
  const color =
    tone === 'green' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : tone === 'red' ? 'text-red-300' : 'text-zinc-50';
  return (
    <Card className="px-5 py-4">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">{label}</p>
      <p className={`mt-2 text-xl font-light tabular-nums ${color}`}>{value}</p>
    </Card>
  );
}

function displayDate(date: string | null) {
  return date ? formatDate(date) : '-';
}

function toVnd(value: number, currency: string, usdVndRate: number) {
  return currency === 'USD' ? value * usdVndRate : value;
}

function AllocationRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const weight = total > 0 ? (Math.abs(value) / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-zinc-400 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={value < 0 ? 'text-xs text-red-300 tabular-nums' : 'text-xs text-zinc-300 tabular-nums'}>
            {value < 0 ? '-' : ''}{formatValue(Math.abs(value), 'VND')}
          </span>
          <span className="text-xs text-zinc-600 tabular-nums w-12 text-right">{formatWeight(weight)}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-[#1C1C21] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(weight, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default async function BankingPage() {
  const [
    { classAssets, totalNW, usdVndRate },
    bankingData,
    portfolio,
  ] = await Promise.all([getModuleData('cash'), getBankingData(), getPortfolioSummary()]);

  const summary = computeBankingSummary(bankingData);
  const activeAccounts = bankingData.accounts.filter((account) => account.status === 'active');
  const activeDeposits = bankingData.deposits.filter((deposit) => deposit.status === 'active');
  const activeCards = bankingData.creditCards.filter((card) => card.status === 'active');
  const activeFacilities = bankingData.creditFacilities.filter((facility) => facility.status === 'active');

  const checkingVnd = activeAccounts.reduce((sum, account) => sum + toVnd(account.balance, account.currency, usdVndRate), 0);
  const checkingUsd = activeAccounts.reduce((sum, account) => sum + normalizeToUsd(account.balance, account.currency, usdVndRate), 0);
  const savingsVnd = activeDeposits.reduce((sum, deposit) => sum + deposit.principal, 0);
  const savingsUsd = normalizeToUsd(savingsVnd, 'VND', usdVndRate);
  const legacyVnd = bankingData.legacyAssets.reduce((sum, asset) => sum + toVnd(asset.current_value, asset.currency, usdVndRate), 0);
  const legacyUsd = bankingData.legacyAssets.reduce((sum, asset) => sum + normalizeToUsd(asset.current_value, asset.currency, usdVndRate), 0);
  const creditCardsUsedVnd = activeCards.reduce((sum, card) => sum + card.current_used, 0);
  const creditFacilitiesUsedVnd = activeFacilities.reduce((sum, facility) => sum + facility.current_used, 0);
  const creditCardsUsedUsd = normalizeToUsd(creditCardsUsedVnd, 'VND', usdVndRate);
  const creditFacilitiesUsedUsd = normalizeToUsd(creditFacilitiesUsedVnd, 'VND', usdVndRate);
  const bankingMarketValue = checkingVnd + savingsVnd + legacyVnd - creditCardsUsedVnd - creditFacilitiesUsedVnd;
  const bankingMarketValueUsd = checkingUsd + savingsUsd + legacyUsd - creditCardsUsedUsd - creditFacilitiesUsedUsd;
  const allocationRows = [
    { label: 'Bank Accounts / Checking', value: checkingVnd, color: '#60A5FA' },
    { label: 'Savings Deposits', value: savingsVnd, color: '#34D399' },
    { label: 'Legacy Bank Assets', value: legacyVnd, color: '#A78BFA' },
    ...(creditCardsUsedVnd > 0 ? [{ label: 'Credit Cards Used', value: -creditCardsUsedVnd, color: '#F87171' }] : []),
    ...(creditFacilitiesUsedVnd > 0 ? [{ label: 'Credit Facilities Used', value: -creditFacilitiesUsedVnd, color: '#FB7185' }] : []),
  ].filter((row) => Math.abs(row.value) > 0);
  const allocationTotal = allocationRows.reduce((sum, row) => sum + Math.abs(row.value), 0);

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <ModulePageHeader
        assetClass="cash"
        title="Banking"
        addHref="/banking/accounts/new"
        addLabel="+ Add Bank Account"
        currency="VND"
        totalValue={bankingMarketValue}
        count={bankingData.accounts.length + bankingData.deposits.length + bankingData.creditCards.length + bankingData.creditFacilities.length}
        investmentNW={portfolio.investmentNetWorth}
        totalNW={portfolio.totalNetWorth}
        classValueUsd={bankingMarketValueUsd}
      />

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/banking/accounts/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
            Add Bank Account
          </Link>
          <Link href="/banking/deposits/new" className="px-4 py-2 bg-[#1C1C21] hover:bg-[#26262B] text-zinc-200 text-sm font-medium rounded-lg transition-colors">
            Add Savings Deposit
          </Link>
          <Link href="/banking/cards/new" className="px-4 py-2 bg-[#1C1C21] hover:bg-[#26262B] text-zinc-200 text-sm font-medium rounded-lg transition-colors">
            Add Credit Card
          </Link>
          <Link href="/banking/facilities/new" className="px-4 py-2 bg-[#1C1C21] hover:bg-[#26262B] text-zinc-200 text-sm font-medium rounded-lg transition-colors">
            Add Credit Facility
          </Link>
          <Link href="/banking/new" className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Add legacy bank asset
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard label="Total Banking Value" value={formatValue(summary.totalBankingValue, 'VND')} />
          <SummaryCard label="Checking Balance" value={formatValue(summary.checkingBalance, 'VND')} />
          <SummaryCard label="Savings Balance" value={formatValue(summary.savingsBalance, 'VND')} tone="green" />
          <SummaryCard label="Upcoming Maturities" value={`${summary.upcomingMaturities}`} tone="amber" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <SummaryCard label="Total Banking Cash" value={formatValue(summary.totalBankingValue, 'VND')} />
          <SummaryCard label="Savings Balance" value={formatValue(summary.savingsBalance, 'VND')} tone="green" />
          <SummaryCard label="Total Credit Limit" value={formatValue(summary.totalCreditLimit, 'VND')} />
          <SummaryCard label="Credit Used" value={formatValue(summary.creditUsed, 'VND')} tone="red" />
          <SummaryCard label="Available Credit" value={formatValue(summary.availableCredit, 'VND')} tone="amber" />
          <SummaryCard label="Debt Due This Month" value={formatValue(summary.debtDueThisMonth, 'VND')} tone="red" />
        </div>

        <SourceContributionPanel rows={portfolio.sourceContributions} />

        <Card className="px-5 py-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">Banking Allocation</p>
              <p className="mt-1 text-xs text-zinc-700">Assets count toward banking value; used credit is shown as liability.</p>
            </div>
            <p className="text-sm text-zinc-300 tabular-nums">{formatValue(bankingMarketValue, 'VND')}</p>
          </div>
          {allocationRows.length > 0 ? (
            <div className="space-y-4">
              {allocationRows.map((row) => (
                <AllocationRow key={row.label} label={row.label} value={row.value} total={allocationTotal} color={row.color} />
              ))}
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center">
              <p className="text-sm text-zinc-600">No banking allocation data yet.</p>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader label="Bank Accounts" action={`${bankingData.accounts.length} accounts`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#26262B]">
                  {['Bank', 'Account Name', 'Account Number', 'Balance', 'Purpose', 'VIP Tier', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bankingData.accounts.map((account) => (
                  <tr key={account.id} className="border-b border-[#1C1C21] hover:bg-[#1C1C21] transition-colors">
                    <td className="px-4 py-3.5">
                      <Link href={`/banking/${slugBankName(account.bank_name)}`} className="text-zinc-100 hover:text-indigo-300">{account.bank_name}</Link>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-300">{account.account_name}</td>
                    <td className="px-4 py-3.5 text-zinc-500">{maskAccountNumber(account.account_number)}</td>
                    <td className="px-4 py-3.5 text-zinc-100 tabular-nums">{formatValue(account.balance, account.currency)}</td>
                    <td className="px-4 py-3.5"><span className="text-xs" style={{ color: PURPOSE_COLORS[account.purpose] }}>{PURPOSE_LABELS[account.purpose]}</span></td>
                    <td className="px-4 py-3.5 text-zinc-400">{account.vip_tier || '-'}</td>
                    <td className="px-4 py-3.5"><Badge label={account.status} color={account.status === 'active' ? '#34D399' : '#9CA3AF'} /></td>
                    <td className="px-4 py-3.5">
                      <Link href={`/banking/accounts/${account.id}/edit`} className="text-xs text-zinc-500 hover:text-zinc-200">Edit</Link>
                    </td>
                  </tr>
                ))}
                {bankingData.accounts.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-600">No bank accounts yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader label="Savings Deposits" action={`${bankingData.deposits.length} deposits`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#26262B]">
                  {['Bank', 'Deposit Name', 'Principal', 'Interest Rate', 'Term', 'Start Date', 'Maturity Date', 'Auto Renew', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bankingData.deposits.map((deposit) => {
                  const bankName = resolveDepositBankName(deposit, bankingData.accounts);
                  return (
                    <tr key={deposit.id} className="border-b border-[#1C1C21] hover:bg-[#1C1C21] transition-colors">
                      <td className="px-4 py-3.5"><Link href={`/banking/${slugBankName(bankName)}`} className="text-zinc-100 hover:text-indigo-300">{bankName}</Link></td>
                      <td className="px-4 py-3.5 text-zinc-300">{deposit.deposit_name}</td>
                      <td className="px-4 py-3.5 text-zinc-100 tabular-nums">{formatValue(deposit.principal, 'VND')}</td>
                      <td className="px-4 py-3.5 text-zinc-300">{formatPercent(deposit.interest_rate, 2)}</td>
                      <td className="px-4 py-3.5 text-zinc-400">{deposit.term_months} mo</td>
                      <td className="px-4 py-3.5 text-zinc-500">{displayDate(deposit.start_date)}</td>
                      <td className="px-4 py-3.5 text-zinc-500">{displayDate(deposit.maturity_date)}</td>
                      <td className="px-4 py-3.5 text-zinc-400">{deposit.auto_renew ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3.5"><Badge label={deposit.status} color={deposit.status === 'active' ? '#34D399' : '#9CA3AF'} /></td>
                      <td className="px-4 py-3.5"><Link href={`/banking/deposits/${deposit.id}/edit`} className="text-xs text-zinc-500 hover:text-zinc-200">Edit</Link></td>
                    </tr>
                  );
                })}
                {bankingData.deposits.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-zinc-600">No savings deposits yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <CardHeader label="Credit Cards" action="Liability only" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#26262B]">{['Bank', 'Card', 'Limit', 'Used', 'Available', 'Due', 'Status', 'Actions'].map((h) => <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600">{h}</th>)}</tr></thead>
                <tbody>
                  {bankingData.creditCards.map((card) => (
                    <tr key={card.id} className="border-b border-[#1C1C21] hover:bg-[#1C1C21]">
                      <td className="px-4 py-3.5"><Link href={`/banking/${slugBankName(card.bank_name)}`} className="text-zinc-100 hover:text-indigo-300">{card.bank_name}</Link></td>
                      <td className="px-4 py-3.5 text-zinc-300">{card.card_name}</td>
                      <td className="px-4 py-3.5 text-zinc-300">{formatValue(card.credit_limit, 'VND')}</td>
                      <td className="px-4 py-3.5 text-red-300">{formatValue(card.current_used, 'VND')}</td>
                      <td className="px-4 py-3.5 text-amber-300">{formatValue(card.available_limit, 'VND')}</td>
                      <td className="px-4 py-3.5 text-zinc-500">{displayDate(card.due_date)}</td>
                      <td className="px-4 py-3.5"><Badge label={card.status} color={card.status === 'active' ? '#34D399' : '#9CA3AF'} /></td>
                      <td className="px-4 py-3.5"><Link href={`/banking/cards/${card.id}/edit`} className="text-xs text-zinc-500 hover:text-zinc-200">Edit</Link></td>
                    </tr>
                  ))}
                  {bankingData.creditCards.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-600">No credit cards yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader label="Credit Facilities" action="Capacity only" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#26262B]">{['Bank', 'Facility', 'Type', 'Limit', 'Used', 'Available', 'Status', 'Actions'].map((h) => <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600">{h}</th>)}</tr></thead>
                <tbody>
                  {bankingData.creditFacilities.map((facility) => (
                    <tr key={facility.id} className="border-b border-[#1C1C21] hover:bg-[#1C1C21]">
                      <td className="px-4 py-3.5"><Link href={`/banking/${slugBankName(facility.bank_name)}`} className="text-zinc-100 hover:text-indigo-300">{facility.bank_name}</Link></td>
                      <td className="px-4 py-3.5 text-zinc-300">{facility.facility_name}</td>
                      <td className="px-4 py-3.5 text-zinc-400">{facility.facility_type}</td>
                      <td className="px-4 py-3.5 text-zinc-300">{formatValue(facility.limit_amount, 'VND')}</td>
                      <td className="px-4 py-3.5 text-red-300">{formatValue(facility.current_used, 'VND')}</td>
                      <td className="px-4 py-3.5 text-amber-300">{formatValue(facility.available_amount, 'VND')}</td>
                      <td className="px-4 py-3.5"><Badge label={facility.status} color={facility.status === 'active' ? '#34D399' : '#9CA3AF'} /></td>
                      <td className="px-4 py-3.5"><Link href={`/banking/facilities/${facility.id}/edit`} className="text-xs text-zinc-500 hover:text-zinc-200">Edit</Link></td>
                    </tr>
                  ))}
                  {bankingData.creditFacilities.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-600">No credit facilities yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {bankingData.legacyAssets.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader
              label="Legacy Banking Holdings"
              action={`${bankingData.legacyAssets.length} cash assets preserved`}
            />
            <div className="px-5 py-3 border-b border-[#26262B] text-xs text-zinc-600">
              Existing simple banking assets still render here and remain in the global holdings registry.
            </div>
            <HoldingsTable assets={classAssets} totalNetWorth={totalNW} usdVndRate={usdVndRate} />
            <div className="hidden">
              {bankingData.legacyAssets.map((asset) => getLegacyAssetBank(asset)).join(', ')}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
