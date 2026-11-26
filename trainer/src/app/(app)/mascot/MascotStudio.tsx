'use client';

import MascotPicker, { useChoose } from '@/components/mascot/MascotPicker';
import Mascot from '@/components/mascot/Mascot';
import { useMascot } from '@/components/mascot/store';
import { LOOK_GAINS, mascotById, nextLookLine, stageFor, type MascotId } from '@/lib/mascots';
import { RANKS } from '@/lib/xp';
import { useState } from 'react';

/** Choosing a companion, and every look it gets on the way up the ranks. */
export default function MascotStudio({ saved, level, rank }: { saved: MascotId | null; level: number; rank: string }) {
  const live = useMascot();
  const current = live ? live.id : saved;
  const [picked, setPicked] = useState<MascotId | null>(current);
  const { choose, saving, note } = useChoose();
  const stage = stageFor(level);
  const shown = mascotById(picked ?? current ?? 'pip')!;

  return (
    <>
      <section className="card mascot-hero">
        <Mascot
          id={shown.id}
          stage={stage}
          size="xl"
          face={picked && picked === current ? 'happy' : 'idle'}
          motion={picked ? 'hop' : null}
          key={shown.id}
        />
        <div className="mascot-hero__body">
          <span className="eyebrow">{current ? 'Your companion' : 'Meet the companions'}</span>
          <h1>{picked ? shown.name : 'Pick a companion'}</h1>
          <p className="muted">
            {picked
              ? `${cap(shown.kind)}. ${shown.blurb}`
              : 'One of them cheers you on after every session and dresses up as you climb the ranks.'}
          </p>
          {picked ? (
            <p className="small">
              Level {level}, {rank}. {nextLookLine(shown.name, level)}
            </p>
          ) : null}
        </div>
      </section>

      <section className="section" aria-labelledby="pick-title">
        <div className="section__head">
          <h2 className="section__title" id="pick-title">
            {current ? 'Switch companion' : 'Choose your companion'}
          </h2>
        </div>
        <MascotPicker value={picked} onChange={setPicked} stage={stage} />
        <div className="mascot-pick__actions">
          {note ? <p className="muted small mascot-pick__note">{note}</p> : null}
          <button
            type="button"
            className="btn btn--primary"
            disabled={!picked || picked === current || saving}
            onClick={() => picked && choose(picked)}
          >
            {!picked ? 'Choose one' : picked === current ? `${shown.name} is with you` : `Go with ${shown.name}`}
          </button>
        </div>
      </section>

      <section className="section" aria-labelledby="looks-title">
        <div className="section__head">
          <h2 className="section__title" id="looks-title">
            {shown.name}’s looks
          </h2>
          <span className="muted">A new one with every rank</span>
        </div>
        <ol className="wardrobe">
          {RANKS.map((r, i) => {
            const reached = stage >= i;
            return (
              <li key={r.name} className={`wardrobe__look${i === stage ? ' wardrobe__look--now' : ''}`}>
                <Mascot id={shown.id} stage={i} size="lg" shadow={!reached} />
                <b>{r.name}</b>
                <span>
                  Level {r.from}
                  {LOOK_GAINS[i] ? ` · ${LOOK_GAINS[i]}` : ''}
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
