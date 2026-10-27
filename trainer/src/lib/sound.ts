/* Small synthesised cues, so the app ships no audio files: a wooden tap for a move, a brighter
   one for a capture, a rising pair for a right answer and a low buzz for a wrong one. */

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

export function play(cue: Cue, enabled: boolean) {
  if (!enabled) return;
  try {
    switch (cue) {
      case 'move':
        tone(180, 0, 0.07, 'triangle', 0.35);
        break;
      case 'capture':
        tone(260, 0, 0.09, 'triangle', 0.4);
        tone(140, 0.02, 0.08, 'sine', 0.3);
        break;
      case 'good':
        tone(660, 0, 0.12, 'sine', 0.18);
        tone(990, 0.09, 0.16, 'sine', 0.16);
        break;
      case 'bad':
        tone(150, 0, 0.22, 'sawtooth', 0.06);
        break;
      case 'done':
        [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.22, 'sine', 0.14));
        break;
    }
  } catch {
    // No audio device, or the browser refused: silence is fine.
  }
}
