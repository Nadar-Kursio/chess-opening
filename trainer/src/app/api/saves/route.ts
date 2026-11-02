import { revalidatePath } from 'next/cache';
import { gradeCards } from '@/lib/cards';
import { getOpening, hasOpening } from '@/lib/content';
import { lineBySlug } from '@/lib/course';
import { transaction } from '@/lib/db';
import { dayIn, learnerTimezone, recordSession } from '@/lib/progress';
import { Save } from '@/lib/saves';
import { getSession } from '@/lib/session';

const OLDEST_PLAY_MS = 30 * 24 * 60 * 60 * 1000;

/** A route, not a Server Action: the browser retries it in the background, so it needs real status
    codes and a promise that always settles, and its address doesn't change with the build.
    A 400 means the save can never succeed, so the outbox drops it; anything else it keeps. */
export async function POST(request: Request) {
  const user = (await getSession())?.user;
  if (!user) return new Response('Sign in', { status: 401 });
  const parsed = Save.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response('Not a save', { status: 400 });
  const save = parsed.data;

  const now = Date.now();
  const at = save.at > now || save.at < now - OLDEST_PLAY_MS ? now : save.at;
  const day = dayIn(await learnerTimezone(), new Date(at));

  if (save.kind === 'grade') {
    if (!hasOpening(save.grade.openingId)) return new Response('No such opening', { status: 400 });
    // A card only moves on its first grade of the day, so a repeat of this is already harmless.
    const [graded] = await transaction((client) =>
      gradeCards(client, user.id, save.grade.openingId, [save.grade], day),
    );
    return Response.json({ graded: graded ?? null });
  }

  const { session } = save;
  if (!hasOpening(session.openingId)) return new Response('No such opening', { status: 400 });
  if (session.lineSlug && !lineBySlug(getOpening(session.openingId), session.lineSlug)) {
    return new Response('No such chapter', { status: 400 });
  }
  const result = await recordSession(user.id, session, { clientId: save.id, day });
  revalidatePath('/', 'layout');
  return Response.json(result);
}
