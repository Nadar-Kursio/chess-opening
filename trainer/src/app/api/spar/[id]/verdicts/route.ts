import { getVerdicts, hasOpening } from '@/lib/content';
import { getSession } from '@/lib/session';

/* One position's wrong-move verdicts for sparring, fetched as the learner reaches it (see forBrowser
   in src/lib/spar.ts). `null` where the course has none: the game then says "not the course's move". */
export async function GET(request: Request, ctx: RouteContext<'/api/spar/[id]/verdicts'>) {
  const { id } = await ctx.params;
  if (!hasOpening(id)) return new Response('Not found', { status: 404 });
  if (!(await getSession())) return new Response('Sign in', { status: 401 });
  const key = new URL(request.url).searchParams.get('key') ?? '';
  if (!/^[.pnbrqkPNBRQK]{64}[wb]$/.test(key)) return new Response('Not a position', { status: 400 });
  return Response.json(getVerdicts(id, key), { headers: { 'cache-control': 'private, max-age=3600' } });
}
