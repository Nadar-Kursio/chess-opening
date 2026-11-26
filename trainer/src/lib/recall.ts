import { alternativesAt, buildTree, lineBySlug, lineSide, otherTurn, positionKey, toMove, turnOf, yourMoveIndexes, type Tree } from './course.ts';
import type { Colour, Opening, Ply, Severity, Turn } from './types.ts';

/* Recall, as rounds of runs. A card is a position where the learner has a move to find; a run
   replays the moves that lead to one or more due cards and asks each in turn, so a move is
   recalled in the context it's met over the board, not as a flash card. Pure: the page builds
   rounds on the server and tests/recall.test.ts drives it against the real course. */

/** How many moves of the line a run replays before its first question. */
export const CONTEXT_PLIES = 6;
/** Questions in one round: a few minutes' work. */
export const ROUND_SIZE = 20;

export interface YourAlternative {
  san: string;
  from: string;
  to: string;
  sev: Severity;
  why: string;
  name?: string;
}

/** The chapter, or sideline lesson, a card comes from, and where its Learn picks up for it. */
export interface Where {
  slug: string;
  name: string;
  /** The chapter's number in the course; null for a sideline. */
  chapter: number | null;
  /** The ply Learn opens at: just before the move, so the opponent's move that sets it is replayed. */
  ply: number;
}

/** A wrong answer played out: the board it leaves, and its score where the course ships one. */
export interface WrongMove {
  san: string;
  fen: string;
  check?: boolean;
  ev?: number;
  mate?: number;
}

export interface Ask {
  /** Index into the run's plies: the position the learner moves from. */
  at: number;
  key: string;
  /** Every move the course teaches from here, as from+to. */
  accept: string[];
  /** The authored moves the course chose against, with why. */
  alternatives: YourAlternative[];
  where: Where | null;
  /** Every other legal move from here, by from+to; filled in by the page (recallMoves.ts). */
  wrong?: Record<string, WrongMove>;
}

export interface Run {
  openingId: string;
  course: string;
  side: Turn;
  engineView: boolean;
  /** From the starting position to the last answer. */
  plies: Ply[];
  /** Where the run's replay begins. */
  start: number;
  asks: Ask[];
}

export interface Due {
  openingId: string;
  key: string;
}

interface Edge {
  from: string;
  san: string;
  num: string;
  move: { from: string; to: string };
}

export interface Paths {
  tree: Tree;
  /** The move that reaches each position, so any position has a path back to the start. */
  parent: Map<string, Edge>;
  alternatives: Map<string, YourAlternative[]>;
  /** Every lesson that meets a position, closest first: chapters, then sidelines, then deviations. */
  where: Map<string, Where[]>;
}

const cache = new WeakMap<Opening, Map<Colour, Paths>>();

export function pathsFor(op: Opening, side: Colour): Paths {
  let bySide = cache.get(op);
  if (!bySide) cache.set(op, (bySide = new Map()));
  let paths = bySide.get(side);
  if (paths) return paths;

  const tree = buildTree(op, side);
  const parent: Paths['parent'] = new Map();
  const link = (from: string, e: Tree['nodes'][string]['moves'][number]) => {
    if (e.next === tree.root || parent.has(e.next)) return false;
    parent.set(e.next, { from, san: e.san, num: e.num, move: { from: e.from, to: e.to } });
    return true;
  };
  // A position is reached the way the first chapter that plays it does, so a card is replayed in
  // the move order it was learned in, not through a transposition.
  for (const line of op.lines) {
    if (lineSide(op, line) !== side) continue;
    for (let i = 1; i < line.plies.length; i++) {
      const from = positionKey(line.plies[i - 1]);
      const edge = tree.nodes[from]?.moves.find((e) => e.next === positionKey(line.plies[i]));
      if (edge) link(from, edge);
    }
  }
  // Then the deviations, breadth first and the commonest move first.
  const queue = tree.root ? [tree.root] : [];
  const seen = new Set(queue);
  while (queue.length) {
    const key = queue.shift()!;
    for (const e of [...tree.nodes[key].moves].sort((a, b) => b.w - a.w)) {
      link(key, e);
      if (!seen.has(e.next)) {
        seen.add(e.next);
        queue.push(e.next);
      }
    }
  }

  const alternatives: Paths['alternatives'] = new Map();
  const you = turnOf(side);
  for (const line of op.lines) {
    if (lineSide(op, line) !== side) continue;
    line.plies.forEach((p, i) => {
      if (toMove(p) !== you) return;
      const key = positionKey(p);
      if (alternatives.has(key)) return;
      const alts = alternativesAt(op, line, i)
        .filter((b) => b.plies[0].from && b.plies[0].to)
        .map((b) => ({ san: b.plies[0].num, from: b.plies[0].from!, to: b.plies[0].to!, sev: b.sev, why: b.why, name: b.name }));
      if (alts.length) alternatives.set(key, alts);
    });
  }

  const where: Paths['where'] = new Map();
  const place = (key: string, w: Where) => {
    const list = where.get(key) ?? [];
    if (!list.some((x) => x.slug === w.slug)) list.push(w);
    where.set(key, list);
  };
  // A chapter's own moves first, then the sideline lessons, then the opponent's deviations, each
  // met in its chapter where it leaves the line: the first entry is the closest lesson.
  const chapters = op.lines.flatMap((line, index) =>
    lineSide(op, line) === side ? [{ line, chapter: { slug: line.slug, name: line.name, chapter: index + 1 } }] : [],
  );
  for (const { line, chapter } of chapters) {
    line.plies.forEach((p, i) => {
      if (toMove(p) === you) place(positionKey(p), { ...chapter, ply: Math.max(0, i - 1) });
    });
  }
  for (const s of op.sidelines?.items ?? []) {
    if (!s.line || lineSide(op, s.line) !== side) continue;
    const start = s.line.start ?? 0;
    s.line.plies.forEach((p, i) => {
      if (i > start && toMove(p) === you) place(positionKey(p), { slug: s.slug, name: s.line!.name, chapter: null, ply: Math.max(start, i - 1) });
    });
  }
  for (const { line, chapter } of chapters) {
    line.plies.forEach((p, i) => {
      if (toMove(p) === you) return;
      for (const b of alternativesAt(op, line, i)) {
        for (const q of b.plies) if (toMove(q) === you) place(positionKey(q), { ...chapter, ply: i });
      }
    });
  }

  paths = { tree, parent, alternatives, where };
  bySide.set(side, paths);
  return paths;
}

