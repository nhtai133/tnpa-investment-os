'use server';

import { upsertAppSetting } from '@/lib/settings';
import { revalidatePath } from 'next/cache';
import {
  REBALANCING_CLASSES,
  REBALANCING_SETTINGS_KEYS,
  PURPOSE_REBALANCING_PURPOSES,
  PURPOSE_REBALANCING_SETTINGS_KEYS,
  type RebalancingAssetClass,
  type RebalancingPurpose,
} from '@/lib/rebalancing';

type FormState = { error?: string; success?: boolean } | null;

export async function saveTargets(prevState: FormState, formData: FormData): Promise<FormState> {
  let total = 0;
  const parsed: Record<string, number> = {};

  for (const cls of REBALANCING_CLASSES) {
    const raw = formData.get(cls) as string;
    const val = parseFloat(raw);
    if (!Number.isFinite(val) || val < 0) {
      return { error: `Invalid value for ${cls}.` };
    }
    parsed[cls] = val;
    total += val;
  }

  if (Math.abs(total - 100) > 0.01) {
    return { error: `Allocations must sum to 100%. Current total: ${total.toFixed(1)}%` };
  }

  await Promise.all(
    REBALANCING_CLASSES.map((cls) =>
      upsertAppSetting(
        REBALANCING_SETTINGS_KEYS[cls as RebalancingAssetClass],
        parsed[cls].toString(),
      ),
    ),
  );

  revalidatePath('/rebalancing');
  return { success: true };
}

export async function savePurposeTargets(prevState: FormState, formData: FormData): Promise<FormState> {
  let total = 0;
  const parsed: Record<string, number> = {};

  for (const p of PURPOSE_REBALANCING_PURPOSES) {
    const raw = formData.get(p) as string;
    const val = parseFloat(raw);
    if (!Number.isFinite(val) || val < 0) {
      return { error: `Invalid value for ${p}.` };
    }
    parsed[p] = val;
    total += val;
  }

  if (Math.abs(total - 100) > 0.01) {
    return { error: `Allocations must sum to 100%. Current total: ${total.toFixed(1)}%` };
  }

  await Promise.all(
    PURPOSE_REBALANCING_PURPOSES.map((p) =>
      upsertAppSetting(
        PURPOSE_REBALANCING_SETTINGS_KEYS[p as RebalancingPurpose],
        parsed[p].toString(),
      ),
    ),
  );

  revalidatePath('/rebalancing');
  return { success: true };
}
