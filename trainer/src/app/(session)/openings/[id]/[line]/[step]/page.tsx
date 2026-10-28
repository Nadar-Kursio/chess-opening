import { notFound } from 'next/navigation';
import LineSession, { type Alternative } from '@/components/session/LineSession';
import QuizSession from '@/components/session/QuizSession';
import { getOpening, hasOpening } from '@/lib/content';
import { STEP_INFO, STEP_KINDS, alternativesAt, lineBySlug, lineSide, quizFor, sharedStart, toMove, turnOf, type StepKind } from '@/lib/course';
import { getSettings } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';
import { nextAfter, shuffled } from '@/lib/steps';

export const dynamic = 'force-dynamic';

type Params = PageProps<'/openings/[id]/[line]/[step]'>;

function resolve(id: string, slug: string, step: string) {
  if (!hasOpening(id) || !STEP_KINDS.includes(step as StepKind)) return null;
  const op = getOpening(id);
  const line = lineBySlug(op, slug);
  return line ? { op, line, step: step as StepKind } : null;
}

export async function generateMetadata({ params }: Params) {
  const { id, line, step } = await params;
  const found = resolve(id, line, step);
  return { title: found ? `${STEP_INFO[found.step].label} · ${found.line.name}` : 'Session' };
}

export default async function StepPage({ params }: Params) {
  const { id, line: slug, step } = await params;
  const found = resolve(id, slug, step);
  if (!found) notFound();
  const user = await requirePageUser(`/openings/${id}/${slug}/${step}`);
  const settings = await getSettings(user.id);
  const { op, line } = found;
  const side = turnOf(lineSide(op, line));
  const title = `${STEP_INFO[found.step].label} · ${line.name}`;
  const common = {
    openingId: id,
    title,
    side,
    closeHref: `/openings/${id}`,
    next: nextAfter(op, slug, found.step),
    sound: settings.sound,
    coordinates: settings.coordinates,
  };

  if (found.step === 'quiz') {
    return <QuizSession {...common} mode="quiz" lineSlug={slug} questions={shuffled(quizFor(op, line))} />;
  }

  const alternatives: Record<number, Alternative[]> = {};
  line.plies.forEach((p, i) => {
    if (toMove(p) !== side) return;
    const alts = alternativesAt(op, line, i)
      .filter((b) => b.plies[0].from && b.plies[0].to)
      .map((b) => ({ san: b.plies[0].num, from: b.plies[0].from!, to: b.plies[0].to!, sev: b.sev, why: b.why, name: b.name }));
    if (alts.length) alternatives[i] = alts;
  });

  return (
    <LineSession
      {...common}
      mode={found.step}
      line={line}
      alternatives={alternatives}
      shared={found.step === 'learn' ? null : sharedStart(op, line)}
    />
  );
}
