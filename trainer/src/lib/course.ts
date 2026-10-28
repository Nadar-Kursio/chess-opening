import type { Branch, Colour, Line, Opening, Ply, Severity, Tier, Turn } from './types';

/* The course model, derived from the compiled opening alone: chapters, the steps through each,
   quiz questions and the move tree free practice walks. Pure, so tests/course.test.ts can drive
   it against the real JSON and the client can import it without a server. */

export type StepKind = 'learn' | 'drill' | 'recall' | 'quiz';
export const STEP_KINDS: StepKind[] = ['learn', 'drill', 'recall', 'quiz'];

export const STEP_INFO: Record<StepKind, { label: string; blurb: string }> = {
  learn: { label: 'Learn', blurb: 'Play through the line while the coach explains every move.' },
  drill: { label: 'Drill', blurb: 'Play your moves yourself, with hints when you need them.' },
  recall: { label: 'Recall', blurb: 'The whole line from memory: no hints, no notes until the end.' },
  quiz: { label: 'Quiz', blurb: 'Your opponent leaves the book. Find the right answer.' },
};

export const turnOf = (c: Colour): Turn => (c === 'white' ? 'w' : 'b');
export const colourOf = (t: Turn): Colour => (t === 'w' ? 'white' : 'black');
export const otherTurn = (t: Turn): Turn => (t === 'w' ? 'b' : 'w');
export const colourName = (t: Turn) => (t === 'w' ? 'White' : 'Black');

/** Who is to move in the position a ply holds. `turn` is who moved to reach it. */
export function toMove(p: Ply): Turn {
  return p.san === '' ? 'w' : otherTurn(p.turn);
}

/** A position, independent of the move order that reached it. */
export function positionKey(p: Ply) {
  return p.fen + toMove(p);
}

/** The chair a line is taught from: its own `side`, else the opening's. */
export function lineSide(op: Opening, line: Line): Colour {
  return line.side ?? op.orientation;
}

export interface Chapter {
  index: number;
  slug: string;
  name: string;
  note: string;
  side: Colour;
  tier?: Tier;
  /** The learner's own moves in the line — what a drill asks. */
  yourMoves: number;
}

export function chapters(op: Opening): Chapter[] {
  return op.lines.map((line, index) => {
    const side = lineSide(op, line);
    return {
      index,
      slug: line.slug,
      name: line.name,
      note: line.note,
      side,
      tier: line.tier,
      yourMoves: yourMoveIndexes(line, side).length,
    };
  });
}

export function lineBySlug(op: Opening, slug: string) {
  return op.lines.find((l) => l.slug === slug) ?? null;
}

/** Ply indexes (1-based into `plies`) of the moves the learner plays in a line. */
export function yourMoveIndexes(line: Line, side: Colour) {
  const t = turnOf(side);
  const out: number[] = [];
  line.plies.forEach((p, i) => {
    if (i > 0 && p.turn === t) out.push(i);
  });
  return out;
}

/**
 * The longest run of opening moves this line shares with an earlier chapter taught from the same
 * chair — what Drill and Recall can skip, so practice starts where the line becomes its own.
 */
export function sharedStart(op: Opening, line: Line) {
  const side = lineSide(op, line);
  let best = { plies: 0, chapter: '' };
  for (const other of op.lines) {
    if (other === line) break;
    if (lineSide(op, other) !== side) continue;
    let k = 1;
    while (k < line.plies.length && k < other.plies.length && line.plies[k].san === other.plies[k].san) k++;
    if (k - 1 > best.plies) best = { plies: k - 1, chapter: other.name };
  }
  // Worth offering only when it saves a few moves and leaves a real line to play.
  return best.plies >= 6 && best.plies <= line.plies.length - 5 ? best : null;
}

/** The authored alternatives to the move a line plays from ply `i`, minus that move itself. */
export function alternativesAt(op: Opening, line: Line, i: number): Branch[] {
  const bx = line.plies[i]?.bx;
  if (bx === undefined) return [];
  const played = line.plies[i + 1]?.san;
  return (op.branchsets?.[bx] ?? []).filter((b) => b.san !== played);
}

