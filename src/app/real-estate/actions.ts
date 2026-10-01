'use server';

import { db } from '@/db';
import { assets } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { getAppSetting } from '@/lib/settings';
import type { PhysicalAssetActionState } from '@/app/gold/actions';

function text(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function number(form: FormData, key: string) {
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

export async function createRealEstateAsset(formData: FormData): Promise<PhysicalAssetActionState> {
  try {
    const name = text(formData, 'name');
    const area = number(formData, 'property_area_sqm');
    const width = number(formData, 'property_width_m');
    const length = number(formData, 'property_length_m');
    const ownership = number(formData, 'ownership_percentage');
    const mode = text(formData, 'valuation_mode');
    const wholeValue = number(formData, 'current_value');
    const pricePerSqm = number(formData, 'property_value_per_sqm');
    const basisMode = text(formData, 'cost_basis_mode');
    if (!['known', 'unknown'].includes(basisMode)) throw new Error('Choose whether the cost basis is known.');
    const known = basisMode === 'known';
    const purchasePrice = number(formData, 'purchase_price');
    const acquisitionCosts = number(formData, 'acquisition_costs') ?? 0;
    if (!name) throw new Error('Enter a property name.');
    if (text(formData, 'property_type') !== 'land') throw new Error('Choose land as the property type.');
    if (area == null || area <= 0 || width == null || width <= 0 || length == null || length <= 0) throw new Error('Enter positive area, width, and length.');
    if (ownership == null || ownership < 0 || ownership > 100) throw new Error('Ownership percentage must be between 0 and 100.');
    const currentValue = mode === 'total' ? wholeValue : mode === 'sqm' && pricePerSqm != null ? area * pricePerSqm : null;
    if (currentValue == null || currentValue <= 0) throw new Error('Enter a positive current valuation using the selected method.');
    if (mode === 'total' && pricePerSqm != null || mode === 'sqm' && wholeValue != null) throw new Error('Enter only one current valuation method.');
    if (mode === 'sqm' && (pricePerSqm == null || pricePerSqm <= 0)) throw new Error('Enter a positive estimated price per square meter.');
    if (acquisitionCosts < 0) throw new Error('Acquisition costs cannot be negative.');
    if (known && (purchasePrice == null || purchasePrice < 0)) throw new Error('Enter the whole-property purchase price.');
    const costBasis = known ? purchasePrice! + acquisitionCosts : 0;
    const openingDate = dateOrNull(text(formData, 'opening_date')) ?? await getAppSetting('wealth_tracking_start_date') ?? new Date().toISOString().slice(0, 10);
    const acquisitionDate = dateOrNull(text(formData, 'acquisition_date'));
    const now = new Date().toISOString();
    await db.insert(assets).values({
      name, symbol: null, asset_class: 'real_estate', property_type: 'land', purpose: 'store_of_value', currency: 'VND',
      current_value: currentValue, cost_basis: costBasis, cost_basis_known: known, opening_date: openingDate,
      acquisition_date: acquisitionDate, property_location: text(formData, 'property_location') || null,
      property_area_sqm: area, property_width_m: width, property_length_m: length,
      property_legal_status: text(formData, 'property_legal_status') || null, ownership_percentage: ownership,
      purchase_price: purchasePrice, acquisition_costs: acquisitionCosts, property_value_per_sqm: currentValue / area,
      quantity: area, include_in_total_net_worth: true, include_in_investment_net_worth: true,
      notes: text(formData, 'notes') || null, is_archived: false, created_at: now, updated_at: now,
    });
    revalidatePath('/real-estate'); revalidatePath('/holdings'); revalidatePath('/');
    return { success: 'Existing land asset added to household wealth.' };
  } catch (error) { return { error: error instanceof Error ? error.message : 'Could not add the existing land asset.' }; }
}
