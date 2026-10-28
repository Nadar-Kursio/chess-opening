/* Small synthesised cues, so the app ships no audio files. Each set voices the same five cues — a
   move, a capture, a right answer, a wrong one and a finished session — in its own timbre. */

let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === 'undefined') return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, length: number, type: OscillatorType, gain: number) {
  const a = audio();
  if (!a) return;
  const osc = a.createOscillator();
  const amp = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = a.currentTime + at;
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(amp).connect(a.destination);
  osc.start(t);
  osc.stop(t + length + 0.02);
}

export type Cue = 'move' | 'capture' | 'good' | 'bad' | 'done';

export const SOUND_SETS = ['off', 'wood', 'soft', 'crisp'] as const;
export type SoundSet = (typeof SOUND_SETS)[number];

export const SOUND_SET_INFO: Record<SoundSet, { label: string; note: string }> = {
  off: { label: 'Off', note: 'Silent board' },
  wood: { label: 'Wood', note: 'A wooden tap' },
  soft: { label: 'Soft', note: 'Gentle and low' },
  crisp: { label: 'Crisp', note: 'A sharp click' },
};

type Tone = Parameters<typeof tone>;

const SETS: Record<Exclude<SoundSet, 'off'>, Record<Cue, Tone[]>> = {
  wood: {
    move: [[180, 0, 0.07, 'triangle', 0.35]],
    capture: [
      [260, 0, 0.09, 'triangle', 0.4],
      [140, 0.02, 0.08, 'sine', 0.3],
    ],
    good: [
      [660, 0, 0.12, 'sine', 0.18],
      [990, 0.09, 0.16, 'sine', 0.16],
    ],
    bad: [[150, 0, 0.22, 'sawtooth', 0.06]],
    done: [523, 659, 784, 1046].map((f, i): Tone => [f, i * 0.09, 0.22, 'sine', 0.14]),
  },
  soft: {
    move: [[330, 0, 0.14, 'sine', 0.2]],
    capture: [
      [392, 0, 0.14, 'sine', 0.22],
      [220, 0.03, 0.16, 'sine', 0.18],
    ],
    good: [
      [523, 0, 0.2, 'sine', 0.1],
      [784, 0.12, 0.24, 'sine', 0.09],
    ],
    bad: [[196, 0, 0.28, 'sine', 0.12]],
    done: [392, 494, 587, 784].map((f, i): Tone => [f, i * 0.12, 0.3, 'sine', 0.08]),
  },
  crisp: {
    move: [
      [1400, 0, 0.025, 'square', 0.05],
      [520, 0, 0.045, 'triangle', 0.3],
    ],
    capture: [
      [1700, 0, 0.03, 'square', 0.06],
      [380, 0.012, 0.07, 'triangle', 0.35],
    ],
    good: [
      [880, 0, 0.08, 'triangle', 0.16],
      [1320, 0.07, 0.1, 'triangle', 0.14],
    ],
    bad: [[220, 0, 0.16, 'square', 0.05]],
    done: [659, 784, 988, 1319].map((f, i): Tone => [f, i * 0.07, 0.14, 'triangle', 0.14]),
  },
};

export function play(cue: Cue, set: SoundSet) {
  if (set === 'off') return;
  try {
    for (const t of SETS[set][cue]) tone(...t);
  } catch {
    // No audio device, or the browser refused: silence is fine.
  }
}
