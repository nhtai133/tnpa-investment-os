// Shared by Edge middleware and Node handlers; no filesystem or secret in client code.
export function isLocalRequest(headers: Headers, mutation = false, environment: 'development' | 'production' = 'production'): boolean {
  const host = headers.get('host');
  const port = environment === 'development' ? 3002 : 3001;
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return false;
  if (headers.has('forwarded') || (headers.get('x-forwarded-host') && headers.get('x-forwarded-host') !== host)) return false;
  const site = headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return false;
  const origin = headers.get('origin');
  if (origin && origin !== `http://${host}`) return false;
  if (mutation && !origin) return false;
  return true;
}
