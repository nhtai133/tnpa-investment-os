'use server';

import { db } from '@/db';
import {
  assets,
  bankAccounts,
  bankCreditCards,
  bankCreditFacilities,
  bankSavingsDeposits,
} from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AssetPurpose, BankAccountStatus, BankAccountType, BankCreditStatus, BankDepositStatus, BankFacilityType } from '@/db/schema';
import { eq } from 'drizzle-orm';

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return value && typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function num(formData: FormData, key: string): number {
  const value = str(formData, key);
  if (!value) return 0;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on' || formData.get(key) === 'true';
}

function revalidateBanking(bankName?: string | null) {
  revalidatePath('/banking');
  revalidatePath('/holdings');
  revalidatePath('/');
  revalidatePath('/performance');
  if (bankName) revalidatePath(`/banking/${encodeURIComponent(bankName.toLowerCase().replace(/\s+/g, '-'))}`);
}

export async function createBankAsset(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const institution = ((formData.get('institution') as string) || '').trim();
  const accountType = ((formData.get('account_type') as string) || 'Cash').trim();
  const currentValueRaw = formData.get('current_value') as string;
  const interestRateRaw = ((formData.get('interest_rate') as string) || '').trim();
  const maturityDate = ((formData.get('maturity_date') as string) || '').trim();
  const currency = ((formData.get('currency') as string) || 'VND').trim();
  const purpose = ((formData.get('purpose') as string) || 'liquidity_reserve') as AssetPurpose;
  const notesRaw = ((formData.get('notes') as string) || '').trim();

  const currentValue = parseFloat(currentValueRaw) || 0;

  const metaLines: string[] = [`Type: ${accountType}`];
  if (institution) metaLines.push(`Bank: ${institution}`);
  if (interestRateRaw) metaLines.push(`Rate: ${interestRateRaw}%`);
  if (maturityDate) metaLines.push(`Maturity: ${maturityDate}`);
  const notes = [metaLines.join(' · '), notesRaw].filter(Boolean).join('\n') || null;

  const now = new Date().toISOString();

  await db.insert(assets).values({
    name,
    asset_class: 'cash',
    purpose,
    current_value: currentValue,
    currency,
    notes,
    include_in_investment_net_worth: true,
    include_in_total_net_worth: true,
    created_at: now,
    updated_at: now,
  });

  revalidateBanking(institution);
  redirect('/banking');
}

export async function createBankAccount(formData: FormData) {
  const now = new Date().toISOString();
  const bankName = str(formData, 'bank_name');
  const accountName = str(formData, 'account_name');
  if (!bankName || !accountName) throw new Error('Bank and account name are required.');

  await db.insert(bankAccounts).values({
    bank_name: bankName,
    account_name: accountName,
    account_number: str(formData, 'account_number'),
    account_type: (str(formData, 'account_type') ?? 'Reserve') as BankAccountType,
    currency: str(formData, 'currency') ?? 'VND',
    balance: num(formData, 'balance'),
    purpose: (str(formData, 'purpose') ?? 'liquidity_reserve') as AssetPurpose,
    custom_purpose: str(formData, 'custom_purpose'),
    vip_tier: str(formData, 'vip_tier'),
    status: (str(formData, 'status') ?? 'active') as BankAccountStatus,
    notes: str(formData, 'notes'),
    created_at: now,
    updated_at: now,
  });

  revalidateBanking(bankName);
  redirect('/banking');
}

export async function updateBankAccount(id: number, formData: FormData) {
  const bankName = str(formData, 'bank_name');
  const accountName = str(formData, 'account_name');
  if (!bankName || !accountName) throw new Error('Bank and account name are required.');

  await db
    .update(bankAccounts)
    .set({
      bank_name: bankName,
      account_name: accountName,
      account_number: str(formData, 'account_number'),
      account_type: (str(formData, 'account_type') ?? 'Reserve') as BankAccountType,
      currency: str(formData, 'currency') ?? 'VND',
      balance: num(formData, 'balance'),
      purpose: (str(formData, 'purpose') ?? 'liquidity_reserve') as AssetPurpose,
      custom_purpose: str(formData, 'custom_purpose'),
      vip_tier: str(formData, 'vip_tier'),
      status: (str(formData, 'status') ?? 'active') as BankAccountStatus,
      notes: str(formData, 'notes'),
      updated_at: new Date().toISOString(),
    })
    .where(eq(bankAccounts.id, id));

  revalidateBanking(bankName);
  redirect('/banking');
}

export async function createBankSavingsDeposit(formData: FormData) {
  const now = new Date().toISOString();
  const bankAccountId = str(formData, 'bank_account_id');
  const bankName = str(formData, 'bank_name');
  const depositName = str(formData, 'deposit_name');
  if (!depositName) throw new Error('Deposit name is required.');

  await db.insert(bankSavingsDeposits).values({
    bank_account_id: bankAccountId ? Number(bankAccountId) : null,
    bank_name: bankName,
    deposit_name: depositName,
    principal: num(formData, 'principal'),
    interest_rate: num(formData, 'interest_rate'),
    term_months: Math.round(num(formData, 'term_months')),
    start_date: str(formData, 'start_date'),
    maturity_date: str(formData, 'maturity_date'),
    interest_payout_type: str(formData, 'interest_payout_type'),
    auto_renew: bool(formData, 'auto_renew'),
    status: (str(formData, 'status') ?? 'active') as BankDepositStatus,
    notes: str(formData, 'notes'),
    created_at: now,
    updated_at: now,
  });

  revalidateBanking(bankName);
  redirect('/banking');
}

