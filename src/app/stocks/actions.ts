'use server';

import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AssetPurpose } from '@/db/schema';
import { recordStockTransaction, setStockMarketPrice } from '@/lib/stock-workspace';

export type StockActionState = { error?: string; success?: string } | null;

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function numberValue(formData: FormData, key: string) {
  const raw = textValue(formData, key);
  if (!raw) return 0;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${key} must be a valid number.`);
  return value;
}

export async function createStockInstrument(formData: FormData): Promise<StockActionState> {
  const symbol = textValue(formData, 'symbol').toUpperCase();
  const name = textValue(formData, 'name');
  const currency = textValue(formData, 'currency') || 'VND';
  if (!symbol || !name) return { error: 'Enter a ticker and company name.' };
  if (!['VND', 'USD'].includes(currency)) return { error: 'Choose VND or USD.' };
  const existing = await db.select().from(assets).where(and(eq(assets.asset_class, 'stock'), eq(assets.symbol, symbol))).limit(1);
  if (existing[0]) return { error: 'Ticker already exists in the stock workspace.' };
  const now = new Date().toISOString();
  await db.insert(assets).values({
    name, symbol, asset_class: 'stock', purpose: 'wealth_compounder', current_value: 0,
    currency, quantity: 0, cost_basis: 0, include_in_total_net_worth: true,
    include_in_investment_net_worth: true, is_archived: false, created_at: now, updated_at: now,
  });
  revalidatePath('/stocks');
  return { success: 'Ticker added. Record a buy to open the position.' };
}

export async function recordStockWorkspaceTransaction(formData: FormData): Promise<StockActionState> {
  try {
    const type = textValue(formData, 'type') as 'deposit' | 'withdraw' | 'buy' | 'sell' | 'dividend' | 'fee';
    const brokerAccountId = numberValue(formData, 'broker_account_id');
    const transactionDate = textValue(formData, 'transaction_date') || new Date().toISOString().slice(0, 10);
    const currency = textValue(formData, 'currency') || 'VND';
    const assetId = numberValue(formData, 'asset_id') || null;
    const quantity = numberValue(formData, 'quantity') || null;
    const price = numberValue(formData, 'price') || null;
    const amount = numberValue(formData, 'amount');
    const fees = numberValue(formData, 'fees');
    const tax = numberValue(formData, 'tax');
    if (!['deposit', 'withdraw', 'buy', 'sell', 'dividend', 'fee'].includes(type)) return { error: 'Unsupported stock transaction type.' };
    await recordStockTransaction({ type, brokerAccountId, date: transactionDate, currency, assetId, quantity, price, amount, fees, tax });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not record the transaction.' };
  }
  for (const route of ['/stocks', '/stocks/accounts', '/transactions', '/accounts', '/', '/performance']) revalidatePath(route);
  return { success: 'Transaction recorded and stock balances updated.' };
}

export async function updateStockMarketPrice(formData: FormData): Promise<StockActionState> {
  try {
    await setStockMarketPrice(numberValue(formData, 'asset_id'), numberValue(formData, 'price'));
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not update the manual market price.' };
  }
  for (const route of ['/stocks', '/holdings', '/', '/performance']) revalidatePath(route);
  return { success: 'Manual market price updated. No cash or realized income was recorded.' };
}

export async function createStockAsset(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const symbolRaw = ((formData.get('symbol') as string) || '').trim().toUpperCase();
  const symbol = symbolRaw || null;
  const quantityRaw = formData.get('quantity') as string;
  const avgCostRaw = formData.get('avg_cost') as string;
  const currentValueRaw = formData.get('current_value') as string;
  const purpose = ((formData.get('purpose') as string) || 'wealth_compounder') as AssetPurpose;
  const notesRaw = ((formData.get('notes') as string) || '').trim();

  const quantity = quantityRaw ? parseFloat(quantityRaw) : null;
  const avgCost = avgCostRaw ? parseFloat(avgCostRaw) : null;
  const currentValue = parseFloat(currentValueRaw) || 0;

  const costBasis =
    avgCost !== null && quantity !== null
      ? avgCost * quantity
      : avgCost !== null
        ? avgCost
        : null;

  const now = new Date().toISOString();

  await db.insert(assets).values({
    name,
    symbol,
    asset_class: 'stock',
    purpose,
    current_value: currentValue,
    currency: 'VND',
    quantity,
    cost_basis: costBasis,
    notes: notesRaw || null,
    include_in_investment_net_worth: true,
    include_in_total_net_worth: true,
    created_at: now,
    updated_at: now,
  });

  revalidatePath('/stocks');
  revalidatePath('/holdings');
  revalidatePath('/');
  redirect('/stocks');
}
