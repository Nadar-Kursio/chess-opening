'use client';

import { useState, useTransition } from 'react';
import { updateSettings } from '@/app/actions';

const GOALS = [
  { value: 10, label: 'Casual', note: '10 moves' },
  { value: 30, label: 'Regular', note: '30 moves' },
  { value: 60, label: 'Serious', note: '60 moves' },
  { value: 120, label: 'Intense', note: '120 moves' },
];

export default function SettingsForm({ initial }: { initial: { daily_goal: number; sound: boolean; coordinates: boolean } }) {
  const [s, setS] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const save = (next: typeof s) => {
    setS(next);
    setSaved(false);
    start(async () => {
      await updateSettings(next);
      setSaved(true);
    });
  };
  return (
    <div className="settings">
      <fieldset>
        <legend>Daily goal</legend>
        <div className="goal-options">
          {GOALS.map((g) => (
            <button
              key={g.value}
              type="button"
              className={`goal-option${s.daily_goal === g.value ? ' goal-option--on' : ''}`}
              aria-pressed={s.daily_goal === g.value}
              onClick={() => save({ ...s, daily_goal: g.value })}
            >
              <b>{g.label}</b>
              <span>{g.note}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="toggle">
        <input type="checkbox" checked={s.sound} onChange={(e) => save({ ...s, sound: e.target.checked })} />
        <span>Sound effects</span>
      </label>
      <label className="toggle">
        <input type="checkbox" checked={s.coordinates} onChange={(e) => save({ ...s, coordinates: e.target.checked })} />
        <span>Board coordinates</span>
      </label>
      <p className="muted small" aria-live="polite">
        {pending ? 'Saving…' : saved ? 'Saved.' : ' '}
      </p>
    </div>
  );
}
