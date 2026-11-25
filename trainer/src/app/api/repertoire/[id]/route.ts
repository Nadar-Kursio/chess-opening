import { getOpening, hasOpening } from '@/lib/content';
import { endOfDay, syncDeck } from '@/lib/cards';
import { sidesTaught } from '@/lib/course';
import { pack } from '@/lib/pack';
import { getProgress, learnerTimezone } from '@/lib/progress';
import { branchMap, clubShares, courseShape, subtreeTallies, walkSans } from '@/lib/repertoire';
import { clubOf, deckFacts, memoryByKey } from '@/lib/repertoireData';
import { getSession } from '@/lib/session';
import type { Colour } from '@/lib/types';
import type { ExplorerData } from '@/app/(app)/repertoire/[id]/Explorer';

/* The explorer's data, fetched by the page after it loads rather than written into its HTML: a
   course with hundreds of sidelines makes a tree of megabytes, and inline it would arrive twice
   (as HTML and as the props to hydrate). Packed (src/lib/pack.ts), and compressed on the way. */
export async function GET(request: Request, ctx: RouteContext<'/api/repertoire/[id]'>) {
  const { id } = await ctx.params;
  if (!hasOpening(id)) return new Response('Not found', { status: 404 });
  const user = (await getSession())?.user;
  if (!user) return new Response('Sign in', { status: 401 });
  const params = new URL(request.url).searchParams;
  const op = getOpening(id);
  const sides = sidesTaught(op);
  const asked = params.get('side');
  const side: Colour = sides.includes(asked as Colour) ? (asked as Colour) : sides.includes(op.orientation) ? op.orientation : sides[0];
  const at = params.get('at');

  const tz = await learnerTimezone();
  await syncDeck(user.id);
  const [facts, progress] = await Promise.all([deckFacts(user.id, endOfDay(tz), id), getProgress(user.id, id)]);

  const shape = courseShape(op, side);
  const memory = Object.fromEntries(Object.entries(memoryByKey(facts)).filter(([key]) => shape.nodes[key]?.ask));
  const club = clubOf(id);
  const shares = clubShares(shape, op, club?.index ?? null);
  const nodes: ExplorerData['nodes'] = Object.fromEntries(
    Object.entries(shape.nodes).map(([key, n]) => [
      key,
      {
        ...n,
        // The screen names one lesson per move and counts the rest.
        moves: n.moves.map(({ teach, ...m }) => ({ ...m, teach: teach.slice(0, 1), more: teach.length - 1, club: shares[`${key}>${m.next}`] })),
      },
    ]),
  );
  const lines = progress.get(id) ?? new Map();
  const sans = typeof at === 'string' && at ? at.split('.') : [];

  const data: ExplorerData = {
    id,
    name: op.name,
    side: shape.side,
    root: shape.root,
    nodes,
    memory,
    tallies: subtreeTallies(shape, memory),
    groups: branchMap(shape, op),
    initial: walkSans(shape, sans),
    club: club
      ? { source: club.source.source ?? 'club games', games: club.source.games ?? null, elo: club.source.elo ?? null }
      : op.sidelines
        ? { source: op.sidelines.source, games: op.sidelines.games, elo: op.sidelines.elo, partial: true }
        : null,
    learned: [...lines.values()].filter((l) => l.learned_at).map((l) => l.line_slug),
  };

  return Response.json(pack(data), { headers: { 'cache-control': 'private, no-store' } });
}
