import { notFound } from 'next/navigation';
import QuizSession from '@/components/session/QuizSession';
import { getOpening, hasOpening } from '@/lib/content';
import { buildTree, otherTurn, sidesTaught, type Question } from '@/lib/course';
import { getMissedKeys, getSettings } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';
import { shuffled } from '@/lib/steps';
import type { Ply } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Review mistakes' };

/** The positions the learner has missed more often than found, asked again from the course tree. */
export default async function ReviewPage({ params }: PageProps<'/openings/[id]/review'>) {
  const { id } = await params;
  if (!hasOpening(id)) notFound();
  const user = await requirePageUser(`/openings/${id}/review`);
  const op = getOpening(id);
  const [missed, settings] = await Promise.all([getMissedKeys(user.id, id), getSettings(user.id)]);
  const trees = sidesTaught(op).map((s) => buildTree(op, s));

  const questions: (Question & { accept: string[] })[] = [];
  for (const { position_key: key } of missed) {
    const tree = trees.find((t) => t.nodes[key] && t.nodes[key].toMove === t.side);
    if (!tree || !tree.nodes[key].moves.length) continue;
    const node = tree.nodes[key];
    const best = node.moves.reduce((b, e) => (e.w > b.w ? e : b));
    const position: Ply = {
      san: node.num ? node.num.replace(/^\d+\.+/, '') : '',
      fen: node.fen,
      from: node.from,
      to: node.to,
      num: node.num,
      turn: otherTurn(node.toMove),
      check: node.check,
      legal: node.legal,
    };
    const next = tree.nodes[best.next];
    questions.push({
      id: `m:${key}`,
      kind: 'recall',
      prompt: node.num ? `Your move after ${node.num}` : 'Your first move',
      before: null,
      position,
      answer: { san: best.san, fen: next.fen, from: best.from, to: best.to, num: best.num, turn: node.toMove, check: next.check },
      explain: next.note,
      accept: node.moves.map((e) => e.from + e.to),
    });
  }

  return (
    <QuizSession
      mode="review"
      openingId={id}
      lineSlug={null}
      title={`Review mistakes · ${op.name}`}
      side={trees[0]?.side ?? 'w'}
      questions={shuffled(questions)}
      closeHref={`/openings/${id}`}
      next={null}
      sound={settings.sound}
      coordinates={settings.coordinates}
    />
  );
}
