import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { utterances, VOICES, SAMPLE, type Voice } from './speech';
import type { Colour, Line } from './types';

/* Recorded narration: one mp3 per (voice, text), named by a hash of both, in NARRATION_DIR/<voice>/.
   scripts/narrate.ts records what is missing; the server offers a session only the clips that
   exist, so an opening nobody has recorded simply plays silent. Generated, never committed. */

export const ENGINE = 'neural';

export const NARRATION_DIR = process.env.NARRATION_DIR ?? path.join(process.cwd(), 'narration');

export function clipName(voice: Voice, text: string) {
  return `${createHash('sha256').update(`${ENGINE}|${VOICES[voice].polly}|${text}`).digest('hex').slice(0, 24)}.mp3`;
}

export const CLIP = /^[0-9a-f]{24}\.mp3$/;

function recorded(voice: Voice) {
  try {
    return new Set(readdirSync(path.join(NARRATION_DIR, voice)));
  } catch {
    return new Set<string>();
  }
}

const url = (voice: Voice, name: string) => `/api/narration/${voice}/${name}`;

/** The clips for a Learn session of this line, by utterance key; empty when none are recorded. */
export function lineClips(line: Line, side: Colour, voice: Voice) {
  const have = recorded(voice);
  const clips: Record<string, string> = {};
  for (const u of utterances(line, side)) {
    const name = clipName(voice, u.text);
    if (have.has(name)) clips[u.key] = url(voice, name);
  }
  return clips;
}

/** Each voice's sample, for the picker in Settings. */
export function sampleClips() {
  return Object.fromEntries(
    (Object.keys(VOICES) as Voice[]).map((v) => {
      const name = clipName(v, SAMPLE);
      return [v, recorded(v).has(name) ? url(v, name) : null];
    }),
  ) as Record<Voice, string | null>;
}
