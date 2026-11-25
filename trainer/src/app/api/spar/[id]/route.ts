import { getClub, getOpening } from '@/lib/content';
import { sidesTaught } from '@/lib/course';
import { pack } from '@/lib/pack';
import { getSession } from '@/lib/session';
import { forBrowser, sparBook } from '@/lib/spar';
import type { Colour } from '@/lib/types';

/* The sparring book, fetched by the page after it loads rather than written into its HTML (see
   /api/repertoire/[id]): only what the game reads, packed, compressed on the way. */
export async function GET(request: Request, ctx: RouteContext<'/api/spar/[id]'>) {
  const { id } = await ctx.params;
  const club = getClub(id);
  if (!club) return new Response('Not found', { status: 404 });
  if (!(await getSession())) return new Response('Sign in', { status: 401 });
  const op = getOpening(id);
  const sides = sidesTaught(op);
  const asked = new URL(request.url).searchParams.get('side');
  const side: Colour = sides.includes(asked as Colour) ? (asked as Colour) : sides[0];
  return Response.json(pack(forBrowser(sparBook(op, side, club))), { headers: { 'cache-control': 'private, no-store' } });
}
