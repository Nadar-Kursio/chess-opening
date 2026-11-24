import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ImportError, importGames, type ImportProblem } from '@/lib/gameImport';
import { usernameFrom } from '@/lib/gameSources';
import { getSession } from '@/lib/session';

const Body = z.object({ site: z.enum(['lichess', 'chesscom']), username: z.string().max(200) });

const STATUS: Record<ImportProblem, number> = {
  unknown: 404,
  closed: 403,
  empty: 404,
  busy: 429,
  wait: 429,
  unreachable: 502,
};

/** Links a username and imports its recent rated games; a second import adds only new ones. */
export async function POST(request: Request) {
  const user = (await getSession())?.user;
  if (!user) return Response.json({ error: 'Sign in to import games.' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Choose a site and enter a username.' }, { status: 400 });
  const username = usernameFrom(parsed.data.username);
  if (!username) return Response.json({ error: 'That doesn’t look like a username. Letters, numbers, - and _ only.' }, { status: 400 });

  try {
    const result = await importGames(user.id, parsed.data.site, username);
    revalidatePath('/', 'layout');
    return Response.json(result);
  } catch (err) {
    if (err instanceof ImportError) return Response.json({ error: err.message, problem: err.problem }, { status: STATUS[err.problem] });
    console.error('[games] import failed', err);
    return Response.json({ error: 'Something went wrong on our side. Try again in a minute.' }, { status: 500 });
  }
}