/** The course's tree from one chair, built once per course. */
export function treeFor(op: Opening, side: Colour) {
  return pathsFor(op, side).tree;
}

/** The authored moves the course chose against, at a position where the learner moves. */
export function yourAlternatives(op: Opening, side: Colour, key: string) {
  return pathsFor(op, side).alternatives.get(key) ?? [];
}

/** The side whose tree holds `key` as a position the learner moves from, if either does. */
export function sideOf(op: Opening, key: string): Colour | null {
  for (const side of ['white', 'black'] as Colour[]) {
    const node = pathsFor(op, side).tree.nodes[key];
    if (node && node.toMove === turnOf(side) && node.moves.length) return side;
  }
  return null;
}

/** Whether a reported position is one the course asks the learner to find a move from. */
export function isCard(op: Opening, key: string) {
  return sideOf(op, key) !== null;
}

/** The cards a chapter's Learn introduces: every position in the line where the learner moves. */
export function lineCards(op: Opening, slug: string) {
  const line = lineBySlug(op, slug);
  if (!line) return [];
  const side = lineSide(op, line);
  return yourMoveIndexes(line, side)
    .map((i) => positionKey(line.plies[i - 1]))
    .filter((key) => sideOf(op, key) === side);
}

/** Every position a course could ask — what "mastered" is counted against. */
export function courseCards(op: Opening) {
  const keys = new Set<string>();
  for (const line of op.lines) for (const key of lineCards(op, line.slug)) keys.add(key);
  return keys;
}

function plyAt(tree: Tree, key: string, via: Pick<Edge, 'san' | 'num' | 'move'> | null): Ply {
  const n = tree.nodes[key];
  return {
    san: via?.san ?? '',
    fen: n.fen,
    // From the move, not the position: a transposed position was first reached by another move.
    from: via?.move.from ?? null,
    to: via?.move.to ?? null,
    num: via?.num ?? '',
    // Who moved to reach this position; the start belongs to White by convention.
    turn: via ? otherTurn(n.toMove) : 'w',
    check: n.check,
    legal: n.legal,
    note: n.note,
    ev: n.ev,
    mate: n.mate,
    mark: n.mark,
    verdicts: n.verdicts,
  };
}

/** Positions from the start to `key`, oldest first. */
function pathTo(p: Paths, key: string) {
  const keys = [key];
  for (let k = key; p.parent.has(k); ) {
    k = p.parent.get(k)!.from;
    keys.unshift(k);
  }
  return keys;
}

interface Placed extends Due {
  side: Colour;
  path: string[];
  rank: number;
}

/**
 * The due cards as runs. Cards are taken in the order given (most urgent first); each run follows
 * the path to the deepest due card below the one it was opened for, and asks every due card along
 * the way — so a line with three faded moves is one replay, not three.
 */
