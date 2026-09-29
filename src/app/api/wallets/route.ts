import { NextResponse } from 'next/server';
import { getAppSetting, upsertAppSetting } from '@/lib/settings';
import { validateWallets } from '@/lib/backup';
import { assertLocalRequest, readLimitedJson, PRIVATE_HEADERS } from '@/lib/local-api';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    assertLocalRequest(request);
    return NextResponse.json(JSON.parse(await getAppSetting('crypto_wallets') ?? '[]'), { headers: PRIVATE_HEADERS });
  } catch { return NextResponse.json({ error: 'Could not load local wallets.' }, { status: 400 }); }
}
export async function POST(request: Request) {
  try {
    assertLocalRequest(request);
    const wallets = await readLimitedJson(request, 1024 * 1024);
    validateWallets(wallets);
    await upsertAppSetting('crypto_wallets', JSON.stringify(wallets));
    return NextResponse.json({ success: true }, { headers: PRIVATE_HEADERS });
  } catch { return NextResponse.json({ error: 'Could not save local wallets.' }, { status: 400 }); }
}
