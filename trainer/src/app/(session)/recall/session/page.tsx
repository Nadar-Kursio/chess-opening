import Link from 'next/link';
import RecallSession from '@/components/session/RecallSession';
import { dueCards, endOfDay, syncDeck } from '@/lib/cards';
import { getOpening, hasOpening } from '@/lib/content';
import { getProgress, getSettings, learnedIn, learnerTimezone } from '@/lib/progress';
import { buildRuns, byLearned } from '@/lib/recall';
import { withWrongMoves } from '@/lib/recallMoves';
import { requirePageUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recall' };

/** A round of Recall: everything due today, or one course's share of it. */
export default async function RecallSessionPage({ searchParams }: PageProps<'/recall/session'>) {
  const { course } = await searchParams;
  const courseId = typeof course === 'string' && hasOpening(course) ? course : undefined;
  const here = `/recall/session${courseId ? `?course=${courseId}` : ''}`;
  const user = await requirePageUser(here);
  const [tz, settings, progress] = await Promise.all([learnerTimezone(), getSettings(user.id), getProgress(user.id), syncDeck(user.id)]);
  const due = await dueCards(user.id, endOfDay(tz), courseId);
  const runs = withWrongMoves(byLearned(buildRuns(due, getOpening), getOpening, learnedIn(progress)), getOpening);
  const asked = runs.reduce((n, run) => n + run.asks.length, 0);

  const caughtUp = (
    <div className="empty-state">
      <h1>All caught up</h1>
      <p className="muted">Nothing is due{courseId ? ` in the ${getOpening(courseId).name}` : ''} today. Come back tomorrow, or learn a new chapter.</p>
      <Link className="btn btn--primary" href="/recall">
        Back to Recall
      </Link>
    </div>
  );

  // The session is rendered even with nothing due: saving a round refreshes this page, and a round
  // that just used up the day's cards keeps its summary instead of turning into this message.
  return (
    <RecallSession
      runs={runs}
      empty={caughtUp}
      remaining={Math.max(0, due.length - asked)}
      title={courseId ? `Recall · ${getOpening(courseId).name}` : 'Recall'}
      closeHref="/recall"
      againHref={here}
      sound={settings.sound}
      coordinates={settings.coordinates}
    />
  );
}
