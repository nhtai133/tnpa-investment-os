'use server';

import { db } from '@/db';
import { assets } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { getAppSetting } from '@/lib/settings';

export type PhysicalAssetActionState = { error?: string; success?: string };

function text(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalNumber(form: FormData, key: string) {
  const value = text(form, key);
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${key} must be a finite number.`);
  return parsed;
}

function dateOrNull(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Enter a valid date.');
  return value;
}

export async function createGoldAsset(formData: FormData): Promise<PhysicalAssetActionState> {
  try {
    const name = text(formData, 'name');
    const weight = optionalNumber(formData, 'gold_weight');
    const itemCount = optionalNumber(formData, 'gold_item_count');
    const mode = text(formData, 'valuation_mode');
    const totalValue = optionalNumber(formData, 'current_value');
    const pricePerUnit = optionalNumber(formData, 'price_per_weight_unit');
    const costMode = text(formData, 'cost_basis_mode');
    const basisValue = optionalNumber(formData, 'cost_basis_value');
    const unit = text(formData, 'gold_weight_unit');
    if (!name) throw new Error('Enter a gold asset name.');
    if (weight == null || weight <= 0) throw new Error('Enter a positive gold weight.');
    if (itemCount != null && itemCount <= 0) throw new Error('Item count must be positive.');
    if (!['lượng', 'chỉ', 'gram'].includes(unit)) throw new Error('Choose a supported gold weight unit.');
    const currentValue = mode === 'total' ? totalValue : mode === 'unit' ? (pricePerUnit == null ? null : pricePerUnit * weight) : null;
    if (currentValue == null || currentValue <= 0) throw new Error('Enter a positive current value using the selected valuation method.');
    if (mode === 'total' && pricePerUnit != null || mode === 'unit' && totalValue != null) throw new Error('Enter only one current valuation method.');
    if (mode === 'unit' && (pricePerUnit == null || pricePerUnit <= 0)) throw new Error('Enter a positive estimated price per weight unit.');
    const known = costMode !== 'unknown';
    if (!['total', 'average', 'unknown'].includes(costMode)) throw new Error('Choose a cost basis method.');
    if (known && (basisValue == null || basisValue < 0)) throw new Error('Enter a nonnegative gold cost basis.');
    const basis = !known ? 0 : costMode === 'average' ? basisValue! * weight : basisValue!;
    const openingDate = dateOrNull(text(formData, 'opening_date')) ?? await getAppSetting('wealth_tracking_start_date') ?? new Date().toISOString().slice(0, 10);
    const acquisitionDate = dateOrNull(text(formData, 'acquisition_date'));
    const purity = text(formData, 'gold_purity') === 'other' ? text(formData, 'gold_purity_custom') : text(formData, 'gold_purity');
    const form = text(formData, 'gold_form') === 'other' ? text(formData, 'gold_form_custom') : text(formData, 'gold_form');
    const storage = text(formData, 'storage_location') === 'other' ? text(formData, 'storage_location_custom') : text(formData, 'storage_location');
    const ownership = text(formData, 'ownership_label') === 'other' ? text(formData, 'ownership_custom') : text(formData, 'ownership_label');
    if (text(formData, 'gold_purity') === 'other' && !purity || text(formData, 'gold_form') === 'other' && !form || text(formData, 'ownership_label') === 'other' && !ownership) throw new Error('Complete the custom gold detail.');
    const now = new Date().toISOString();
    await db.insert(assets).values({
      name, symbol: null, asset_class: 'gold', purpose: 'store_of_value', currency: 'VND', current_value: currentValue,
      quantity: itemCount ?? weight, cost_basis: basis, cost_basis_known: known, opening_date: openingDate,
      acquisition_date: acquisitionDate, gold_purity: purity || null, gold_form: form || null,
      gold_item_count: itemCount, gold_weight: weight, gold_weight_unit: unit,
      storage_location: storage || null, ownership_label: ownership || null,
      include_in_total_net_worth: true, include_in_investment_net_worth: true,
      notes: text(formData, 'notes') || null, is_archived: false, created_at: now, updated_at: now,
    });
    revalidatePath('/gold'); revalidatePath('/holdings'); revalidatePath('/');
    return { success: 'Existing gold added to household wealth.' };
  } catch (error) { return { error: error instanceof Error ? error.message : 'Could not add the existing gold.' }; }
}