/* ---------- progress ---------- */

export interface LineProgress {
  line_slug: string;
  learned_at: string | null;
  drilled_at: string | null;
  recalled_at: string | null;
  quizzed_at: string | null;
  quiz_best: number | null;
  clean_runs: number;
  runs: number;
}

const STEP_COLUMN = {
  learn: 'learned_at',
  drill: 'drilled_at',
  recall: 'recalled_at',
  quiz: 'quizzed_at',
} as const satisfies Record<StepKind, keyof LineProgress>;

export function stepColumn(kind: StepKind) {
  return STEP_COLUMN[kind];
}

export function stepDone(p: LineProgress | undefined, kind: StepKind) {
  return !!p?.[STEP_COLUMN[kind]];
}

export interface CourseProgress {
  done: number;
  total: number;
  pct: number;
  chaptersDone: number;
  next: { slug: string; step: StepKind; name: string } | null;
}

export function courseProgress(chs: Chapter[], byLine: Map<string, LineProgress>): CourseProgress {
  let done = 0;
  let chaptersDone = 0;
  let next: CourseProgress['next'] = null;
  for (const ch of chs) {
    const p = byLine.get(ch.slug);
    let all = true;
    for (const kind of STEP_KINDS) {
      if (stepDone(p, kind)) done++;
      else {
        all = false;
        next ??= { slug: ch.slug, step: kind, name: ch.name };
      }
    }
    if (all) chaptersDone++;
  }
  const total = chs.length * STEP_KINDS.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, chaptersDone, next };
}

/* ---------- quiz ---------- */

export interface Question {
  id: string;
  kind: 'deviation' | 'recall';
  /** Short heading: what happened, or just "Your move". */
  prompt: string;
  /** The position before the opponent's move, so the board can play it in. */
  before: Ply | null;
  /** The board the learner answers. */
  position: Ply;
  answer: Ply;
  sev?: Severity;
  why?: string;
  name?: string;
  /** The note on the answer move, when the line has one. */
  explain?: string | null;
}

function deviationQuestions(op: Opening, line: Line, side: Colour, onlyBlunders = false) {
  const you = turnOf(side);
  const out: Question[] = [];
  line.plies.forEach((p, i) => {
    if (p.bx === undefined || toMove(p) === you) return;
    const mainMove = line.plies[i + 1];
    for (const b of alternativesAt(op, line, i)) {
      if (b.plies.length < 2 || b.plies[1].turn !== you) continue;
      if (onlyBlunders && b.sev !== 'blunder') continue;
      const who = colourName(toMove(p));
      out.push({
        id: `d:${positionKey(b.plies[0])}`,
        kind: 'deviation',
        prompt: mainMove
          ? `${who} played ${b.plies[0].num} instead of ${mainMove.num}`
          : `${who} played ${b.plies[0].num}`,
        before: p,
        position: b.plies[0],
        answer: b.plies[1],
        sev: b.sev,
        why: b.why,
        name: b.name,
        explain: b.plies[1].note ?? null,
      });
    }
  });
  return out;
}

function recallQuestions(line: Line, side: Colour) {
  return yourMoveIndexes(line, side).map(
    (i): Question => ({
      id: `r:${positionKey(line.plies[i - 1])}`,
      kind: 'recall',
      prompt: `Your move after ${line.plies[i - 1].num || 'the start'}`,
      before: i >= 2 ? line.plies[i - 2] : null,
      position: line.plies[i - 1],
      answer: line.plies[i],
      explain: line.plies[i].note ?? null,
    }),
  );
}

/** Evenly spread picks, so a long line's quiz isn't all opening moves. */
function spread<T>(items: T[], n: number) {
  if (items.length <= n) return items;
  return Array.from({ length: n }, (_, k) => items[Math.floor(((k + 0.5) * items.length) / n)]);
}

