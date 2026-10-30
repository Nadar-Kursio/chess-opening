import Link from 'next/link';
import RecallSession from '@/components/session/RecallSession';
import { dueCards, endOfDay, syncDeck } from '@/lib/cards';
import { getOpening, hasOpening } from '@/lib/content';
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
  const [tz, settings] = await Promise.all([learnerTimezone(), getSettings(user.id), syncDeck(user.id)]);
  const due = await dueCards(user.id, endOfDay(tz), courseId);
  const runs = buildRuns(due, getOpening);
  const asked = runs.reduce((n, run) => n + run.asks.length, 0);

  if (!runs.length) {
    return (
      <div className="empty-state">
        <h1>All caught up</h1>
        <p className="muted">Nothing is due{courseId ? ` in the ${getOpening(courseId).name}` : ''} today. Come back tomorrow, or learn a new chapter.</p>
        <Link className="btn btn--primary" href="/recall">
          Back to Recall
        </Link>
      </div>
    );
  }

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
