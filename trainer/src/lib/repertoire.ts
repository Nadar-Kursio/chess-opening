import { alternativesAt, lineSide, positionKey, toMove, turnOf } from './course.ts';
import { addTally, emptyTally, type PositionMemory, type Tally } from './mastery.ts';
import { recallOdds, strengthOf, type CardState } from './memory.ts';
import { pathsFor, type YourAlternative } from './recall.ts';
import type { Colour, Mark, Opening, Severity, Turn } from './types.ts';

/* The repertoire explorer: everything a course teaches from one chair as a tree to browse, with
   what the learner remembers of each position laid over it. Pure: positions, moves and scores all
   come from the compiled course (buildTree via recall.ts's paths), club numbers from the club
   files the scripts generate, and memory from the Recall deck the server reads. */

export type TeachStep = 'learn' | 'drill' | 'quiz';

/** A chapter or sideline lesson that plays a move, and the steps that ask it. */
export interface Teach {
  slug: string;
  name: string;
  kind: 'chapter' | 'sideline';
  /** The chapter's place in the course; for a sideline, the chapter it leaves. */
  index: number | null;
  steps: TeachStep[];
}

export interface XMove {
  san: string;
  num: string;
  from: string;
  to: string;
  next: string;
  /** How the course meets it: a chapter's own move, an authored deviation, or a sideline lesson. */
  kind: 'line' | 'branch' | 'sideline';
  /** The move the course plays most from here. */
  main: boolean;
  sev?: Severity;
  why?: string;
  name?: string;
  ev?: number;
  mate?: number;
  /** Percent of club games reaching this position that go this way. */
  club?: number;
  teach: Teach[];
  /** Reaches a position the course first meets by another move order. */
  transposes: boolean;
}

export interface XNode {
  fen: string;
  toMove: Turn;
  /** The move that first reaches it in the course. */
  san: string;
  num: string;
  from: string | null;
  to: string | null;
  check?: boolean;
  note?: string | null;
  ev?: number;
  mate?: number;
  mark?: Mark;
  parent: string | null;
  depth: number;
  /** The learner moves here, so it's a Recall card. */
  ask: boolean;
  moves: XMove[];
  /** The authored moves the course chose against, at the learner's turn. */
  alts?: YourAlternative[];
}

export interface Shape {
  root: string;
  side: Turn;
  nodes: Record<string, XNode>;
  /** The positions below each one along the course's own move order, itself first. */
  children: Record<string, string[]>;
}

/** A course's club numbers: by position key, the count of each reply by SAN. */
export type ClubIndex = Map<string, Map<string, number>>;

export interface ClubSource {
  source?: string;
  games?: number;
  elo?: [number, number];
}

