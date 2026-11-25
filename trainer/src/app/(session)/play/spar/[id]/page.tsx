import { notFound } from 'next/navigation';
import SparSession from '@/components/session/SparSession';
import { allOpenings } from '@/lib/gameImport';
import { baitsOf } from '@/lib/gameTraps';
import { trapName } from '@/lib/traps';
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
  const book = sparBook(op, side, club);
  const traps = baitsOf(allOpenings())
    .filter((b) => b.setter === side && book.tree.nodes[b.key])
    .map((b) => ({ id: b.trapId, name: trapName(getOpening(b.trapId).name), taken: b.taken, num: b.num }));
  return (
    <SparSession
      openingId={id}
      course={op.name}
      side={side}
      src={`/api/spar/${id}?side=${side}`}
      traps={traps}
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
