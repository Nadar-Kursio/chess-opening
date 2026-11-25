import { getOpening, hasOpening } from '@/lib/content';
import { sidesTaught } from '@/lib/course';
import { getSession } from '@/lib/session';
import { servedBook } from '@/lib/sparCache';
import type { Colour } from '@/lib/types';

/* The sparring book, fetched by the page after it loads rather than written into its HTML (see
   /api/repertoire/[id]): only what the game reads, packed, compressed on the way. */
export async function GET(request: Request, ctx: RouteContext<'/api/spar/[id]'>) {
  const { id } = await ctx.params;
  if (!hasOpening(id)) return new Response('Not found', { status: 404 });
  if (!(await getSession())) return new Response('Sign in', { status: 401 });
  const sides = sidesTaught(getOpening(id));
  const asked = new URL(request.url).searchParams.get('side');
  const served = servedBook(id, sides.includes(asked as Colour) ? (asked as Colour) : sides[0]);
  if (!served) return new Response('Not found', { status: 404 });
  return new Response(served.json, { headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' } });
}
