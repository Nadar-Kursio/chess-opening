'use client';

import { useState } from 'react';
import { chooseMascot } from '@/app/mascot-actions';
import { MASCOTS, type MascotId } from '@/lib/mascots';
import Mascot from './Mascot';
import { keepPending, updateMascot } from './store';

/** The six companions as one radio group, each drawn in the look the learner's rank gives. */
export default function MascotPicker({
  value,
  onChange,
  stage,
}: {
  value: MascotId | null;
  onChange: (id: MascotId) => void;
  stage: number;
}) {
  return (
    <fieldset className="mascot-pick">
      <legend className="mascot-pick__legend">Companion</legend>
      {MASCOTS.map((m) => {
        const on = value === m.id;
        return (
          <label key={m.id} className="mascot-pick__opt">
            <input type="radio" name="mascot" value={m.id} checked={on} onChange={() => onChange(m.id)} />
            <Mascot id={m.id} stage={stage} size="lg" face={on ? 'happy' : 'idle'} motion={on ? 'hop' : null} />
            <b>{m.name}</b>
            <span className="mascot-pick__kind">{m.kind}</span>
            <span className="mascot-pick__blurb">{m.blurb}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

export const KEPT_HERE = 'Saved on this device for now. It moves to your account once the server answers.';

/** Saves the choice to the account, or on this device when the server can't take it. */
export function useChoose() {
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  async function choose(id: MascotId) {
    setSaving(true);
    setNote(null);
    try {
      await chooseMascot(id);
      keepPending(null);
      updateMascot({ id });
      return true;
    } catch {
      keepPending(id);
      updateMascot({ id });
      setNote(KEPT_HERE);
      return false;
    } finally {
      setSaving(false);
    }
  }
  return { choose, saving, note };
}
