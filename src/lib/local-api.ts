import { isLocalRequest } from './local-request';
export function assertLocalRequest(request: Request) {
  const environment = process.env.TNPA_ENV === 'development' ? 'development' : 'production';
  if (!isLocalRequest(request.headers, !['GET','HEAD'].includes(request.method), environment)) throw new Error('Local same-origin access only.');
}
export async function readLimitedJson(request: Request, maximum = 20 * 1024 * 1024) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('JSON content type required.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing request body.');
  let length = 0; const parts: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > maximum) { await reader.cancel(); throw new Error('Request too large.'); }
      parts.push(value);
    }
    return JSON.parse(Buffer.concat(parts).toString('utf8')) as unknown;
  } finally { reader.releaseLock(); }
}
export const PRIVATE_HEADERS = { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff' };
