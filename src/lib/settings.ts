import { db } from '@/db';
import { appSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_USD_VND_RATE } from '@/lib/fx';

export async function getAppSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

export async function upsertAppSetting(key: string, value: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .insert(appSettings)
    .values({ key, value, updated_at: now })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updated_at: now },
    });
}

export async function getUsdVndRate(): Promise<number> {
  const val = await getAppSetting('usd_vnd_rate');
  if (!val) return DEFAULT_USD_VND_RATE;
  const parsed = parseFloat(val);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_USD_VND_RATE;
}
