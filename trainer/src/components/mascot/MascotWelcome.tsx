'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { mascotById, stageFor, type MascotId } from '@/lib/mascots';
import MascotPicker, { useChoose } from './MascotPicker';
import { askLater, askedLater } from './store';

/** Asks once, on the first visit without a companion; "Later" leaves the choice to the profile. */
export default function MascotWelcome({ level }: { level: number }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<MascotId | null>(null);
  const { choose, saving } = useChoose();
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!askedLater()) setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    card.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') later();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function later() {
    askLater();
    setOpen(false);
  }

  if (!open) return null;
  const name = mascotById(picked)?.name;
  // On the body: the header's backdrop blur would otherwise pin a fixed overlay inside the header.
  return createPortal(
    <div className="mascot-sheet" role="dialog" aria-modal="true" aria-labelledby="mascot-welcome-title">
      <div className="mascot-sheet__card" ref={card} tabIndex={-1}>
        <span className="eyebrow">New</span>
        <h2 id="mascot-welcome-title">Pick a companion</h2>
        <p className="muted">
          They cheer you on after each session and dress up as you climb the ranks. You can switch any time from your profile.
        </p>
        <MascotPicker value={picked} onChange={setPicked} stage={stageFor(level)} />
        <div className="mascot-pick__actions">
          <button type="button" className="btn btn--ghost" onClick={later}>
            Later
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!picked || saving}
            onClick={async () => {
              if (!picked) return;
              await choose(picked);
              setOpen(false);
            }}
          >
            {name ? `Go with ${name}` : 'Choose one'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
