import { NextResponse } from 'next/server';
import { client } from '@/db';
import { restoreBackup } from '@/lib/backup';
import { assertLocalRequest, readLimitedJson, PRIVATE_HEADERS } from '@/lib/local-api';
import { revalidatePath } from 'next/cache';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    assertLocalRequest(request);
    const body = await readLimitedJson(request) as { backup?: unknown; confirmation?: unknown };
    const path = await restoreBackup(client, body.backup, body.confirmation);
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, backup_path: path }, { headers: PRIVATE_HEADERS });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Import failed. Existing data retained.' }, { status: 400, headers: PRIVATE_HEADERS });
  }
}
