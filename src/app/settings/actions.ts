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
