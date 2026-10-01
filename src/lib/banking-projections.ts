import type { BankSavingsDeposit } from '@/db/schema';

const DAY_MS = 86_400_000;

function utcDate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysBetween(start: string, end: string): number {
  const a = utcDate(start);
  const b = utcDate(end);
  if (!a || !b) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / DAY_MS));
}

export interface SavingsDepositProjection {
  daysRemaining: number | null;
  termDays: number;
  expectedInterest: number;
  expectedMaturityValue: number;
  interestAtMaturity: boolean;
}

/** Simple interest on actual calendar days / 365. No compounding is assumed. */
export function projectSavingsDeposit(
  deposit: Pick<BankSavingsDeposit, 'principal' | 'interest_rate' | 'term_months' | 'start_date' | 'maturity_date' | 'interest_payout_type'>,
  today = new Date().toISOString().slice(0, 10),
): SavingsDepositProjection {
  const termDays = deposit.start_date && deposit.maturity_date
    ? daysBetween(deposit.start_date, deposit.maturity_date)
    : Math.max(0, Math.round((deposit.term_months ?? 0) * 365 / 12));
  const todayDate = utcDate(today);
  const maturityDate = utcDate(deposit.maturity_date);
  const daysRemaining = maturityDate && todayDate
    ? Math.round((maturityDate.getTime() - todayDate.getTime()) / DAY_MS)
    : null;
  const payout = (deposit.interest_payout_type ?? '').trim().toLowerCase();
  const interestAtMaturity = !payout || /matur|end|đáo|cuối kỳ/.test(payout);
  const expectedInterest = Math.max(0, deposit.principal) * Math.max(0, deposit.interest_rate) / 100 * termDays / 365;
  return {
    daysRemaining,
    termDays,
    expectedInterest,
    expectedMaturityValue: Math.max(0, deposit.principal) + (interestAtMaturity ? expectedInterest : 0),
    interestAtMaturity,
  };
}

export function calculateBankingProjection(input: {
  liquidBalances: { bankName: string; balance: number }[];
  deposits: { bankName: string; principal: number; expectedInterest: number; expectedMaturityValue: number }[];
}) {
  const banks = new Map<string, { bankName: string; liquidCash: number; savingsPrincipal: number; expectedInterest: number; expectedMaturityValue: number }>();
  const get = (name: string) => {
    const bankName = name.trim() || 'Ngân hàng khác';
    if (!banks.has(bankName)) banks.set(bankName, { bankName, liquidCash: 0, savingsPrincipal: 0, expectedInterest: 0, expectedMaturityValue: 0 });
    return banks.get(bankName)!;
  };
  for (const row of input.liquidBalances) get(row.bankName).liquidCash += row.balance;
  for (const row of input.deposits) {
    const bank = get(row.bankName);
    bank.savingsPrincipal += row.principal;
    bank.expectedInterest += row.expectedInterest;
    bank.expectedMaturityValue += row.expectedMaturityValue;
  }
  const rows = [...banks.values()].sort((a, b) => a.bankName.localeCompare(b.bankName, 'vi'));
  const liquidCash = rows.reduce((sum, row) => sum + row.liquidCash, 0);
  const savingsPrincipal = rows.reduce((sum, row) => sum + row.savingsPrincipal, 0);
  const expectedInterest = rows.reduce((sum, row) => sum + row.expectedInterest, 0);
  const expectedMaturityValue = rows.reduce((sum, row) => sum + row.expectedMaturityValue, 0);
  return { rows, liquidCash, savingsPrincipal, expectedInterest, expectedMaturityValue, currentBankWealth: liquidCash + savingsPrincipal };
}
