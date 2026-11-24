import { notFound } from 'next/navigation';
import SparSession from '@/components/session/SparSession';
import { getClub, getOpening } from '@/lib/content';
import { sidesTaught } from '@/lib/course';
import { getSettings } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';
import { pickOpponent, sparBook } from '@/lib/spar';
import { getSparRecords } from '@/lib/sparBests';
import type { Colour } from '@/lib/types';
import '../../../../spar.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sparring' };

export default async function SparPage({ params, searchParams }: PageProps<'/play/spar/[id]'>) {
  const { id } = await params;
  const club = getClub(id);
  if (!club) notFound();
  const user = await requirePageUser(`/play/spar/${id}`);
  const op = getOpening(id);
  const sides = sidesTaught(op);
  const asked = (await searchParams).side;
  const side: Colour = sides.includes(asked as Colour) ? (asked as Colour) : sides[0];
  const [settings, records] = await Promise.all([getSettings(user.id), getSparRecords(user.id)]);
  return (
    <SparSession
      openingId={id}
      course={op.name}
      side={side}
      book={sparBook(op, side, club)}
      // Chosen here, so the page the server draws is the one the browser hydrates.
      opponent={pickOpponent(Math.random)}
      best={records.bests.get(`${id}|${side}`) ?? 0}
      closeHref="/play/spar"
      sound={settings.sound}
      coordinates={settings.coordinates}
      engineView={op.engineView}
    />
  );
}
