import { getFun } from '@/lib/fun';
import { getMascot } from '@/lib/mascotChoice';
import MascotAvatar from './MascotAvatar';
import MascotSeed from './MascotSeed';

/** The header's profile button: the learner's companion in its current look, or their initial until they pick one. */
export default async function HeaderMascot({ userId, initial }: { userId: string; initial: string }) {
  const [mascot, { level }] = await Promise.all([getMascot(userId).catch(() => null), getFun(userId)]);
  return (
    <>
      <MascotSeed mascot={mascot} level={level.level} />
      <MascotAvatar mascot={mascot} level={level.level} initial={initial} />
    </>
  );
}
