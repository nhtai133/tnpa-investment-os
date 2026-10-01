'use server';

import { upsertAppSetting } from '@/lib/settings';
import { revalidatePath } from 'next/cache';

type FormState = { error?: string; success?: boolean } | null;

export async function saveFxRate(prevState: FormState, formData: FormData): Promise<FormState> {
  const raw = formData.get('usd_vnd_rate');
  const rate = parseFloat(raw as string);

  if (!Number.isFinite(rate) || rate <= 0) {
    return { error: 'Rate must be a positive number.' };
  }
  if (rate < 1000 || rate > 1000000) {
    return { error: 'Rate must be between 1,000 and 1,000,000.' };
  }

  await upsertAppSetting('usd_vnd_rate', Math.round(rate).toString());
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function saveWealthTrackingStartDate(prevState: FormState, formData: FormData): Promise<FormState> {
  const raw = formData.get('wealth_tracking_start_date');
  const value = typeof raw === 'string' ? raw.trim() : '';
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    return { error: 'Enter a valid tracking start date.' };
  }
  await upsertAppSetting('wealth_tracking_start_date', value);
  revalidatePath('/', 'layout');
  revalidatePath('/settings');
  revalidatePath('/banking');
  return { success: true };
}
