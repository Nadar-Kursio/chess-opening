import Link from 'next/link';
import RecallSession from '@/components/session/RecallSession';
import { dueCards, endOfDay, syncDeck } from '@/lib/cards';
import { getOpening, hasOpening } from '@/lib/content';
import { getSettings, learnerTimezone } from '@/lib/progress';
import { buildRuns, lineCards } from '@/lib/recall';
import { requirePageUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recall' };

/** A round of Recall: everything due today, one course's share of it, or one chapter's. */
export default async function RecallSessionPage({ searchParams }: PageProps<'/recall/session'>) {
  const { course, chapter } = await searchParams;
  const courseId = typeof course === 'string' && hasOpening(course) ? course : undefined;
  const line = courseId && typeof chapter === 'string' ? getOpening(courseId).lines.find((l) => l.slug === chapter) : undefined;
  const here = `/recall/session${courseId ? `?course=${courseId}${line ? `&chapter=${line.slug}` : ''}` : ''}`;
  const user = await requirePageUser(here);
  const [tz, settings] = await Promise.all([learnerTimezone(), getSettings(user.id), syncDeck(user.id)]);
  const keys = courseId && line ? new Set(lineCards(getOpening(courseId), line.slug)) : null;
  const due = (await dueCards(user.id, endOfDay(tz), courseId)).filter((d) => !keys || keys.has(d.key));
  const runs = buildRuns(due, getOpening);
  const asked = runs.reduce((n, run) => n + run.asks.length, 0);
  const closeHref = courseId && line ? `/openings/${courseId}#chapter-${line.slug}` : '/recall';

  return (
    <RecallSession
      runs={runs}
      remaining={Math.max(0, due.length - asked)}
      title={courseId ? `Recall · ${line ? line.name : getOpening(courseId).name}` : 'Recall'}
      closeHref={closeHref}
      againHref={here}
      sound={settings.sound}
      coordinates={settings.coordinates}
      empty={
        <div className="empty-state">
          <h1>All caught up</h1>
          <p className="muted">
            Nothing is due{line ? ' in this chapter' : courseId ? ` in the ${getOpening(courseId).name}` : ''} today. Come back tomorrow, or
            learn a new chapter.
          </p>
          <Link className="btn btn--primary" href={closeHref}>
            {line ? 'Back to the course' : 'Back to Recall'}
          </Link>
        </div>
      }
    />
  );
}
