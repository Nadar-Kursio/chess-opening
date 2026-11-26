'use client';

import { useState } from 'react';
import { mascotLine, stageFor } from '@/lib/mascots';
import Mascot from './Mascot';
import { useMascot } from './store';

/** The companion reacting to a finished session: a hop after a good result, a kind look after misses. */
export default function MascotCheer({ result }: { result: 'good' | 'mixed' }) {
  const mascot = useMascot();
  const [seed] = useState(() => Math.floor(Math.random() * 1000));
  if (!mascot?.id) return null;
  const line = mascot.levelCard ? null : mascotLine(mascot.id, result, seed);
  return (
    <div className="mascot-say mascot-cheer" role={line ? 'status' : undefined}>
      <Mascot
        id={mascot.id}
        stage={stageFor(mascot.level)}
        size="md"
        face={result === 'good' ? 'happy' : 'cheer'}
        motion={result === 'good' ? 'hop' : 'sway'}
      />
      {line ? <p className="mascot-say__line">{line}</p> : null}
    </div>
  );
}
