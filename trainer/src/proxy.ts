import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC = ['/sign-in', '/sign-up', '/api/auth'];

/**
 * Every page needs an account. This is the fast path — no cookie, straight to sign-in — and only
 * checks the cookie exists; each page still verifies the session itself (requirePageUser).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  if (getSessionCookie(request)) return NextResponse.next();
  const url = new URL('/sign-in', request.url);
  if (pathname !== '/') url.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: '/((?!_next/static|_next/image|pieces/|favicon|icon).*)',
};
