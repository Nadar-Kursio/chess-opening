import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { positionKey } from './course';
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

/** A course's generated extras, in a file of their own: a course with none reads as it always has. */
function withCoaching(op: Opening) {
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
  op.engineView = true;
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
