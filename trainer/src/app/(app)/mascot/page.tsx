import { getFun } from '@/lib/fun';
import { getMascot } from '@/lib/mascotChoice';
import { requirePageUser } from '@/lib/session';
import MascotStudio from './MascotStudio';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your companion' };

export default async function MascotPage() {
  const user = await requirePageUser('/mascot');
  const [mascot, { level }] = await Promise.all([getMascot(user.id).catch(() => null), getFun(user.id)]);
  return (
    <main className="page">
      <MascotStudio saved={mascot} level={level.level} rank={level.name} />
    </main>
  );
}