const bare = (san: string) => san.replace(/[+#?!]+$/, '');

/** A position key from a FEN or EPD: the board as 64 squares, then the side to move. */
export function keyFromFen(fen: string) {
  const [board, turn] = fen.trim().split(/\s+/);
  if (!board || !/^[wb]$/.test(turn ?? '')) return null;
  const squares = board.replace(/\//g, '').replace(/\d/g, (d) => '.'.repeat(Number(d)));
  return squares.length === 64 ? squares + turn : null;
}

/**
 * Reads a club file: `positions`, by position key or FEN, each a count of the replies played by
 * SAN (a number, or an object carrying `games`, `n` or `count`). Anything else is skipped, so a
 * file in a shape this doesn't know yields no numbers rather than wrong ones.
 */
export function clubIndex(raw: unknown): ClubIndex {
  const out: ClubIndex = new Map();
  const positions = (raw as { positions?: unknown } | null)?.positions;
  if (!positions || typeof positions !== 'object') return out;
  for (const [where, replies] of Object.entries(positions as Record<string, unknown>)) {
    const key = /^[.pnbrqkPNBRQK]{64}[wb]$/.test(where) ? where : keyFromFen(where);
    if (!key || !replies || typeof replies !== 'object') continue;
    const counts = new Map<string, number>();
    for (const [san, v] of Object.entries(replies as Record<string, unknown>)) {
      const n =
        typeof v === 'number'
          ? v
          : v && typeof v === 'object'
            ? Number((v as Record<string, unknown>).games ?? (v as Record<string, unknown>).n ?? (v as Record<string, unknown>).count)
            : NaN;
      if (Number.isFinite(n) && n > 0) counts.set(bare(san), (counts.get(bare(san)) ?? 0) + n);
    }
    if (counts.size) out.set(key, counts);
  }
  return out;
}

const cache = new WeakMap<Opening, Map<Colour, Shape>>();

/** The course's tree from one chair, with who teaches each move: the same for every learner. */
export function courseShape(op: Opening, side: Colour): Shape {
  let bySide = cache.get(op);
  if (!bySide) cache.set(op, (bySide = new Map()));
  const known = bySide.get(side);
  if (known) return known;

  const { tree, parent, alternatives } = pathsFor(op, side);
  const you = turnOf(side);

  const teach = new Map<string, Teach[]>();
  const add = (from: string, to: string, t: Teach) => {
    const id = `${from}>${to}`;
    const list = teach.get(id) ?? [];
    const same = list.find((x) => x.slug === t.slug);
    if (!same) list.push({ ...t, steps: [...t.steps] });
    else for (const s of t.steps) if (!same.steps.includes(s)) same.steps.push(s);
    teach.set(id, list);
  };
  op.lines.forEach((line, index) => {
    if (lineSide(op, line) !== side) return;
    const chapter = { slug: line.slug, name: line.name, kind: 'chapter' as const, index };
    line.plies.forEach((p, i) => {
      const next = line.plies[i + 1];
      if (next) add(positionKey(p), positionKey(next), { ...chapter, steps: ['learn', 'drill'] });
      // The learner's own alternatives aren't in the tree: only the opponent's deviations are.
      if (toMove(p) === you) return;
      for (const b of alternativesAt(op, line, i)) {
        let prev = positionKey(p);
        for (const q of b.plies) {
          add(prev, positionKey(q), { ...chapter, steps: ['quiz'] });
          prev = positionKey(q);
        }
      }
    });
  });
  for (const s of op.sidelines?.items ?? []) {
    if (!s.line || lineSide(op, s.line) !== side) continue;
    const index = s.chapter ? op.lines.findIndex((l) => l.slug === s.chapter) : -1;
    const lesson: Teach = { slug: s.slug, name: s.name ?? s.num, kind: 'sideline', index: index < 0 ? null : index, steps: ['learn', 'drill'] };
    const plies = s.line.plies;
    for (let k = (s.line.start ?? 0) + 1; k < plies.length; k++) add(positionKey(plies[k - 1]), positionKey(plies[k]), lesson);
  }

  const nodes: Shape['nodes'] = {};
  const children: Shape['children'] = {};
  const depthOf = (key: string): number => {
    let d = 0;
    for (let k = key; parent.has(k); k = parent.get(k)!.from) d++;
    return d;
  };
  for (const [key, n] of Object.entries(tree.nodes)) {
    const via = parent.get(key);
    const heaviest = n.moves.reduce<(typeof n.moves)[number] | null>((a, e) => (!a || e.w > a.w ? e : a), null);
    const moves = n.moves.map((e): XMove => {
      const by = teach.get(`${key}>${e.next}`) ?? [];
      const target = tree.nodes[e.next];
      const kind = by.some((t) => t.kind === 'chapter' && t.steps.includes('learn'))
        ? 'line'
        : by.some((t) => t.kind === 'chapter')
          ? 'branch'
          : 'sideline';
      return {
        san: e.san,
        num: e.num,
        from: e.from,
        to: e.to,
        next: e.next,
        kind,
        main: e === heaviest,
        sev: e.sev,
        why: e.why,
        name: e.name,
        ev: target?.ev ?? n.verdicts?.[e.from + e.to]?.[1],
        mate: target ? target.mate : n.verdicts?.[e.from + e.to]?.[3],
        teach: by.sort((a, b) => teachRank(a) - teachRank(b)),
        transposes: parent.get(e.next)?.from !== key,
      };
    });
    nodes[key] = {
      fen: n.fen,
      toMove: n.toMove,
      san: via?.san ?? '',
      num: via?.num ?? '',
      from: via?.move.from ?? null,
      to: via?.move.to ?? null,
      check: n.check,
      note: n.note,
      ev: n.ev,
      mate: n.mate,
      mark: n.mark,
      parent: via?.from ?? null,
      depth: depthOf(key),
      ask: n.toMove === you && n.moves.length > 0,
      moves,
      alts: alternatives.get(key),
    };
  }
  for (const [key, n] of Object.entries(nodes)) {
    children[key] = n.moves
      .filter((m) => !m.transposes)
      .sort((a, b) => moveRank(a) - moveRank(b))
      .map((m) => m.next);
  }

  const shape = { root: tree.root, side: you, nodes, children };
  bySide.set(side, shape);
  return shape;
}

function teachRank(t: Teach) {
  return (t.kind === 'chapter' ? 0 : 1000) + (t.steps.includes('learn') ? 0 : 500) + (t.index ?? 999);
}

/** The order the map follows a position's moves in: the chapters' own moves in course order, then their deviations, then sidelines. */
function moveRank(m: XMove) {
  return m.teach[0] ? teachRank(m.teach[0]) : 5_000;
}

/** The club numbers for a tree's moves: from the club file, else the sideline rows that carry them. */
export function clubShares(shape: Shape, op: Opening, club: ClubIndex | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, n] of Object.entries(shape.nodes)) {
    const counts = club?.get(key);
    if (!counts) continue;
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    for (const m of n.moves) {
      const c = counts.get(bare(m.san));
      out[`${key}>${m.next}`] = c ? Math.round((c / total) * 1000) / 10 : 0;
    }
  }
  if (!club?.size) {
    for (const s of op.sidelines?.items ?? []) {
      for (const [key, n] of Object.entries(shape.nodes)) {
        const m = n.moves.find((e) => shape.nodes[e.next]?.fen === s.fen && e.from === s.from && e.to === s.to);
        if (m) out[`${key}>${m.next}`] = s.pct;
      }
    }
  }
  return out;
}

/* ---------- memory ---------- */

export interface CardFacts extends CardState {
  position_key: string;
}

export interface MissFacts {
  misses: number;
  hits: number;
}

const DAY_MS = 86_400_000;

/** What the deck says about one position. `endOfToday` is when the learner's day ends. */
export function positionMemory(card: CardState | null, miss: MissFacts | null, now: Date, endOfToday: Date): PositionMemory {
  const misses = miss?.misses ?? 0;
  const hits = miss?.hits ?? 0;
  if (!card) return { level: 'none', weak: misses > hits, odds: null, misses, hits, dueIn: null };
  const due = card.due < endOfToday;
  return {
    level: strengthOf(card),
    weak: (card.reps > 0 && due) || misses > hits,
    odds: card.reps ? Math.round(recallOdds(card, now) * 100) : null,
    misses,
    hits,
    dueIn: due ? 0 : Math.ceil((card.due.getTime() - endOfToday.getTime()) / DAY_MS),
  };
}

/** Per position, the tally of every learner position from there down the course's move order. */
export function subtreeTallies(shape: Shape, memory: Record<string, PositionMemory>) {
  const out: Record<string, Tally> = {};
  const visit = (key: string): Tally => {
    if (out[key]) return out[key];
    const t = emptyTally();
    const n = shape.nodes[key];
    if (n.ask) {
      const m = memory[key];
      t[m?.level ?? 'none']++;
      if (m?.weak) t.weak++;
    }
    for (const c of shape.children[key] ?? []) addTally(t, visit(c));
    out[key] = t;
    return t;
  };
  if (shape.root) visit(shape.root);
  return out;
}

/* ---------- the branch map ---------- */

export interface BranchRow {
  /** The position the row's first move reaches. */
  start: string;
  /** The move that opens the row, as a scoresheet entry. */
  label: string;
  /** Its learner positions, in order; `col` is the move number less one. */
  cells: { key: string; col: number }[];
  depth: number;
}

export interface BranchGroup {
  id: string;
  title: string;
  /** The chapter's place in the course, when the group is a chapter. */
  index: number | null;
  rows: BranchRow[];
}

/**
 * The whole tree as rows to scan for weak spots: each row follows one line until it ends, and
 * every other move along the way opens a row of its own. Rows are grouped by the chapter that
 * teaches their first move, sidelines apart, so a long course folds into chapters.
 */
export function branchMap(shape: Shape, op: Opening): BranchGroup[] {
  const groups = new Map<string, BranchGroup>();
  const chair = shape.side === 'w' ? 'white' : 'black';
  const groupOf = (via: XMove | null): BranchGroup => {
    const t = via?.teach[0];
    // Sidelines get a group of their own: they're optional, and a chapter's would drown in them.
    const line = t?.kind === 'sideline' ? null : t?.index != null ? op.lines[t.index] : op.lines.find((l) => lineSide(op, l) === chair);
    const id = line?.slug ?? 'sidelines';
    let g = groups.get(id);
    if (!g) {
      const index = line ? op.lines.indexOf(line) : null;
      groups.set(id, (g = { id, title: line?.name ?? 'When they leave the line', index, rows: [] }));
    }
    return g;
  };
  const col = (key: string) => Math.floor(shape.nodes[key].depth / 2);

  const stack: { start: string; via: XMove | null }[] = shape.root ? [{ start: shape.root, via: null }] : [];
  const rows: { row: BranchRow; via: XMove | null }[] = [];
  while (stack.length) {
    const { start, via } = stack.shift()!;
    const row: BranchRow = { start, label: via?.num ?? 'Start', cells: [], depth: shape.nodes[start].depth };
    const opened: { start: string; via: XMove | null }[] = [];
    for (let key: string | undefined = start; key; ) {
      if (shape.nodes[key].ask) row.cells.push({ key, col: col(key) });
      const [next, ...others]: (string | undefined)[] = shape.children[key] ?? [];
      const n: XNode = shape.nodes[key];
      for (const o of others) opened.push({ start: o!, via: n.moves.find((m) => m.next === o)! });
      key = next;
    }
    if (row.cells.length) rows.push({ row, via });
    stack.unshift(...opened);
  }
  for (const { row, via } of rows) groupOf(via).rows.push(row);
  // Within a group, rows read as a staircase: the earlier a row leaves, the higher it sits.
  for (const g of groups.values()) g.rows.sort((a, b) => a.depth - b.depth);
  return [...groups.values()].sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
}

/** The moves from the start to a position, as SAN, along the course's own move order. */
export function sanPath(shape: Shape, key: string) {
  const sans: string[] = [];
  for (let k = key; shape.nodes[k]?.parent; k = shape.nodes[k].parent!) sans.unshift(shape.nodes[k].san);
  return sans;
}

/** The positions a list of SAN moves walks through from the start, as far as the tree has them. */
export function walkSans(shape: Shape, sans: string[]) {
  const keys = shape.root ? [shape.root] : [];
  for (const san of sans) {
    const at = shape.nodes[keys.at(-1)!];
    const m = at?.moves.find((e) => e.san === san);
    if (!m) break;
    keys.push(m.next);
  }
  return keys;
}

