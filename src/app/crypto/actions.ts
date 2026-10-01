'use server';

import { db } from '@/db';
import { accountRegistry, assets, assetCustodyPositions, type AssetPurpose } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { correctCryptoOpeningPosition as correctOpeningPosition, createCryptoInstrument, recordCryptoOpeningBalance, recordCryptoOpeningPosition, recordCryptoTransaction, setCryptoMarketPrice, supplyCryptoCostBasis as supplyBasis, type CryptoActivity } from '@/lib/crypto-workspace';

const str = (data: FormData, key: string) => String(data.get(key) ?? '').trim();
const num = (data: FormData, key: string) => {
  const raw = str(data, key);
  if (!raw) return 0;
  const result = Number(raw);
  return Number.isFinite(result) ? result : NaN;
};

export type CryptoActionState = { success?: string; error?: string } | null;

// Retained for the legacy /crypto/new route; normal additions use the workspace action below.
export async function createCryptoAsset(formData: FormData) {
  const name = str(formData, 'name');
  const symbol = str(formData, 'symbol').toUpperCase() || null;
  const quantity = Number(str(formData, 'quantity')) || null;
  const averageCost = Number(str(formData, 'avg_cost_per_coin')) || null;
  const price = Number(str(formData, 'current_price_per_coin')) || null;
  const accountId = Number(str(formData, 'custody_account_id')) || null;
  const currency = (str(formData, 'currency') || 'USDT').toUpperCase();
  const purpose = (str(formData, 'purpose') || 'wealth_compounder') as AssetPurpose;
  if (!name) throw new Error('Asset name is required.');
  if (!['USD','USDT','USDC'].includes(currency)) throw new Error('Use USD, USDT, or USDC as the reporting currency.');
  if (symbol && ['USDT','USDC'].includes(symbol)) throw new Error('Stablecoins are recorded as custody cash equivalents, not as a second token holding.');
  const costBasis = quantity && averageCost ? quantity * averageCost : 0;
  const now = new Date().toISOString();
  const [asset] = await db.insert(assets).values({ name, symbol, asset_class: 'crypto', purpose, current_value: quantity && price ? quantity * price : costBasis, currency, quantity: quantity ?? 0, cost_basis: costBasis, include_in_total_net_worth: true, include_in_investment_net_worth: true, is_archived: false, created_at: now, updated_at: now }).returning();
  if (accountId && quantity && quantity > 0) await db.insert(assetCustodyPositions).values({ asset_id: asset.id, custody_account_id: accountId, quantity, cost_basis: costBasis, updated_at: now });
  revalidatePath('/crypto');
  const { redirect } = await import('next/navigation');
  redirect('/crypto');
}

export async function createCryptoCustody(data: FormData): Promise<CryptoActionState> {
  try {
    const name = str(data, 'name');
    const custodyType = str(data, 'custody_type');
    const currency = str(data, 'currency').toUpperCase();
    if (!name) throw new Error('Enter a source name.');
    if (!['EXCHANGE','HOT_WALLET','COLD_WALLET'].includes(custodyType)) throw new Error('Choose an exchange, hot wallet, or cold wallet.');
    if (!['USDT','USDC','USD'].includes(currency)) throw new Error('Choose USD, USDT, or USDC as the reporting currency.');
    const now = new Date().toISOString();
    await db.insert(accountRegistry).values({
      name,
      type: custodyType === 'EXCHANGE' ? 'crypto_exchange' : 'crypto_wallet',
      custody_type: custodyType as 'EXCHANGE' | 'HOT_WALLET' | 'COLD_WALLET',
      institution: str(data, 'institution') || null,
      account_number_masked: null,
      currency,
      current_balance: 0,
      status: 'active',
      notes: null,
      created_at: now,
      updated_at: now,
    });
    revalidatePath('/crypto');
    return { success: 'Crypto custody source added.' };
  } catch (error) { return { error: error instanceof Error ? error.message : 'Could not add custody source.' }; }
}

