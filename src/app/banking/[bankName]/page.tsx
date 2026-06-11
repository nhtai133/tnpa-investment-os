import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardHeader, Badge } from '@/components/ui/Card';
import { computeBankingSummary, getBankingData, getLegacyAssetBank, bankNameFromSlug, maskAccountNumber, resolveDepositBankName } from '@/lib/banking';
import { formatDate, formatValue, PURPOSE_LABELS, PURPOSE_COLORS } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">{label}</p>
      <p className="mt-2 text-xl font-light text-zinc-50 tabular-nums">{value}</p>
    </Card>
  );
}

function dateLabel(value: string | null) {
  return value ? formatDate(value) : '-';
}

export default async function BankDetailPage({ params }: { params: { bankName: string } }) {
  const wanted = bankNameFromSlug(params.bankName);
  const data = await getBankingData();

  const matches = (value: string) => value.toLowerCase() === wanted.toLowerCase();
  const accounts = data.accounts.filter((account) => matches(account.bank_name));
  const deposits = data.deposits.filter((deposit) => matches(resolveDepositBankName(deposit, data.accounts)));
  const creditCards = data.creditCards.filter((card) => matches(card.bank_name));
  const creditFacilities = data.creditFacilities.filter((facility) => matches(facility.bank_name));
  const legacyAssets = data.legacyAssets.filter((asset) => matches(getLegacyAssetBank(asset)));

  if (accounts.length + deposits.length + creditCards.length + creditFacilities.length + legacyAssets.length === 0) {
    notFound();
  }

  const bankData = { accounts, deposits, creditCards, creditFacilities, legacyAssets };
  const summary = computeBankingSummary(bankData);
  const vipTiers = Array.from(new Set(accounts.map((account) => account.vip_tier).filter(Boolean)));
  const notes = [
    ...accounts.map((account) => account.notes).filter(Boolean),
    ...deposits.map((deposit) => deposit.notes).filter(Boolean),
    ...creditCards.map((card) => card.notes).filter(Boolean),
    ...creditFacilities.map((facility) => facility.notes).filter(Boolean),
  ];

  const displayName = accounts[0]?.bank_name ?? deposits[0]?.bank_name ?? creditCards[0]?.bank_name ?? creditFacilities[0]?.bank_name ?? wanted;

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/banking" className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold">
              Back to Banking
            </Link>
            <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">{displayName}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">VIP tier</p>
            <p className="text-sm text-zinc-200">{vipTiers.join(', ') || 'Not set'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Summary label="Total by Bank" value={formatValue(summary.totalBankingValue, 'VND')} />
          <Summary label="Accounts" value={formatValue(summary.checkingBalance, 'VND')} />
          <Summary label="Deposits" value={formatValue(summary.savingsBalance, 'VND')} />
          <Summary label="Credit Used" value={formatValue(summary.creditUsed, 'VND')} />
        </div>

        <Card className="overflow-hidden">
          <CardHeader label="Accounts" action={`${accounts.length} accounts`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#26262B]">{['Account', 'Number', 'Balance', 'Purpose', 'VIP', 'Status'].map((h) => <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600">{h}</th>)}</tr></thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-[#1C1C21]">
                    <td className="px-4 py-3.5 text-zinc-100">{account.account_name}</td>
                    <td className="px-4 py-3.5 text-zinc-500">{maskAccountNumber(account.account_number)}</td>
                    <td className="px-4 py-3.5 text-zinc-100">{formatValue(account.balance, account.currency)}</td>
                    <td className="px-4 py-3.5"><span className="text-xs" style={{ color: PURPOSE_COLORS[account.purpose] }}>{PURPOSE_LABELS[account.purpose]}</span></td>
                    <td className="px-4 py-3.5 text-zinc-400">{account.vip_tier || '-'}</td>
                    <td className="px-4 py-3.5"><Badge label={account.status} color={account.status === 'active' ? '#34D399' : '#9CA3AF'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader label="Savings Deposits" action={`${deposits.length} deposits`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#26262B]">{['Deposit', 'Principal', 'Rate', 'Term', 'Start', 'Maturity', 'Auto Renew', 'Status'].map((h) => <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-zinc-600">{h}</th>)}</tr></thead>
              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id} className="border-b border-[#1C1C21]">
                    <td className="px-4 py-3.5 text-zinc-100">{deposit.deposit_name}</td>
                    <td className="px-4 py-3.5 text-zinc-100">{formatValue(deposit.principal, 'VND')}</td>
                    <td className="px-4 py-3.5 text-zinc-300">{deposit.interest_rate.toFixed(2)}%</td>
                    <td className="px-4 py-3.5 text-zinc-400">{deposit.term_months} mo</td>
                    <td className="px-4 py-3.5 text-zinc-500">{dateLabel(deposit.start_date)}</td>
                    <td className="px-4 py-3.5 text-zinc-500">{dateLabel(deposit.maturity_date)}</td>
                    <td className="px-4 py-3.5 text-zinc-400">{deposit.auto_renew ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3.5"><Badge label={deposit.status} color={deposit.status === 'active' ? '#34D399' : '#9CA3AF'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="px-5 py-4">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600">Notes</p>
          {notes.length > 0 ? (
            <div className="mt-3 space-y-2">
              {notes.map((note, index) => <p key={index} className="text-sm text-zinc-400 leading-relaxed">{note}</p>)}
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-600">No notes recorded for this bank.</p>
          )}
        </Card>
      </main>
    </div>
  );
}
