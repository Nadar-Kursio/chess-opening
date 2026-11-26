import RecallSession from '@/components/session/RecallSession';
import { dueCards, endOfDay, syncDeck } from '@/lib/cards';
import { getOpening, hasOpening } from '@/lib/content';
import { gameCards } from '@/lib/gameImport';
import { withGames } from '@/lib/gamePrep';
import { getProgress, getSettings, learnedIn, learnerTimezone } from '@/lib/progress';
import { buildRuns, byLearned } from '@/lib/recall';
import { withWrongMoves } from '@/lib/recallMoves';
import { requirePageUser } from '@/lib/session';
import ToRecall from './ToRecall';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recall' };

/** A round of Recall: everything due today, or one course's share of it. */
export default async function RecallSessionPage({ searchParams }: PageProps<'/recall/session'>) {
  const { course } = await searchParams;
  const courseId = typeof course === 'string' && hasOpening(course) ? course : undefined;
  const here = `/recall/session${courseId ? `?course=${courseId}` : ''}`;
  const user = await requirePageUser(here);
  const [tz, settings, progress, fromGames] = await Promise.all([learnerTimezone(), getSettings(user.id), getProgress(user.id), gameCards(user.id), syncDeck(user.id)]);
  const due = await dueCards(user.id, endOfDay(tz), courseId);
  const runs = withGames(withWrongMoves(byLearned(buildRuns(due, getOpening), getOpening, learnedIn(progress)), getOpening), fromGames);
  const asked = runs.reduce((n, run) => n + run.asks.length, 0);

  // Rendered even with nothing due: saving a round refreshes this page, and a round that just used
  // up the day's cards keeps its summary. Only a round that starts empty goes to the caught-up page.
  return (
    <RecallSession
      runs={runs}
      empty={<ToRecall />}
      remaining={Math.max(0, due.length - asked)}
      title={courseId ? `Recall · ${getOpening(courseId).name}` : 'Recall'}
      closeHref="/recall"
      againHref={here}
      sound={settings.sound}
      coordinates={settings.coordinates}
    />
  );
}
