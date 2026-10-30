import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { ENGINE, NARRATION_DIR, clipName } from '../src/lib/narration';
import { SAMPLE, VOICES, utterances, type Voice } from '../src/lib/speech';
import type { Opening } from '../src/lib/types';

/* Records the Learn narration with Amazon Polly (through the aws CLI and the machine's own
   credentials) for every clip that isn't on disk yet, and never past a budget: what has been spent
   is kept in NARRATION_DIR/ledger.json, and a run that would cross NARRATION_BUDGET_USD (default 5)
   records nothing. `--dry-run` prints what a run would record and cost. */

const NARRATED = ['london', 'scandinavian', 'sicilian'];
const USD_PER_CHAR = 16 / 1_000_000; // Polly neural voices
const BUDGET = Number(process.env.NARRATION_BUDGET_USD ?? 5);
const CONTENT = process.env.CONTENT_DIR ?? path.join(process.cwd(), 'content');
const LEDGER = path.join(NARRATION_DIR, 'ledger.json');
const run = promisify(execFile);

interface Ledger {
  characters: number;
  usd: number;
}

function readLedger(): Ledger {
  return existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : { characters: 0, usd: 0 };
}

function texts() {
  const all = new Set([SAMPLE]);
  for (const id of NARRATED) {
    const op = JSON.parse(readFileSync(path.join(CONTENT, 'openings', `${id}.json`), 'utf8')) as Opening;
    for (const line of op.lines) for (const u of utterances(line, line.side ?? op.orientation)) all.add(u.text);
  }
  return [...all];
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const jobs: { voice: Voice; text: string; file: string }[] = [];
  for (const voice of Object.keys(VOICES) as Voice[]) {
    mkdirSync(path.join(NARRATION_DIR, voice), { recursive: true });
    for (const text of texts()) {
      const file = path.join(NARRATION_DIR, voice, clipName(voice, text));
      if (!existsSync(file) && !jobs.some((j) => j.file === file)) jobs.push({ voice, text, file });
    }
  }
  const chars = jobs.reduce((n, j) => n + j.text.length, 0);
  const ledger = readLedger();
  const cost = chars * USD_PER_CHAR;
  console.log(
    `${jobs.length} clips to record, ${chars.toLocaleString('en-GB')} characters, about $${cost.toFixed(2)}` +
      ` (spent so far $${ledger.usd.toFixed(2)} of $${BUDGET}).`,
  );
  if (!jobs.length || dryRun) return;
  if (ledger.usd + cost > BUDGET) {
    console.error('That would cross the narration budget; nothing recorded. Raise NARRATION_BUDGET_USD to go on.');
    process.exit(1);
  }

  let done = 0;
  const next = async (): Promise<void> => {
    const job = jobs.shift();
    if (!job) return;
    const tmp = `${job.file}.part`;
    const { stdout } = await run('aws', [
      'polly', 'synthesize-speech',
      '--engine', ENGINE,
      '--voice-id', VOICES[job.voice].polly,
      '--output-format', 'mp3',
      '--text', job.text,
      tmp,
    ]);
    renameSync(tmp, job.file);
    const billed = Number(JSON.parse(stdout).RequestCharacters ?? job.text.length);
    ledger.characters += billed;
    ledger.usd += billed * USD_PER_CHAR;
    writeFileSync(LEDGER, JSON.stringify(ledger, null, 2));
    if (++done % 50 === 0) console.log(`  ${done} recorded…`);
    return next();
  };
  await Promise.all(Array.from({ length: 4 }, next));
  console.log(`Recorded ${done} clips. Spent so far: $${ledger.usd.toFixed(2)}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
