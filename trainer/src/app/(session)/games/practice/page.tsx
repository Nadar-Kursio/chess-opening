import Link from 'next/link';
import RecallSession from '@/components/session/RecallSession';
import { getOpening, hasOpening } from '@/lib/content';
import { loadReport } from '@/lib/gameImport';
import { practiceKeys } from '@/lib/games';
import { getSettings } from '@/lib/progress';
import { buildRuns, isCard, type Due } from '@/lib/recall';
import { withWrongMoves } from '@/lib/recallMoves';
import { requirePageUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Practise your games' };

/**
 * The positions where the learner's own games left the course, asked the way Recall asks them:
 * the line replays and stops on the move. Each answer is graded into the deck like any Recall
 * answer, so a position found here is scheduled forward again.
 */
export default async function GamesPracticePage({ searchParams }: PageProps<'/games/practice'>) {
  const { course, key } = await searchParams;
  const courseId = typeof course === 'string' && hasOpening(course) ? course : undefined;
  const query = new URLSearchParams();
  if (courseId) query.set('course', courseId);
  if (courseId && typeof key === 'string') query.set('key', key);
  const here = `/games/practice${query.size ? `?${query}` : ''}`;
  const user = await requirePageUser(here);
  const [{ report }, settings] = await Promise.all([loadReport(user.id), getSettings(user.id)]);

  const due: Due[] =
    courseId && typeof key === 'string'
      ? isCard(getOpening(courseId), key)
        ? [{ openingId: courseId, key }]
        : []
      : practiceKeys(report, courseId).map(({ openingId, key }) => ({ openingId, key }));
  const runs = withWrongMoves(buildRuns(due, getOpening), getOpening);

  if (!runs.length) {
    return (
      <div className="empty-state">
        <h1>Nothing to practise</h1>
        <p className="muted">
          When your games leave a course you’ve learned, the positions show up here. Import your latest games to check.
        </p>
        <Link className="btn btn--primary" href="/games">
          Back to your games
        </Link>
      </div>
    );
  }

  return (
    <RecallSession
      runs={runs}
      remaining={0}
      title={courseId ? `Your games · ${getOpening(courseId).name}` : 'Your games'}
      closeHref="/games"
      againHref={here}
      sound={settings.sound}
      coordinates={settings.coordinates}
    />
  );
}
