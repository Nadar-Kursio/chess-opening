'use client';

import { useEffect } from 'react';
import { chooseMascot } from '@/app/mascot-actions';
import type { MascotId } from '@/lib/mascots';
import { keepPending, pendingChoice, updateMascot } from './store';

/** Hands the server's answer to the page's client components, and retries a choice that was kept on this device. */
export default function MascotSeed({ mascot, level }: { mascot: MascotId | null; level: number }) {
  useEffect(() => {
    const pending = pendingChoice();
    updateMascot({ id: pending ?? mascot, level });
    if (!pending) return;
    if (pending === mascot) {
      keepPending(null);
      return;
    }
    chooseMascot(pending)
      .then(() => keepPending(null))
      .catch(() => {});
  }, [mascot, level]);
  return null;
}
