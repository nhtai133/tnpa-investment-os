import { db } from '@/db';
import { bankAccounts, bankCreditCards, bankCreditFacilities, bankSavingsDeposits } from '@/db/schema';
import { asc } from 'drizzle-orm';

export type MaturityStatus = 'Matured' | 'Due Today' | 'Due in 7 days' | 'Due in 30 days' | 'Future';
export type BankingEventType = 'Savings Maturity' | 'Credit Card Due Date' | 'ShopCash Renewal' | 'Deposit Renewal';

export interface BankingEvent {
  key: string;
  date: string;
  eventType: BankingEventType;
  bankName: string;
  name: string;
  amount: number;
  daysRemaining: number;
  maturityStatus: MaturityStatus;
  href: string;
}

export interface BankingMaturitySummary {
  alerts: BankingEvent[];
  events: BankingEvent[];
  upcomingMaturities: number;
  maturingCapital: number;
}

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function parseDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function getDaysRemaining(date: string, today = startOfToday()) {
  const target = parseDate(date);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((target.getTime() - today.getTime()) / msPerDay);
}

export function getMaturityStatus(daysRemaining: number): MaturityStatus {
  if (daysRemaining < 0) return 'Matured';
  if (daysRemaining === 0) return 'Due Today';
  if (daysRemaining <= 7) return 'Due in 7 days';
  if (daysRemaining <= 30) return 'Due in 30 days';
  return 'Future';
}

export function formatDaysRemaining(daysRemaining: number) {
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)} days overdue`;
  if (daysRemaining === 0) return 'today';
  if (daysRemaining === 1) return 'tomorrow';
  return `${daysRemaining} days`;
}

function extractIsoDate(value: string | null) {
  if (!value) return null;
  return value.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
}

export async function getBankingMaturitySummary(): Promise<BankingMaturitySummary> {
  const [accounts, deposits, creditCards, creditFacilities] = await Promise.all([
    db.select().from(bankAccounts).orderBy(asc(bankAccounts.bank_name)),
    db.select().from(bankSavingsDeposits).orderBy(asc(bankSavingsDeposits.maturity_date)),
    db.select().from(bankCreditCards).orderBy(asc(bankCreditCards.due_date)),
    db.select().from(bankCreditFacilities).orderBy(asc(bankCreditFacilities.bank_name)),
  ]);
  const accountBankById = new Map(accounts.map((account) => [account.id, account.bank_name]));
  const today = startOfToday();

  const events: BankingEvent[] = [];

  for (const deposit of deposits.filter((row) => row.status === 'active' && row.maturity_date)) {
    const maturityDate = deposit.maturity_date as string;
    const daysRemaining = getDaysRemaining(maturityDate, today);
    const bankName = deposit.bank_name ?? (deposit.bank_account_id ? accountBankById.get(deposit.bank_account_id) : undefined) ?? 'Unassigned';
    events.push({
      key: `deposit-${deposit.id}`,
      date: maturityDate,
      eventType: deposit.auto_renew ? 'Deposit Renewal' : 'Savings Maturity',
      bankName,
      name: deposit.deposit_name,
      amount: deposit.principal,
      daysRemaining,
      maturityStatus: getMaturityStatus(daysRemaining),
      href: `/banking/${encodeURIComponent(bankName.trim().toLowerCase().replace(/\s+/g, '-'))}`,
    });
  }

  for (const card of creditCards.filter((row) => row.status === 'active' && row.due_date && row.current_used > 0)) {
    const dueDate = card.due_date as string;
    const daysRemaining = getDaysRemaining(dueDate, today);
    events.push({
      key: `credit-card-${card.id}`,
      date: dueDate,
      eventType: 'Credit Card Due Date',
      bankName: card.bank_name,
      name: card.card_name,
      amount: card.current_used,
      daysRemaining,
      maturityStatus: getMaturityStatus(daysRemaining),
      href: `/banking/${encodeURIComponent(card.bank_name.trim().toLowerCase().replace(/\s+/g, '-'))}`,
    });
  }

  for (const facility of creditFacilities.filter((row) => row.status === 'active' && row.facility_type === 'ShopCash')) {
    const dueDate = extractIsoDate(facility.due_rule);
    if (!dueDate) continue;
    const daysRemaining = getDaysRemaining(dueDate, today);
    events.push({
      key: `facility-${facility.id}`,
      date: dueDate,
      eventType: 'ShopCash Renewal',
      bankName: facility.bank_name,
      name: facility.facility_name,
      amount: facility.current_used,
      daysRemaining,
      maturityStatus: getMaturityStatus(daysRemaining),
      href: `/banking/${encodeURIComponent(facility.bank_name.trim().toLowerCase().replace(/\s+/g, '-'))}`,
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));

  const alerts = events.filter((event) => event.daysRemaining <= 30);
  const depositAlerts = alerts.filter(
    (event) => event.eventType === 'Savings Maturity' || event.eventType === 'Deposit Renewal',
  );

  return {
    alerts,
    events,
    upcomingMaturities: depositAlerts.length,
    maturingCapital: depositAlerts.reduce((sum, event) => sum + event.amount, 0),
  };
}
