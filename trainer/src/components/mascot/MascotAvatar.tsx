'use client';

import Link from 'next/link';
import { stageFor, type MascotId } from '@/lib/mascots';
import Mascot from './Mascot';
import MascotWelcome from './MascotWelcome';
import { useMascot } from './store';

export default function MascotAvatar({ mascot, level, initial }: { mascot: MascotId | null; level: number; initial: string }) {
  const live = useMascot();
  const id = live ? live.id : mascot;
  return (
    <>
      <Link href="/profile" className={`avatar${id ? ` mascot-disc mascot-disc--${id}` : ''}`} aria-label="Your profile">
        {id ? <Mascot id={id} stage={stageFor(level)} size="sm" /> : initial}
      </Link>
      {live && !live.id ? <MascotWelcome level={level} /> : null}
    </>
  );
}
