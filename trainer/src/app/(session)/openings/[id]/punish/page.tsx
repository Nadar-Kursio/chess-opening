import { notFound } from 'next/navigation';
import QuizSession from '@/components/session/QuizSession';
import { getOpening, hasOpening } from '@/lib/content';
import { punishQuestions, turnOf } from '@/lib/course';
import { getSettings } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';
import { shuffled } from '@/lib/steps';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Punish the blunder' };

export default async function PunishPage({ params }: PageProps<'/openings/[id]/punish'>) {
  const { id } = await params;
  if (!hasOpening(id)) notFound();
  const user = await requirePageUser(`/openings/${id}/punish`);
  const op = getOpening(id);
  const settings = await getSettings(user.id);
  return (
    <QuizSession
      mode="punish"
      openingId={id}
      lineSlug={null}
      title={`Punish the blunder · ${op.name}`}
      side={turnOf(op.orientation)}
      questions={shuffled(punishQuestions(op, op.orientation)).slice(0, 10)}
      closeHref={`/openings/${id}`}
      next={null}
      sound={settings.sound}
      coordinates={settings.coordinates}
    />
  );
}
