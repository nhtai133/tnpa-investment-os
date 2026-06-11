'use server';

import { db } from '@/db';
import { decisionLogs, decisionReviews, assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { DecisionType, DecisionOutcome, ReviewCadence } from '@/db/schema';
import { computeNextReviewDate } from '@/lib/calendar';

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return v && typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

export async function createDecision(formData: FormData) {
  const title = str(formData, 'title') ?? '';
  const assetIdRaw = str(formData, 'asset_id');
  const assetId = assetIdRaw ? Number(assetIdRaw) : null;
  const redirectTo = str(formData, 'redirect_to') ?? '/decisions';

  let assetName = title;
  let assetClass = null;

  if (assetId) {
    const asset = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1).then((r) => r[0]);
    if (asset) {
      assetName = asset.name;
      assetClass = asset.asset_class;
    }
  }

  const amountRaw = str(formData, 'amount');
  const amount = amountRaw ? parseFloat(amountRaw) : null;
  const confidenceRaw = str(formData, 'confidence');
  const confidence = confidenceRaw ? parseInt(confidenceRaw, 10) : null;
  const reviewCadence = str(formData, 'review_cadence');
  const nextReviewDate = str(formData, 'next_review_date');

  await db.insert(decisionLogs).values({
    title: title || null,
    asset_id: assetId ?? undefined,
    asset_name: assetName,
    asset_class: assetClass ?? undefined,
    decision_type: (str(formData, 'decision_type') ?? 'review') as DecisionType,
    rationale: str(formData, 'rationale') ?? '',
    amount: amount != null && !isNaN(amount) ? amount : null,
    decision_date: str(formData, 'decision_date') ?? today(),
    purpose: str(formData, 'purpose'),
    expected_return: str(formData, 'expected_return'),
    time_horizon: str(formData, 'time_horizon'),
    risks: str(formData, 'risks'),
    invalidation_conditions: str(formData, 'invalidation_conditions'),
    confidence: confidence != null && !isNaN(confidence) ? confidence : null,
    extended_notes: str(formData, 'extended_notes'),
    review_cadence: reviewCadence,
    next_review_date: nextReviewDate,
    is_reviewed: false,
    created_at: now(),
  });

  revalidatePath('/decisions');
  revalidatePath('/calendar');
  revalidatePath('/');
  if (assetId) revalidatePath(`/holdings/${assetId}`);
  redirect(redirectTo);
}

export async function updateDecision(id: number, formData: FormData) {
  const title = str(formData, 'title') ?? '';
  const assetIdRaw = str(formData, 'asset_id');
  const assetId = assetIdRaw ? Number(assetIdRaw) : null;

  let assetName = title;
  let assetClass = null;

  if (assetId) {
    const asset = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1).then((r) => r[0]);
    if (asset) {
      assetName = asset.name;
      assetClass = asset.asset_class;
    }
  }

  const amountRaw = str(formData, 'amount');
  const amount = amountRaw ? parseFloat(amountRaw) : null;
  const confidenceRaw = str(formData, 'confidence');
  const confidence = confidenceRaw ? parseInt(confidenceRaw, 10) : null;
  const reviewCadence = str(formData, 'review_cadence');
  const nextReviewDate = str(formData, 'next_review_date');

  await db.update(decisionLogs).set({
    title: title || null,
    asset_id: assetId ?? undefined,
    asset_name: assetName,
    asset_class: assetClass ?? undefined,
    decision_type: (str(formData, 'decision_type') ?? 'review') as DecisionType,
    rationale: str(formData, 'rationale') ?? '',
    amount: amount != null && !isNaN(amount) ? amount : null,
    decision_date: str(formData, 'decision_date') ?? today(),
    purpose: str(formData, 'purpose'),
    expected_return: str(formData, 'expected_return'),
    time_horizon: str(formData, 'time_horizon'),
    risks: str(formData, 'risks'),
    invalidation_conditions: str(formData, 'invalidation_conditions'),
    confidence: confidence != null && !isNaN(confidence) ? confidence : null,
    extended_notes: str(formData, 'extended_notes'),
    review_cadence: reviewCadence,
    next_review_date: nextReviewDate,
  }).where(eq(decisionLogs.id, id));

  revalidatePath('/decisions');
  revalidatePath(`/decisions/${id}`);
  revalidatePath('/calendar');
  redirect(`/decisions/${id}`);
}

export async function createDecisionReview(decisionId: number, formData: FormData) {
  const ts = now();

  await db.insert(decisionReviews).values({
    decision_id: decisionId,
    review_date: str(formData, 'review_date') ?? today(),
    outcome: (str(formData, 'outcome') ?? 'neutral') as DecisionOutcome,
    current_result: str(formData, 'current_result'),
    thesis_still_valid: formData.get('thesis_still_valid') === 'true' ? true : formData.get('thesis_still_valid') === 'false' ? false : null,
    lessons_learned: str(formData, 'lessons_learned'),
    next_action: str(formData, 'next_action'),
    created_at: ts,
    updated_at: ts,
  });

  // Fetch the decision's cadence to determine next review date
  const decision = await db
    .select({ review_cadence: decisionLogs.review_cadence })
    .from(decisionLogs)
    .where(eq(decisionLogs.id, decisionId))
    .limit(1)
    .then((r) => r[0]);

  if (decision?.review_cadence) {
    // Has a cadence → advance next_review_date and reset is_reviewed so it reappears
    const nextDate = computeNextReviewDate(new Date(), decision.review_cadence as ReviewCadence);
    await db.update(decisionLogs).set({
      is_reviewed: false,
      next_review_date: nextDate,
    }).where(eq(decisionLogs.id, decisionId));
  } else {
    // One-time review → mark as done
    await db.update(decisionLogs).set({ is_reviewed: true }).where(eq(decisionLogs.id, decisionId));
  }

  revalidatePath('/decisions');
  revalidatePath(`/decisions/${decisionId}`);
  revalidatePath('/calendar');
  revalidatePath('/');
  redirect(`/decisions/${decisionId}`);
}