export async function updateBankSavingsDeposit(id: number, formData: FormData) {
  const bankAccountId = str(formData, 'bank_account_id');
  const bankName = str(formData, 'bank_name');
  const depositName = str(formData, 'deposit_name');
  if (!depositName) throw new Error('Deposit name is required.');

  await db
    .update(bankSavingsDeposits)
    .set({
      bank_account_id: bankAccountId ? Number(bankAccountId) : null,
      bank_name: bankName,
      deposit_name: depositName,
      principal: num(formData, 'principal'),
      interest_rate: num(formData, 'interest_rate'),
      term_months: Math.round(num(formData, 'term_months')),
      start_date: str(formData, 'start_date'),
      maturity_date: str(formData, 'maturity_date'),
      interest_payout_type: str(formData, 'interest_payout_type'),
      auto_renew: bool(formData, 'auto_renew'),
      status: (str(formData, 'status') ?? 'active') as BankDepositStatus,
      notes: str(formData, 'notes'),
      updated_at: new Date().toISOString(),
    })
    .where(eq(bankSavingsDeposits.id, id));

  revalidateBanking(bankName);
  redirect('/banking');
}

export async function createBankCreditCard(formData: FormData) {
  const now = new Date().toISOString();
  const bankName = str(formData, 'bank_name');
  const cardName = str(formData, 'card_name');
  if (!bankName || !cardName) throw new Error('Bank and card name are required.');
  const creditLimit = num(formData, 'credit_limit');
  const currentUsed = num(formData, 'current_used');

  await db.insert(bankCreditCards).values({
    bank_name: bankName,
    card_name: cardName,
    card_network: str(formData, 'card_network'),
    credit_limit: creditLimit,
    current_used: currentUsed,
    available_limit: num(formData, 'available_limit') || Math.max(creditLimit - currentUsed, 0),
    statement_date: str(formData, 'statement_date'),
    due_date: str(formData, 'due_date'),
    annual_fee: num(formData, 'annual_fee'),
    status: (str(formData, 'status') ?? 'active') as BankCreditStatus,
    notes: str(formData, 'notes'),
    created_at: now,
    updated_at: now,
  });

  revalidateBanking(bankName);
  redirect('/banking');
}

export async function updateBankCreditCard(id: number, formData: FormData) {
  const bankName = str(formData, 'bank_name');
  const cardName = str(formData, 'card_name');
  if (!bankName || !cardName) throw new Error('Bank and card name are required.');
  const creditLimit = num(formData, 'credit_limit');
  const currentUsed = num(formData, 'current_used');

  await db
    .update(bankCreditCards)
    .set({
      bank_name: bankName,
      card_name: cardName,
      card_network: str(formData, 'card_network'),
      credit_limit: creditLimit,
      current_used: currentUsed,
      available_limit: num(formData, 'available_limit') || Math.max(creditLimit - currentUsed, 0),
      statement_date: str(formData, 'statement_date'),
      due_date: str(formData, 'due_date'),
      annual_fee: num(formData, 'annual_fee'),
      status: (str(formData, 'status') ?? 'active') as BankCreditStatus,
      notes: str(formData, 'notes'),
      updated_at: new Date().toISOString(),
    })
    .where(eq(bankCreditCards.id, id));

  revalidateBanking(bankName);
  redirect('/banking');
}

export async function createBankCreditFacility(formData: FormData) {
  const now = new Date().toISOString();
  const bankName = str(formData, 'bank_name');
  const facilityName = str(formData, 'facility_name');
  if (!bankName || !facilityName) throw new Error('Bank and facility name are required.');
  const limitAmount = num(formData, 'limit_amount');
  const currentUsed = num(formData, 'current_used');

  await db.insert(bankCreditFacilities).values({
    bank_name: bankName,
    facility_name: facilityName,
    facility_type: (str(formData, 'facility_type') ?? 'Other') as BankFacilityType,
    limit_amount: limitAmount,
    current_used: currentUsed,
    available_amount: num(formData, 'available_amount') || Math.max(limitAmount - currentUsed, 0),
    interest_rate: num(formData, 'interest_rate'),
    fee_rule: str(formData, 'fee_rule'),
    due_rule: str(formData, 'due_rule'),
    status: (str(formData, 'status') ?? 'active') as BankCreditStatus,
    notes: str(formData, 'notes'),
    created_at: now,
    updated_at: now,
  });

  revalidateBanking(bankName);
  redirect('/banking');
}

export async function updateBankCreditFacility(id: number, formData: FormData) {
  const bankName = str(formData, 'bank_name');
  const facilityName = str(formData, 'facility_name');
  if (!bankName || !facilityName) throw new Error('Bank and facility name are required.');
  const limitAmount = num(formData, 'limit_amount');
  const currentUsed = num(formData, 'current_used');

  await db
    .update(bankCreditFacilities)
    .set({
      bank_name: bankName,
      facility_name: facilityName,
      facility_type: (str(formData, 'facility_type') ?? 'Other') as BankFacilityType,
      limit_amount: limitAmount,
      current_used: currentUsed,
      available_amount: num(formData, 'available_amount') || Math.max(limitAmount - currentUsed, 0),
      interest_rate: num(formData, 'interest_rate'),
      fee_rule: str(formData, 'fee_rule'),
      due_rule: str(formData, 'due_rule'),
      status: (str(formData, 'status') ?? 'active') as BankCreditStatus,
      notes: str(formData, 'notes'),
      updated_at: new Date().toISOString(),
    })
    .where(eq(bankCreditFacilities.id, id));

  revalidateBanking(bankName);
  redirect('/banking');
}
