import { redirect } from 'next/navigation';
import RushSession from '@/components/fun/RushSession';
import { courses } from '@/lib/catalog';
import { getOpening, hasOpening } from '@/lib/content';
import { rushBests } from '@/lib/fun';
import { getProgress, getSettings } from '@/lib/progress';
import { rushPool } from '@/lib/rush';
import { requirePageUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Opening Rush' };

/** One course's positions, or every course the learner has started ("all"). */
export default async function RushRunPage({ searchParams }: PageProps<'/play/rush/run'>) {
  const { course } = await searchParams;
  const scope = course === 'all' ? 'all' : typeof course === 'string' && hasOpening(course) ? course : null;
  if (!scope) redirect('/play/rush');
  const user = await requirePageUser(`/play/rush/run?course=${scope}`);
  const [progress, settings, bests] = await Promise.all([getProgress(user.id), getSettings(user.id), rushBests(user.id)]);

  const learnedIn = (id: string) =>
    [...(progress.get(id)?.values() ?? [])].filter((p) => p.learned_at).map((p) => p.line_slug);
  const ids = scope === 'all' ? courses().map((o) => o.id) : [scope];
  // With anything learned, only learned chapters are asked; with nothing, every position offered.
  const { positions, fromLearned } = rushPool(ids.map((id) => ({ op: getOpening(id), learned: learnedIn(id) })));

  return (
    <RushSession
      pool={positions}
      scope={scope}
      title={scope === 'all' ? 'All my courses' : getOpening(scope).name}
      fromLearned={fromLearned}
      best={bests.get(scope)?.best ?? 0}
      sound={settings.sound}
      coordinates={settings.coordinates}
      closeHref="/play/rush"
    />
  );
}