export function buildRuns(due: Due[], opening: (id: string) => Opening, limit = ROUND_SIZE): Run[] {
  const placed: Placed[] = [];
  const seen = new Set<string>();
  due.forEach((d, rank) => {
    // The same position can be a card in two courses (1.d4 in two London courses): ask it once.
    if (seen.has(d.key)) return;
    const op = opening(d.openingId);
    const side = sideOf(op, d.key);
    if (!side) return;
    seen.add(d.key);
    placed.push({ ...d, side, path: pathTo(pathsFor(op, side), d.key), rank });
  });

  const runs: Run[] = [];
  const used = new Set<string>();
  let asked = 0;
  for (const card of placed) {
    if (asked >= limit) break;
    if (used.has(card.key)) continue;
    const same = placed.filter((c) => c.openingId === card.openingId && c.side === card.side && !used.has(c.key));
    // The deepest unasked card whose path passes through this one sets the run's line.
    const deepest = same
      .filter((c) => c.path.includes(card.key))
      .reduce((a, b) => (b.path.length > a.path.length ? b : a), card);
    const onPath = new Set(deepest.path);
    const stops = same
      .filter((c) => onPath.has(c.key))
      .sort((a, b) => a.path.length - b.path.length)
      .slice(0, Math.max(1, limit - asked));
    const run = runAlong(opening(card.openingId), card.side, deepest.path.slice(0, stops.at(-1)!.path.length), stops);
    for (const s of stops) used.add(s.key);
    asked += run.asks.length;
    runs.push(run);
  }
  return interleave(runs);
}

function runAlong(op: Opening, side: Colour, path: string[], stops: Placed[]): Run {
  const p = pathsFor(op, side);
  const plies = path.map((key, i) => plyAt(p.tree, key, i ? p.parent.get(key)! : null));
  // The last question's answer isn't on the path yet: add the course's main move from there.
  const lastNode = p.tree.nodes[path.at(-1)!];
  const answer = [...lastNode.moves].sort((a, b) => b.w - a.w)[0];
  plies.push(plyAt(p.tree, answer.next, { ...answer, move: { from: answer.from, to: answer.to } }));

  // A card met in several chapters is named by the one this run replays, where it can be.
  const runLine = p.where.get(stops.at(-1)!.key)?.[0]?.slug;
  const asks = stops.map((s): Ask => {
    const at = s.path.length - 1;
    const isLast = at === path.length - 1;
    const next = plies[at + 1];
    const met = p.where.get(s.key) ?? [];
    return {
      at,
      key: s.key,
      // Mid-run the line must continue the way it's going; at the end any taught move will do.
      accept: isLast ? p.tree.nodes[s.key].moves.map((e) => e.from + e.to) : [next.from! + next.to!],
      alternatives: p.alternatives.get(s.key) ?? [],
      where: met.find((w) => w.slug === runLine) ?? met[0] ?? null,
    };
  });
  // Only an asked position's verdicts are read, and they are most of a run's weight.
  const asked = new Set(asks.map((a) => a.at));
  plies.forEach((ply, i) => {
    if (!asked.has(i)) delete ply.verdicts;
  });
  return {
    openingId: op.id,
    course: op.name,
    side: turnOf(side),
    engineView: !!op.engineView,
    plies,
    start: Math.max(0, asks[0].at - CONTEXT_PLIES),
    asks,
  };
}

/** Mixes courses so neighbouring runs differ where they can: telling similar positions apart is part of remembering them. */
function interleave(runs: Run[]) {
  const out: Run[] = [];
  const left = [...runs];
  while (left.length) {
    const prev = out.at(-1)?.openingId;
    const i = left.findIndex((r) => r.openingId !== prev);
    out.push(left.splice(i < 0 ? 0 : i, 1)[0]);
  }
  return out;
}

/** A single question again, for a move missed earlier in the round. */
export function retryRun(run: Run, ask: Ask): Run {
  return { ...run, plies: run.plies.slice(0, ask.at + 2), start: Math.max(0, ask.at - 2), asks: [ask] };
}

/** Wrong tries at one question before the move is shown. */
export const TRIES = 2;

/**
 * What one try at a question does. Only the first try is evidence for the schedule: a miss grades
 * the card Again even when the next try finds it, and a retry later in the round grades nothing.
 * The second try is there to learn from, and a second miss shows the move.
 */
export function judgeTry(misses: number, hit: boolean, retry: boolean): { grade: boolean | null; reveal: boolean } {
  return { grade: misses === 0 && !retry ? hit : null, reveal: !hit && misses + 1 >= TRIES };
}

/** The card's chapter in Learn, opened just before its move. */
export function learnHref(openingId: string, where: Where) {
  return `/openings/${openingId}/${where.slug}/learn?at=${where.ply}`;
}
