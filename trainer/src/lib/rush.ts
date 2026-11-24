import { buildTree, lineSide, turnOf, type Tree } from './course.ts';
import { buildRuns, courseCards, lineCards } from './recall.ts';
import type { Colour, Opening, Ply, Turn } from './types.ts';

/* Opening Rush: as many of your positions as you can answer in three minutes, three strikes and
   out. The server picks the positions from the compiled course (rushPool); the browser only orders
   them and checks a move against the `accept` list shipped with each. Pure, so tests/fun.test.ts
   drives it against the real course. */

export const RUSH_SECONDS = 180;
export const RUSH_STRIKES = 3;
/** Positions sent for one visit: more than anyone answers in three minutes. */
export const POOL_SIZE = 120;
/** Moves of the line shown before the position, so the last move is on the board. */
const CONTEXT = 2;
/** How far, in plies, ordering may pull a position away from its depth. */
const JITTER = 8;

export type RushStep = Pick<Ply, 'fen' | 'from' | 'to' | 'check' | 'turn' | 'legal' | 'san' | 'num'>;

export interface RushPosition {
  /** Course and position key: the same position is in the pool once. */
  id: string;
  openingId: string;
  course: string;
  side: Turn;
  /** Plies from the start: deeper positions come later in a run. */
  depth: number;
  /** A couple of moves of context, ending on the position to answer. */
  history: RushStep[];
  /** Every move the course teaches here, as from+to, with the position it leads to. */
  accept: { uci: string; step: RushStep }[];
  /** The course's main move, shown after a strike. */
  answer: { uci: string; num: string };
}

export interface RushSource {
  op: Opening;
  /** Slugs of the chapters (and sidelines) the learner has learned in this course. */
  learned: string[];
}

const trees = new WeakMap<Opening, Map<Colour, Tree>>();

function treeFor(op: Opening, side: Colour) {
  let bySide = trees.get(op);
  if (!bySide) trees.set(op, (bySide = new Map()));
  let tree = bySide.get(side);
  if (!tree) bySide.set(side, (tree = buildTree(op, side)));
  return tree;
}

const step = (p: Ply, withLegal: boolean): RushStep => ({
  fen: p.fen,
  from: p.from,
  to: p.to,
  check: p.check,
  turn: p.turn,
  san: p.san,
  num: p.num,
  ...(withLegal ? { legal: p.legal } : {}),
});

function acceptFrom(op: Opening, side: Colour, key: string) {
  const tree = treeFor(op, side);
  return tree.nodes[key].moves.map((e) => {
    const next = tree.nodes[e.next];
    return {
      uci: e.from + e.to,
      step: { fen: next.fen, from: e.from, to: e.to, check: next.check, turn: turnOf(side), san: e.san, num: e.num },
    };
  });
}

/** `also`: other courses that teach this position, whose moves count as right too. */
function positionAt(op: Opening, side: Colour, key: string, also: Opening[]): RushPosition | null {
  const [run] = buildRuns([{ openingId: op.id, key }], () => op, 1);
  const ask = run?.asks[0];
  if (!run || !ask) return null;
  const main = run.plies[ask.at + 1];
  const accept = acceptFrom(op, side, key);
  for (const other of also) {
    for (const a of acceptFrom(other, side, key)) if (!accept.some((b) => b.uci === a.uci)) accept.push(a);
  }
  const history = run.plies.slice(Math.max(0, ask.at - CONTEXT), ask.at + 1);
  return {
    id: `${op.id}:${key}`,
    openingId: op.id,
    course: op.name,
    side: turnOf(side),
    depth: ask.at,
    history: history.map((p, i) => step(p, i === history.length - 1)),
    accept,
    answer: { uci: main.from! + main.to!, num: main.num },
  };
}

/**
 * The positions for a run: where the learner moves in the chapters they've learned, or in the whole
 * course when they've learned none yet. A sample of `limit` when there are more.
 */
export function rushPool(sources: RushSource[], rng: () => number = Math.random, limit = POOL_SIZE) {
  const fromLearned = sources.some((s) => s.learned.length > 0);
  const candidates: { op: Opening; side: Colour; key: string; also: Opening[] }[] = [];
  const seen = new Map<string, (typeof candidates)[number]>();
  for (const { op, learned } of sources) {
    const keys = fromLearned
      ? learned.flatMap((slug) => {
          const line = op.lines.find((l) => l.slug === slug) ?? op.sidelines?.items.find((s) => s.slug === slug)?.line;
          return line ? lineCards(op, slug).map((key) => ({ key, side: lineSide(op, line) })) : [];
        })
      : [...courseCards(op)].map((key) => ({ key, side: key.endsWith('w') ? ('white' as const) : ('black' as const) }));
    for (const { key, side } of keys) {
      // The same position can be taught by two courses: it's asked once, and either course's move is right.
      const first = seen.get(key);
      if (first) {
        if (first.op !== op && !first.also.includes(op)) first.also.push(op);
        continue;
      }
      const c = { op, side, key, also: [] };
      seen.set(key, c);
      candidates.push(c);
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const positions = candidates
    .slice(0, limit)
    .map((c) => positionAt(c.op, c.side, c.key, c.also))
    .filter((p): p is RushPosition => p !== null);
  return { positions, fromLearned };
}

/** A run's order: shuffled, but leaning from the opening moves towards the deeper positions. */
export function rushOrder<T extends Pick<RushPosition, 'depth'>>(pool: T[], rng: () => number = Math.random): T[] {
  return pool
    .map((p) => ({ p, at: p.depth + rng() * JITTER }))
    .sort((a, b) => a.at - b.at)
    .map((x) => x.p);
}

/** Points for the next correct move, given how many in a row came before it. */
export function multiplier(combo: number) {
  if (combo >= 20) return 4;
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
}