function uniqueById(qs: Question[]) {
  const seen = new Set<string>();
  return qs.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)));
}

/**
 * A chapter's quiz: the opponent's authored deviations along the line (what to answer when they
 * leave the book), topped up with positions from the line itself, out of order.
 */
export function quizFor(op: Opening, line: Line, size = 8): Question[] {
  const side = lineSide(op, line);
  const deviations = spread(uniqueById(deviationQuestions(op, line, side)), Math.ceil(size * 0.75));
  const recall = spread(recallQuestions(line, side), size - deviations.length);
  return uniqueById([...deviations, ...recall]);
}

/** Every blunder the opponent can make in this opening's lines, with the punishment to find. */
export function punishQuestions(op: Opening, side: Colour): Question[] {
  return uniqueById(
    op.lines
      .filter((l) => lineSide(op, l) === side)
      .flatMap((l) => deviationQuestions(op, l, side, true)),
  );
}

/* ---------- the move tree ---------- */

export interface TreeEdge {
  san: string;
  num: string;
  from: string;
  to: string;
  next: string;
  /** How often the opponent picks it: lines outweigh deviations. */
  w: number;
  sev?: Severity;
  why?: string;
  name?: string;
}

export interface TreeNode {
  fen: string;
  toMove: Turn;
  from: string | null;
  to: string | null;
  check?: boolean;
  legal?: string;
  num: string;
  note?: string | null;
  ev?: number;
  mate?: number;
  moves: TreeEdge[];
}

export interface Tree {
  root: string;
  side: Turn;
  nodes: Record<string, TreeNode>;
}

const BRANCH_WEIGHT: Record<Severity, number> = { playable: 2, inaccuracy: 1, blunder: 1 };

/**
 * Every position the course reaches from one chair, merged by position: the lines, plus each
 * deviation the opponent can make and the authored answer to it. The learner's own alternatives
 * stay out — free practice drills the repertoire, not the moves it chose against.
 */
export function buildTree(op: Opening, side: Colour): Tree {
  const you = turnOf(side);
  const nodes: Record<string, TreeNode> = {};

  const node = (p: Ply) => {
    const key = positionKey(p);
    nodes[key] ??= {
      fen: p.fen,
      toMove: toMove(p),
      from: p.from,
      to: p.to,
      check: p.check,
      legal: p.legal,
      num: p.num,
      note: p.note,
      ev: p.ev,
      mate: p.mate,
      moves: [],
    };
    return key;
  };

  const link = (from: Ply, to: Ply, w: number, extra: Partial<TreeEdge> = {}) => {
    const parent = nodes[node(from)];
    const next = node(to);
    const existing = parent.moves.find((e) => e.next === next);
    if (existing) {
      existing.w += w;
      return;
    }
    if (!to.from || !to.to) return;
    parent.moves.push({ san: to.san, num: to.num, from: to.from, to: to.to, next, w, ...extra });
  };

  let root = '';
  for (const line of op.lines) {
    if (lineSide(op, line) !== side) continue;
    root ||= node(line.plies[0]);
    line.plies.forEach((p, i) => {
      const nextPly = line.plies[i + 1];
      if (nextPly) link(p, nextPly, 3);
      if (toMove(p) === you) return;
      for (const b of alternativesAt(op, line, i)) {
        link(p, b.plies[0], BRANCH_WEIGHT[b.sev], { sev: b.sev, why: b.why, name: b.name });
        for (let k = 1; k < b.plies.length; k++) link(b.plies[k - 1], b.plies[k], 2);
      }
    });
  }
  return { root, side: you, nodes };
}

/** Lines in this opening taught from each chair, so free practice can offer both when it has to. */
export function sidesTaught(op: Opening): Colour[] {
  const sides = new Set(op.lines.map((l) => lineSide(op, l)));
  return (['white', 'black'] as Colour[]).filter((s) => sides.has(s));
}
