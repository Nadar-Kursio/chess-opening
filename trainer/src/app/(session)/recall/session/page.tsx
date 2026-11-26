import { redirect } from 'next/navigation';
import RecallSession from '@/components/session/RecallSession';
import { dueCards, endOfDay, syncDeck } from '@/lib/cards';
import { getOpening, hasOpening } from '@/lib/content';
import { gameCards } from '@/lib/gameImport';
import { withGames } from '@/lib/gamePrep';
import { getSettings, learnerTimezone } from '@/lib/progress';
import { buildRuns } from '@/lib/recall';
import { requirePageUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recall' };

/** A round of Recall: everything due today, or one course's share of it. */
export default async function RecallSessionPage({ searchParams }: PageProps<'/recall/session'>) {
  const { course } = await searchParams;
  const courseId = typeof course === 'string' && hasOpening(course) ? course : undefined;
  const here = `/recall/session${courseId ? `?course=${courseId}` : ''}`;
  const user = await requirePageUser(here);
  const [tz, settings, fromGames] = await Promise.all([learnerTimezone(), getSettings(user.id), gameCards(user.id), syncDeck(user.id)]);
  const due = await dueCards(user.id, endOfDay(tz), courseId);
  const runs = withGames(buildRuns(due, getOpening), fromGames);
  const asked = runs.reduce((n, run) => n + run.asks.length, 0);

  // Also reached when saving the round that cleared the day refreshes this page: the Recall page is the caught-up screen.
  if (!runs.length) redirect('/recall');

  return (
    <RecallSession
      runs={runs}
      remaining={Math.max(0, due.length - asked)}
      title={courseId ? `Recall · ${getOpening(courseId).name}` : 'Recall'}
      closeHref="/recall"
      againHref={here}
      sound={settings.sound}
      coordinates={settings.coordinates}
    />
  );
}
