import { getFun } from '@/lib/fun';
import { getMascot } from '@/lib/mascotChoice';
import MascotSeed from './MascotSeed';

/** For pages without the header: tells the end screens and the level-up card who is cheering. */
export default async function SessionMascot({ userId }: { userId: string }) {
  const [mascot, { level }] = await Promise.all([getMascot(userId).catch(() => null), getFun(userId)]);
  return <MascotSeed mascot={mascot} level={level.level} />;
}
