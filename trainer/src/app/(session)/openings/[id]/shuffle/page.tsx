import { notFound, redirect } from 'next/navigation';
import { getOpening, hasOpening } from '@/lib/content';

export const dynamic = 'force-dynamic';

/** Drill shuffle: a random chapter, straight into Recall. */
export default async function ShufflePage({ params }: PageProps<'/openings/[id]/shuffle'>) {
  const { id } = await params;
  if (!hasOpening(id)) notFound();
  const lines = getOpening(id).lines;
  const pick = lines[Math.floor(Math.random() * lines.length)];
  redirect(`/openings/${id}/${pick.slug}/recall`);
}
