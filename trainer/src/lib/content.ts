import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Catalog, Game, Opening } from './types';

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

export function getOpening(id: string): Opening {
  let op = openings.get(id);
  if (!op) {
    op = JSON.parse(read(path.join('openings', `${id}.json`))) as Opening;
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
