'use client';

import { useRef, useState, useTransition } from 'react';
import { updateSettings } from '@/app/actions';
import { play, SOUND_SET_INFO, SOUND_SETS, type SoundSet } from '@/lib/sound';
import { SPEECH_RATES, VOICES, type Voice } from '@/lib/speech';

const GOALS = [
  { value: 10, label: 'Casual', note: '10 moves' },
  { value: 30, label: 'Regular', note: '30 moves' },
  { value: 60, label: 'Serious', note: '60 moves' },
  { value: 120, label: 'Intense', note: '120 moves' },
];

const RATE_NOTE: Record<(typeof SPEECH_RATES)[number], string> = {
  90: 'Unhurried',
  100: 'Normal',
  125: 'Brisk',
  150: 'Fast',
};

interface FormSettings {
  daily_goal: number;
  sound: SoundSet;
  coordinates: boolean;
  narration: boolean;
  voice: Voice;
  speech_rate: (typeof SPEECH_RATES)[number];
}

export default function SettingsForm({
  initial,
  samples,
}: {
  initial: FormSettings;
  /** Each voice's recorded sample, when it has been recorded. */
  samples: Record<Voice, string | null>;
}) {
  const [s, setS] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const sample = useRef<HTMLAudioElement | null>(null);
  const save = (next: FormSettings) => {
    setS(next);
    setSaved(false);
    start(async () => {
      await updateSettings(next);
      setSaved(true);
    });
  };
  const hear = (voice: Voice, rate: number) => {
    const src = samples[voice];
    if (!src) return;
    sample.current ??= new Audio();
    sample.current.src = src;
    sample.current.playbackRate = rate / 100;
    void sample.current.play().catch(() => {});
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
      <fieldset>
        <legend>Move sounds</legend>
        <div className="goal-options">
          {SOUND_SETS.map((set) => (
            <button
              key={set}
              type="button"
              className={`goal-option${s.sound === set ? ' goal-option--on' : ''}`}
              aria-pressed={s.sound === set}
              onClick={() => {
                play('move', set);
                setTimeout(() => play('capture', set), 260);
                save({ ...s, sound: set });
              }}
            >
              <b>{SOUND_SET_INFO[set].label}</b>
              <span>{SOUND_SET_INFO[set].note}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="toggle">
        <input type="checkbox" checked={s.narration} onChange={(e) => save({ ...s, narration: e.target.checked })} />
        <span>
          The coach reads Learn aloud
          <span className="toggle__note">The repertoire courses have a recorded coach; the others stay silent.</span>
        </span>
      </label>
      <fieldset disabled={!s.narration} className="settings__voice">
        <legend>Coach’s voice</legend>
        <div className="goal-options goal-options--3">
          {(Object.keys(VOICES) as Voice[]).map((v) => (
            <button
              key={v}
              type="button"
              className={`goal-option${s.voice === v ? ' goal-option--on' : ''}`}
              aria-pressed={s.voice === v}
              onClick={() => {
                hear(v, s.speech_rate);
                save({ ...s, voice: v });
              }}
            >
              <b>{VOICES[v].name}</b>
              <span>{VOICES[v].accent}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset disabled={!s.narration} className="settings__voice">
        <legend>Speaking speed</legend>
        <div className="goal-options">
          {SPEECH_RATES.map((r) => (
            <button
              key={r}
              type="button"
              className={`goal-option${s.speech_rate === r ? ' goal-option--on' : ''}`}
              aria-pressed={s.speech_rate === r}
              onClick={() => {
                hear(s.voice, r);
                save({ ...s, speech_rate: r });
              }}
            >
              <b>{r / 100}×</b>
              <span>{RATE_NOTE[r]}</span>
            </button>
          ))}
        </div>
      </fieldset>
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
