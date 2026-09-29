import { NextRequest, NextResponse } from 'next/server';
import { isLocalRequest } from './lib/local-request';
export function middleware(request: NextRequest) {
  if (!isLocalRequest(request.headers, !['GET', 'HEAD', 'OPTIONS'].includes(request.method), process.env.TNPA_ENV === 'development' ? 'development' : 'production')) {
    return new NextResponse('Local same-origin access only.', { status: 403 });
  }
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, private');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Security-Policy', "default-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|fonts/|icons/).*)'] };
