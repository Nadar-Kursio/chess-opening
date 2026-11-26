'use client';

import { useRef, useState } from 'react';
import { mascotLine, newLookAt, nextLook, stageFor, type MascotId } from '@/lib/mascots';
import Mascot from './Mascot';
import { levelCardPng, shareOrSave } from './shareCard';

/** The level-up card's middle: the mascot in its new look, what changed, and one line from it. */
export default function MascotLevelUp({ id, level, name }: { id: MascotId; level: number; name: string }) {
  const gain = newLookAt(level);
  const next = nextLook(level);
  const line = mascotLine(id, 'level', level);
  return (
    <div className="level-up__body" data-eyebrow={`Level ${level}`} data-title={name} data-line={line ?? ''}>
      <span className="level-up__mascot">
        <Mascot id={id} stage={stageFor(level)} size="xl" face="happy" motion="hop" />
      </span>
      <span className="toast__eyebrow">Level up</span>
      <h2 id="level-up-title">
        Level {level}: {name}
      </h2>
      {gain ? (
        <span className="level-up__new">New look: {gain}</span>
      ) : next ? (
        <span className="muted small">
          Next look at level {next.level}: {next.gain}
        </span>
      ) : null}
      {line ? <p className="level-up__say">“{line}”</p> : null}
      <span className="level-up__brand">chesslab.dev</span>
    </div>
  );
}

export function ShareLevel() {
  const button = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  async function share() {
    const card = button.current?.closest('.level-up__card');
    const body = card?.querySelector<HTMLElement>('.level-up__body');
    const svg = card?.querySelector<SVGSVGElement>('svg.mascot');
    const title = card?.querySelector('h2');
    if (!body || !svg || !title) return;
    setBusy(true);
    try {
      const png = await levelCardPng(
        svg,
        { eyebrow: body.dataset.eyebrow!, title: body.dataset.title!, line: body.dataset.line!, brand: 'chesslab.dev' },
        { display: getComputedStyle(title).fontFamily, body: getComputedStyle(body).fontFamily },
      );
      await shareOrSave(png, `chesslab-${body.dataset.title!.toLowerCase().replace(/\s+/g, '-')}.png`, body.dataset.title!);
    } catch {
      // Nothing to undo: the card itself is still there to screenshot.
    } finally {
      setBusy(false);
    }
  }
  return (
    <button ref={button} type="button" className="btn btn--secondary" onClick={share} disabled={busy}>
      {busy ? 'Making image…' : 'Share'}
    </button>
  );
}
