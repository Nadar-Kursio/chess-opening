import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { ENGINE, NARRATION_DIR, clipName } from '../src/lib/narration';
import { NARRATED, SAMPLE, VOICES, utterances, type Voice } from '../src/lib/speech';
import type { Opening } from '../src/lib/types';

/* Records the Learn narration with Amazon Polly (through the aws CLI and the machine's own
   credentials) for every clip that isn't on disk yet, in the voices each course lists in NARRATED
   (src/lib/speech.ts), and never past a course's budget: what each course has spent is kept in
   NARRATION_DIR/ledger.json, and a course whose clips would take it past NARRATION_BUDGET_USD
   (default 5, per course) records nothing; the others still record. `--dry-run` prints what a run
   would record and cost, course by course; `--course <id>` limits a run to one course. */

/* Recording these too would cross the shared budget by $0.13, and no learner has picked Amy. */
const SKIPPED: Partial<Record<Voice, string[]>> = {
  amy: ['queensgambit/albin', 'queensgambit/chigorin', 'queensgambit/exchange-deep'],
};
/* Before budgets were per course these four shared one cap, and spent it: the ledger's totals from
   then are theirs together, so they stay one pot with one budget. */
const SHARED = ['london', 'scandinavian', 'sicilian', 'queensgambit'];
const USD_PER_CHAR = 16 / 1_000_000; // Polly neural voices
const BUDGET = Number(process.env.NARRATION_BUDGET_USD ?? 5);
const CONTENT = process.env.CONTENT_DIR ?? path.join(process.cwd(), 'content');
const LEDGER = path.join(NARRATION_DIR, 'ledger.json');
const run = promisify(execFile);

interface Spend {
  characters: number;
  usd: number;
}

interface Ledger extends Spend {
  /** What SHARED spent before the ledger kept courses apart. */
  shared: Spend;
  courses: Record<string, Spend>;
}

function readLedger(): Ledger {
  if (!existsSync(LEDGER)) return { characters: 0, usd: 0, shared: { characters: 0, usd: 0 }, courses: {} };
  const read = JSON.parse(readFileSync(LEDGER, 'utf8')) as Spend & Partial<Ledger>;
  return {
    characters: read.characters,
    usd: read.usd,
    shared: read.shared ?? { characters: read.characters, usd: read.usd },
    courses: read.courses ?? {},
  };
}

/** The budget a course draws on: its own, or the one SHARED had together. */
const pot = (course: string) => (SHARED.includes(course) ? 'the first four courses' : course);

function spentFrom(ledger: Ledger, name: string) {
  const own = Object.entries(ledger.courses).filter(([c]) => pot(c) === name).reduce((n, [, s]) => n + s.usd, 0);
  return own + (name === pot(SHARED[0]) ? ledger.shared.usd : 0);
}

function texts(course: string, voice: Voice) {
  const op = JSON.parse(readFileSync(path.join(CONTENT, 'openings', `${course}.json`), 'utf8')) as Opening;
  const all = new Set<string>();
  for (const line of op.lines) {
    if (SKIPPED[voice]?.includes(`${course}/${line.slug}`)) continue;
    for (const u of utterances(line, line.side ?? op.orientation)) all.add(u.text);
  }
  return [...all];
}

interface Job {
  voice: Voice;
  text: string;
  file: string;
  /** null for a voice's sample in Settings, which belongs to no course. */
  course: string | null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const only = process.argv.includes('--course') ? process.argv[process.argv.indexOf('--course') + 1] : null;
  if (only && !NARRATED[only]) {
    console.error(`${only} isn't in NARRATED (src/lib/speech.ts), so it has no voices to record.`);
    process.exit(1);
  }
  const jobs: Job[] = [];
  const queue = (voice: Voice, text: string, course: string | null) => {
    const file = path.join(NARRATION_DIR, voice, clipName(voice, text));
    if (!existsSync(file) && !jobs.some((j) => j.file === file)) jobs.push({ voice, text, file, course });
  };
  for (const voice of Object.keys(VOICES) as Voice[]) {
    mkdirSync(path.join(NARRATION_DIR, voice), { recursive: true });
    if (!only) queue(voice, SAMPLE, null);
  }
  for (const [course, voices] of Object.entries(NARRATED)) {
    if (only && course !== only) continue;
    for (const voice of voices) for (const text of texts(course, voice)) queue(voice, text, course);
  }

  const ledger = readLedger();
  const cost = (list: Job[]) => list.reduce((n, j) => n + j.text.length, 0) * USD_PER_CHAR;
  const pots = [...new Set(Object.keys(NARRATED).filter((c) => !only || c === only).map(pot))];
  const over: string[] = [];
  console.log(`${'course'.padEnd(24)} ${'clips'.padStart(6)} ${'chars'.padStart(9)} ${'cost'.padStart(7)}   spent of budget`);
  for (const name of pots) {
    const mine = jobs.filter((j) => j.course && pot(j.course) === name);
    const spent = spentFrom(ledger, name);
    const chars = mine.reduce((n, j) => n + j.text.length, 0);
    if (spent + cost(mine) > BUDGET) over.push(name);
    console.log(
      `${name.padEnd(24)} ${String(mine.length).padStart(6)} ${chars.toLocaleString('en-GB').padStart(9)} ` +
        `${`$${cost(mine).toFixed(2)}`.padStart(7)}   $${spent.toFixed(2)} of $${BUDGET}${spent + cost(mine) > BUDGET ? '  OVER' : ''}`,
    );
  }
  console.log(`${jobs.length} clips to record, about $${cost(jobs).toFixed(2)} (spent so far $${ledger.usd.toFixed(2)} in all).`);
  if (over.length) {
    console.error(
      `${over.join(', ')}: over the $${BUDGET} budget, so ${dryRun ? 'a run would record' : 'recording'} nothing there. ` +
        'Cut the text, or raise NARRATION_BUDGET_USD for that run if the user agrees.',
    );
  }
  if (dryRun) return;
  const allowed = jobs.filter((j) => !j.course || !over.includes(pot(j.course)));
  jobs.splice(0, jobs.length, ...allowed);
  if (!jobs.length) process.exit(over.length ? 1 : 0);

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
    if (job.course) {
      const spend = (ledger.courses[job.course] ??= { characters: 0, usd: 0 });
      spend.characters += billed;
      spend.usd += billed * USD_PER_CHAR;
    }
    writeFileSync(LEDGER, JSON.stringify(ledger, null, 2));
    if (++done % 50 === 0) console.log(`  ${done} recorded…`);
    return next();
  };
  await Promise.all(Array.from({ length: 4 }, next));
  console.log(`Recorded ${done} clips. Spent so far: $${ledger.usd.toFixed(2)}.`);
  if (over.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
