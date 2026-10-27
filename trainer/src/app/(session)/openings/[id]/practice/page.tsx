import { notFound } from 'next/navigation';
import FreeSession from '@/components/session/FreeSession';
import { getOpening, hasOpening } from '@/lib/content';
import { buildTree, sidesTaught } from '@/lib/course';
import { getSettings } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';
import type { Colour } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Free practice' };

export default async function PracticePage({ params, searchParams }: PageProps<'/openings/[id]/practice'>) {
  const { id } = await params;
  if (!hasOpening(id)) notFound();
  const user = await requirePageUser(`/openings/${id}/practice`);
  const op = getOpening(id);
  const sides = sidesTaught(op);
  const asked = (await searchParams).side;
  const side: Colour = sides.includes(asked as Colour) ? (asked as Colour) : sides[0];
  const settings = await getSettings(user.id);
  return (
    <FreeSession
      openingId={id}
      title={`Free practice · ${op.name}`}
      tree={buildTree(op, side)}
      closeHref={`/openings/${id}`}
      sound={settings.sound}
      coordinates={settings.coordinates}
    />
  );
}
