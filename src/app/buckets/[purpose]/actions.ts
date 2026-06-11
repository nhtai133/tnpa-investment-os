'use server';

import { upsertAppSetting, getAppSetting } from '@/lib/settings';
import { computeNextReviewDate } from '@/lib/calendar';
import { revalidatePath } from 'next/cache';
import type { ReviewCadence } from '@/db/schema';

export async function setBucketReviewSchedule(purpose: string, formData: FormData) {
  const nextDate = formData.get('nextDate') as string | null;
  const cadence = formData.get('cadence') as string | null;
  if (nextDate) await upsertAppSetting(`bucket_next_review_${purpose}`, nextDate);
  if (cadence) await upsertAppSetting(`bucket_review_cadence_${purpose}`, cadence);
  revalidatePath(`/buckets/${purpose}`);
  revalidatePath('/calendar');
}

export async function markBucketReviewed(purpose: string) {
  const cadence = await getAppSetting(`bucket_review_cadence_${purpose}`);
  if (cadence) {
    const next = computeNextReviewDate(new Date(), cadence as ReviewCadence);
    await upsertAppSetting(`bucket_next_review_${purpose}`, next);
  } else {
    // No cadence set — clear the next review date so it falls off the calendar
    await upsertAppSetting(`bucket_next_review_${purpose}`, '');
  }
  revalidatePath(`/buckets/${purpose}`);
  revalidatePath('/calendar');
}
