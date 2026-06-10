'use server';

import { db } from '@/db';
import { assets } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AssetPurpose } from '@/db/schema';

export async function createCryptoAsset(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const symbolRaw = ((formData.get('symbol') as string) || '').trim().toUpperCase();
  const symbol = symbolRaw || null;
  const quantityRaw = formData.get('quantity') as string;
  const avgCostPerCoinRaw = formData.get('avg_cost_per_coin') as string;
  const currentPricePerCoinRaw = formData.get('current_price_per_coin') as string;
  const purpose = ((formData.get('purpose') as string) || 'wealth_compounder') as AssetPurpose;
  const walletSource = ((formData.get('wallet_source') as string) || '').trim();
  const notesRaw = ((formData.get('notes') as string) || '').trim();

  const quantity = quantityRaw ? parseFloat(quantityRaw) : null;
  const avgCostPerCoin = avgCostPerCoinRaw ? parseFloat(avgCostPerCoinRaw) : null;
  const currentPricePerCoin = currentPricePerCoinRaw ? parseFloat(currentPricePerCoinRaw) : null;

  const costBasis =
    quantity !== null && avgCostPerCoin !== null ? quantity * avgCostPerCoin : null;

  const currentValue =
    quantity !== null && currentPricePerCoin !== null
      ? quantity * currentPricePerCoin
      : costBasis ?? 0;

  const notesParts: string[] = [];
  if (avgCostPerCoin !== null) notesParts.push(`Avg Cost/Coin: ${avgCostPerCoin}`);
  if (currentPricePerCoin !== null) notesParts.push(`Current Price/Coin: ${currentPricePerCoin}`);
  if (walletSource) notesParts.push(`Source: ${walletSource}`);
  if (notesRaw) notesParts.push(notesRaw);

  const now = new Date().toISOString();

  await db.insert(assets).values({
    name,
    symbol,
    asset_class: 'crypto',
    purpose,
    current_value: currentValue,
    currency: 'USD',
    quantity,
    cost_basis: costBasis,
    notes: notesParts.join('\n') || null,
    include_in_investment_net_worth: true,
    include_in_total_net_worth: true,
    created_at: now,
    updated_at: now,
  });

  revalidatePath('/crypto');
  revalidatePath('/holdings');
  revalidatePath('/');
  redirect('/crypto');
}
