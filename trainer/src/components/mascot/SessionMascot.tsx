import { Suspense } from 'react';
import { getFun } from '@/lib/fun';
import { getMascot } from '@/lib/mascotChoice';
import MascotSeed from './MascotSeed';

/**
 * For pages without the header: tells the end screens and the level-up card who is cheering.
 * Streamed in after the board, since the look is only needed once a session ends, and a learner
 * without a companion skips the XP read altogether.
 */
export default function SessionMascot({ userId }: { userId: string }) {
  return (
    <Suspense fallback={null}>
      <Seed userId={userId} />
    </Suspense>
  );
}

async function Seed({ userId }: { userId: string }) {
  const mascot = await getMascot(userId).catch(() => null);
  const level = mascot ? (await getFun(userId)).level.level : 1;
  return <MascotSeed mascot={mascot} level={level} />;
}
