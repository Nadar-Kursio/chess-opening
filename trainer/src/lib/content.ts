import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { positionKey } from './course';
import { hasScores } from './engineView';
import type { ClubBook } from './spar';
import type { Catalog, Game, MoveScore, Opening, Ply, Sidelines } from './types';

/* The course is the JSON src/build.py emits, copied into CONTENT_DIR by scripts/content.sh.
   Read once per process: a deploy is what changes it. */

const ROOT = process.env.CONTENT_DIR ?? path.join(process.cwd(), 'content');

function read(name: string) {
  try {
    return readFileSync(path.join(ROOT, name), 'utf8');
  } catch {
    throw new Error(`${path.join(ROOT, name)} is missing. Run: npm run content`);
  }
}

let catalog: Catalog | null = null;
const openings = new Map<string, Opening>();

export function getCatalog(): Catalog {
  catalog ??= JSON.parse(read('catalog.json')) as Catalog;
  return catalog;
}

export function hasOpening(id: string) {
  return getCatalog().openings.some((o) => o.id === id);
}

interface Coaching {
  verdicts?: Record<string, Record<string, MoveScore>>;
  sidelines?: Sidelines;
}

/** The eval bar and marks wherever the plies carry scores (every course ships evals), and the
    generated extras from a file of their own: a course with none has no verdicts or sidelines. */
function withCoaching(op: Opening) {
  op.engineView = hasScores(op.lines);
  const file = path.join('coaching', `${op.id}.json`);
  if (!existsSync(path.join(ROOT, file))) return op;
  const { verdicts, sidelines } = JSON.parse(read(file)) as Coaching;
  const place = (plies: Ply[]) => {
    for (const p of plies) {
      const scored = verdicts?.[positionKey(p)];
      if (scored) p.verdicts = scored;
    }
  };
  for (const line of op.lines) place(line.plies);
  for (const set of op.branchsets ?? []) for (const b of set) place(b.plies);
  for (const s of sidelines?.items ?? []) if (s.line) place(s.line.plies);
  op.sidelines = sidelines;
  return op;
}

export function getOpening(id: string): Opening {
  let op = openings.get(id);
  if (!op) {
    op = withCoaching(JSON.parse(read(path.join('openings', `${id}.json`))) as Opening);
    openings.set(id, op);
  }
  return op;
}

const verdictMaps = new Map<string, Coaching['verdicts']>();

/** Every legal move's score from one position the learner is asked, by the trainer's position key;
    null where the course has none. Sparring fetches these a position at a time. */
export function getVerdicts(id: string, key: string) {
  if (!verdictMaps.has(id)) {
    const file = path.join('coaching', `${id}.json`);
    verdictMaps.set(id, existsSync(path.join(ROOT, file)) ? (JSON.parse(read(file)) as Coaching).verdicts : undefined);
  }
  return verdictMaps.get(id)?.[key] ?? null;
}

const clubs = new Map<string, ClubBook | null>();

/** What club players play wherever the sparring partner moves; null for a course without the file. */
export function getClub(id: string): ClubBook | null {
  if (!clubs.has(id)) {
    const file = path.join('club', `${id}.json`);
    clubs.set(id, hasOpening(id) && existsSync(path.join(ROOT, file)) ? (JSON.parse(read(file)) as ClubBook) : null);
  }
  return clubs.get(id)!;
}

const games = new Map<string, Game>();

export function getGame(id: string): Game | null {
  if (!getCatalog().games.some((g) => g.id === id)) return null;
  let game = games.get(id);
  if (!game) {
    game = JSON.parse(read(path.join('games', `${id}.json`))) as Game;
    games.set(id, game);
  }
  return game;
}