export async function recordCryptoWorkspaceActivity(data: FormData): Promise<CryptoActionState> {
  try {
    const type = str(data, 'type') as CryptoActivity;
    const currency = str(data, 'currency').toUpperCase();
    await recordCryptoTransaction({
      type,
      custodyAccountId: Number(str(data, 'custody_account_id')) || undefined,
      fromCustodyAccountId: Number(str(data, 'from_custody_account_id')) || undefined,
      toCustodyAccountId: Number(str(data, 'to_custody_account_id')) || undefined,
      assetId: Number(str(data, 'asset_id')) || undefined,
      date: str(data, 'transaction_date'),
      quantity: num(data, 'quantity') || undefined,
      price: num(data, 'price') || undefined,
      fees: num(data, 'fees'),
      amount: num(data, 'amount'),
      transferFee: num(data, 'transfer_fee'),
      currency,
    });
    revalidatePath('/crypto');
    revalidatePath('/');
    return { success: 'Crypto transaction recorded.' };
  } catch (error) { return { error: error instanceof Error ? error.message : 'Could not record crypto activity.' }; }
}

export async function createCryptoWorkspaceAsset(data: FormData): Promise<CryptoActionState> {
  try {
    await createCryptoInstrument({ name: str(data, 'name'), symbol: str(data, 'symbol'), currency: str(data, 'currency') || 'USDT' });
    revalidatePath('/crypto');
    return { success: 'Crypto asset added.' };
  } catch (error) { return { error: error instanceof Error ? error.message : 'Could not add crypto asset.' }; }
}

export async function updateCryptoMarketPrice(data: FormData): Promise<CryptoActionState> {
  try {
    const assetId = Number(str(data, 'asset_id'));
    const price = num(data, 'price');
    await setCryptoMarketPrice(assetId, price);
    revalidatePath('/crypto');
    revalidatePath('/');
    return { success: 'Manual crypto price updated.' };
  } catch (error) { return { error: error instanceof Error ? error.message : 'Could not update crypto price.' }; }
}

export async function createCryptoOpeningPosition(data: FormData): Promise<CryptoActionState> {
  try {
    await recordCryptoOpeningPosition({ custodyAccountId: Number(str(data, 'custody_account_id')), assetId: Number(str(data, 'asset_id')), quantity: num(data, 'quantity'), costBasisMode: str(data, 'cost_basis_mode') as 'average' | 'total' | 'unknown', costBasisValue: num(data, 'cost_basis_value'), date: str(data, 'transaction_date'), marketPrice: str(data, 'market_price') ? num(data, 'market_price') : undefined, notes: str(data, 'notes') });
    revalidatePath('/crypto'); revalidatePath('/');
    return { success: 'Existing crypto position added.' };
  } catch (error) { return { error: error instanceof Error ? error.message : 'Could not add existing crypto position.' }; }
}

export async function correctCryptoOpeningPosition(data: FormData): Promise<CryptoActionState> {
  try {
    await correctOpeningPosition({ transactionId: Number(str(data, 'transaction_id')), custodyAccountId: Number(str(data, 'custody_account_id')), assetId: Number(str(data, 'asset_id')), quantity: num(data, 'quantity'), costBasisMode: str(data, 'cost_basis_mode') as 'average' | 'total' | 'unknown', costBasisValue: num(data, 'cost_basis_value'), date: str(data, 'transaction_date'), marketPrice: str(data, 'market_price') ? num(data, 'market_price') : undefined, notes: str(data, 'notes') });
    revalidatePath('/crypto'); revalidatePath('/');
    return { success: 'Opening position corrected safely.' };
  } catch (error) { return { error: error instanceof Error ? error.message : 'Could not correct opening position.' }; }
}

export async function supplyCryptoPositionCostBasis(data: FormData): Promise<CryptoActionState> {
  try {
    await supplyBasis({ custodyAccountId: Number(str(data, 'custody_account_id')), assetId: Number(str(data, 'asset_id')), totalCostBasis: num(data, 'total_cost_basis'), date: str(data, 'transaction_date'), notes: str(data, 'notes') });
    revalidatePath('/crypto'); revalidatePath('/');
    return { success: 'Cost basis recorded.' };
  } catch (error) { return { error: error instanceof Error ? error.message : 'Could not record cost basis.' }; }
}

export async function createCryptoOpeningBalance(data: FormData): Promise<CryptoActionState> {
  try {
    await recordCryptoOpeningBalance({ custodyAccountId: Number(str(data, 'custody_account_id')), amount: num(data, 'amount'), date: str(data, 'transaction_date'), notes: str(data, 'notes') });
    revalidatePath('/crypto'); revalidatePath('/');
    return { success: 'Opening stablecoin balance added.' };
  } catch (error) { return { error: error instanceof Error ? error.message : 'Could not add opening balance.' }; }
}
