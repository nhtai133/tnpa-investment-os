import { NextResponse } from 'next/server';
import { client } from '@/db';
import { snapshotBackup, savePrivateFile } from '@/lib/backup';
import { assertLocalRequest, PRIVATE_HEADERS } from '@/lib/local-api';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET(request: Request) {
  try {
    assertLocalRequest(request);
    const backup = await snapshotBackup(client);
    const path = savePrivateFile('exports', 'wealth-backup', JSON.stringify(backup, null, 2));
    return NextResponse.json({ success: true, path }, { headers: PRIVATE_HEADERS });
  } catch { return NextResponse.json({ error: 'Local export failed. Check local access and private directory permissions.' }, { status: 400, headers: PRIVATE_HEADERS }); }
}
