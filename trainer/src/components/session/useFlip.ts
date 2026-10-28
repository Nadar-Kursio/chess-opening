'use client';

import { useCallback, useState } from 'react';
import type { Turn } from '@/lib/types';

/** The board faces the learner's side; flipping is a view choice that doesn't change who moves. */
export function useFlip(side: Turn) {
  const [flipped, setFlipped] = useState(false);
  const flip = useCallback(() => setFlipped((f) => !f), []);
  return { orientation: (flipped ? (side === 'w' ? 'b' : 'w') : side) as Turn, flip };
}
