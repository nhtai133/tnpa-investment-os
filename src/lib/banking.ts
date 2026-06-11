import { db } from '@/db';
import {
  assets,
  bankAccounts,
  bankCreditCards,
  bankCreditFacilities,
  bankSavingsDeposits,
  type Asset,
  type BankAccount,
  type BankCreditCard,
  type BankCreditFacility,
  type BankSavingsDeposit,
} from '@/db/schema';
import { normalizeToUsd } from '@/lib/fx';
import { asc, eq } from 'drizzle-orm';

export type BankingData = {
  accounts: BankAccount[];
  deposits: BankSavingsDeposit[];
  creditCards: BankCreditCard[];
  creditFacilities: BankCreditFacility[];
  legacyAssets: Asset[];
};

export type BankingSummary = {
  totalBankingValue: number;
  checkingBalance: number;
  savingsBalance: number;
  upcomingMaturities: number;
  totalCreditLimit: number;
  creditUsed: number;
  availableCredit: number;
  debtDueThisMonth: number;
};

export function maskAccountNumber(value: string | null): string {
  if (!value) return 'Not set';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return `****${digits}`;
  return `****${digits.slice(-4)}`;
}

export function slugBankName(bankName: string): string {
  return encodeURIComponent(bankName.trim().toLowerCase().replace(/\s+/g, '-'));
}

export function bankNameFromSlug(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, ' ');
}

export function resolveDepositBankName(deposit: BankSavingsDeposit, accounts: BankAccount[]): string {
  if (deposit.bank_name) return deposit.bank_name;
  const linked = accounts.find((account) => account.id === deposit.bank_account_id);
  return linked?.bank_name ?? 'Unassigned';
}

export function getLegacyAssetBank(asset: Asset): string {
  const bankLine = asset.notes
    ?.split('\n')[0]
    ?.split(' · ')
    .find((part) => part.startsWith('Bank: '));
  return bankLine?.replace('Bank: ', '').trim() || 'Legacy Banking';
}

export async function getBankingData(): Promise<BankingData> {
  const [accounts, deposits, creditCards, creditFacilities, legacyAssets] = await Promise.all([
    db.select().from(bankAccounts).orderBy(asc(bankAccounts.bank_name), asc(bankAccounts.account_name)),
    db.select().from(bankSavingsDeposits).orderBy(asc(bankSavingsDeposits.maturity_date), asc(bankSavingsDeposits.deposit_name)),
    db.select().from(bankCreditCards).orderBy(asc(bankCreditCards.bank_name), asc(bankCreditCards.card_name)),
    db.select().from(bankCreditFacilities).orderBy(asc(bankCreditFacilities.bank_name), asc(bankCreditFacilities.facility_name)),
    db
      .select()
      .from(assets)
      .where(eq(assets.asset_class, 'cash'))
      .orderBy(asc(assets.name)),
  ]);

  return {
    accounts,
    deposits,
    creditCards,
    creditFacilities,
    legacyAssets: legacyAssets.filter((asset) => !asset.is_archived),
  };
}

export function computeBankingSummary(data: BankingData): BankingSummary {
  const activeAccounts = data.accounts.filter((account) => account.status === 'active');
  const activeDeposits = data.deposits.filter((deposit) => deposit.status === 'active');
  const activeCards = data.creditCards.filter((card) => card.status === 'active');
  const activeFacilities = data.creditFacilities.filter((facility) => facility.status === 'active');

  const checkingBalance = activeAccounts.reduce((sum, account) => sum + account.balance, 0);
  const savingsBalance = activeDeposits.reduce((sum, deposit) => sum + deposit.principal, 0);
  const legacyBalance = data.legacyAssets.reduce((sum, asset) => sum + asset.current_value, 0);

  const today = new Date();
  const inThirtyDays = new Date();
  inThirtyDays.setDate(today.getDate() + 30);
  const todayStr = today.toISOString().split('T')[0];
  const inThirtyDaysStr = inThirtyDays.toISOString().split('T')[0];

  const upcomingMaturities = activeDeposits.filter(
    (deposit) =>
      deposit.maturity_date &&
      deposit.maturity_date >= todayStr &&
      deposit.maturity_date <= inThirtyDaysStr,
  ).length;

  const totalCreditLimit =
    activeCards.reduce((sum, card) => sum + card.credit_limit, 0) +
    activeFacilities.reduce((sum, facility) => sum + facility.limit_amount, 0);
  const creditUsed =
    activeCards.reduce((sum, card) => sum + card.current_used, 0) +
    activeFacilities.reduce((sum, facility) => sum + facility.current_used, 0);
  const availableCredit =
    activeCards.reduce((sum, card) => sum + card.available_limit, 0) +
    activeFacilities.reduce((sum, facility) => sum + facility.available_amount, 0);

  const currentMonth = todayStr.slice(0, 7);
  const debtDueThisMonth = activeCards
    .filter((card) => card.due_date?.startsWith(currentMonth))
    .reduce((sum, card) => sum + card.current_used, 0);

  return {
    totalBankingValue: checkingBalance + savingsBalance + legacyBalance,
    checkingBalance,
    savingsBalance,
    upcomingMaturities,
    totalCreditLimit,
    creditUsed,
    availableCredit,
    debtDueThisMonth,
  };
}

export function computeCreditLiabilityUsd(
  creditCards: BankCreditCard[],
  creditFacilities: BankCreditFacility[],
  usdVndRate: number,
): number {
  const cardLiabilities = creditCards
    .filter((card) => card.status === 'active')
    .reduce((sum, card) => sum + normalizeToUsd(card.current_used, 'VND', usdVndRate), 0);
  const facilityLiabilities = creditFacilities
    .filter((facility) => facility.status === 'active')
    .reduce((sum, facility) => sum + normalizeToUsd(facility.current_used, 'VND', usdVndRate), 0);
  return cardLiabilities + facilityLiabilities;
}

export async function getCreditLiabilityUsd(usdVndRate: number): Promise<number> {
  const [creditCards, creditFacilities] = await Promise.all([
    db.select().from(bankCreditCards),
    db.select().from(bankCreditFacilities),
  ]);
  return computeCreditLiabilityUsd(creditCards, creditFacilities, usdVndRate);
}
