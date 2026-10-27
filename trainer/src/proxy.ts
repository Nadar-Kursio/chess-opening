import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC = ['/sign-in', '/sign-up', '/api/auth'];
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Two gates. In production the public site is the edge Worker on new.chesslab.dev, which adds
 * EDGE_SECRET; anything reaching the tunnel origin without it is turned away (the machine itself
 * is exempt, for health checks). Then every page needs an account: no session cookie goes
 * straight to sign-in. That second check is only the fast path — each page still verifies the
 * session itself (requirePageUser).
 */
export function proxy(request: NextRequest) {
  const edge = process.env.EDGE_SECRET;
  const host = request.headers.get('host')?.replace(/:\d+$/, '') ?? '';
  if (edge && !LOCAL_HOSTS.has(host) && request.headers.get('x-chesslab-edge') !== edge) {
    return new NextResponse('Not found', { status: 404 });
  }

  const { pathname, search } = request.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  if (getSessionCookie(request)) return NextResponse.next();
  // Behind the Worker, request.url names the origin host; send the learner to the public one.
  const base = LOCAL_HOSTS.has(host) ? request.url : (process.env.BETTER_AUTH_URL ?? request.url);
  const url = new URL('/sign-in', base);
  if (pathname !== '/') url.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: '/((?!_next/static|_next/image|pieces/|favicon|icon).*)',
};
