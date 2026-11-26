'use client';

import { useSyncExternalStore } from 'react';
import { isMascotId, type MascotId } from '@/lib/mascots';

/* The learner's companion and level for client components anywhere on the page (end screens, the
   level-up card), set by MascotSeed from what the layout read on the server. A choice the server
   couldn't take is kept in localStorage until it can. */

export interface MascotState {
  id: MascotId | null;
  level: number;
  /** A level-up card is on screen, so nothing else lets the mascot speak. */
  levelCard: boolean;
}

let state: MascotState | null = null;
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useMascot() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => null,
  );
}

export function updateMascot(next: Partial<MascotState>) {
  state = { id: null, level: 1, levelCard: false, ...state, ...next };
  for (const fn of listeners) fn();
}

const PENDING = 'chesslab.mascot';
const LATER = 'chesslab.mascot.later';

export function pendingChoice(): MascotId | null {
  try {
    const id = localStorage.getItem(PENDING);
    return isMascotId(id) ? id : null;
  } catch {
    return null;
  }
}

export function keepPending(id: MascotId | null) {
  try {
    if (id) localStorage.setItem(PENDING, id);
    else localStorage.removeItem(PENDING);
  } catch {}
}

export function askedLater() {
  try {
    return localStorage.getItem(LATER) === '1';
  } catch {
    return false;
  }
}

export function askLater() {
  try {
    localStorage.setItem(LATER, '1');
  } catch {}
}
