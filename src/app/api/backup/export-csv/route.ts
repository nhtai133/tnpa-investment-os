import { NextResponse } from 'next/server';
import { client } from '@/db';
import { snapshotBackup, savePrivateFile, csvCell } from '@/lib/backup';
import { assertLocalRequest, PRIVATE_HEADERS } from '@/lib/local-api';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET(request: Request) {
  try {
    assertLocalRequest(request);
    const backup = await snapshotBackup(client);
    const rows = backup.assets as Record<string, unknown>[];
    const headers = ['id','name','symbol','asset_class','currency','current_value','quantity','cost_basis','purpose','is_archived','notes','created_at','updated_at'];
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => csvCell(r[h])).join(','))].join('\n');
    const path = savePrivateFile('exports', 'holdings', csv, 'csv');
    return NextResponse.json({ success: true, path }, { headers: PRIVATE_HEADERS });
  } catch { return NextResponse.json({ error: 'Local CSV export failed.' }, { status: 400, headers: PRIVATE_HEADERS }); }
}
