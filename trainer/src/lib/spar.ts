import { alternativesAt, buildTree, lineSide, positionKey, toMove, turnOf, yourMoveIndexes, type Tree, type TreeEdge } from './course.ts';
import type { Colour, Opening } from './types.ts';

/* The sparring partner: a club opponent that plays the learner's opening the way 1200-2000 rated
   Lichess players do. Its choices come from club/<id>.json, which club-moves.py counted and the
   build shipped with each move's squares and what it changes on the board. Nothing here plays
   chess: a move the course goes on from is a tree edge, and one it doesn't carries its own board.
   Pure, so tests/spar.test.ts can drive it with its own dice. */

/** SAN, club games, from+to, the squares the move changes ("e2.e4P": square then what stands
    there after) and whether it gives check. */
export type ClubMove = [san: string, games: number, uci: string, diff: string, check: 0 | 1];

export interface ClubBook {
  source: string;
  generated: string;
  scanned: number;
  games: number;
  elo: [number, number];
  positions: Record<string, ClubMove[]>;
  /** The engine's reply after club moves that leave the course, by the position they reach (exits.py). */
  answers?: Record<string, EngineAnswer>;
}

/** Stockfish's choice where the course ends: searched ahead of time, never course theory. */
export interface EngineAnswer {
  num: string;
  from: string;
  to: string;
  /** White's centipawns, best play. */
  ev: number;
  mate?: number;
  /** A short line from the move on, as a scoresheet. */
  line: string;
}

/** Club games at a position below which its shares are noise, and the opponent follows the course. */
export const THIN = 20;

/** A move the course carries on from. */
export interface Reply {
  san: string;
  num: string;
  from: string;
  to: string;
  /** Club games that chose it here. */
  games: number;
  /** Its weight in the draw: the club games, or the course's own weight when forced or thin. */
  w: number;
  next: string;
  sev?: TreeEdge['sev'];
  name?: string;
}

/** A move the course has nothing after: where the opponent leaves the learner's prep. */
export interface Leave {
  san: string;
  num: string;
  from: string;
  to: string;
  games: number;
  fen: string;
  check: boolean;
  /** The course names this move but has no answer to it. */
  known: boolean;
  sev?: TreeEdge['sev'];
  name?: string;
}

export interface Choice {
  /** One of the opening's own first moves: the course plays nothing else here. */
  forced?: boolean;
  /** Too few club games get this far, so the opponent picks among the course's moves. */
  thin?: boolean;
  /** Club games reaching the position. */
  total: number;
  replies: Reply[];
  /** Club moves that leave the course, weighted by their games. */
  out: ClubMove[];
}

export interface StudyLine {
  slug: string;
  name: string;
  sideline: boolean;
  /** Reached through one of the chapter's opponent deviations, which its Quiz asks. */
  deviation?: boolean;
}

export interface SparBook {
  tree: Tree;
  choices: Record<string, Choice>;
  /** Where to study a position: an index into `lines`, the first chapter (or else sideline) to play it. */
  study: Record<string, number>;
  lines: StudyLine[];
  /** The most moves of the learner's any chapter from this chair has: a full game's depth. */
  longest: number;
  elo: [number, number];
  /** The engine's reply after each move that leaves the course, keyed by the position it reaches. */
  answers: Record<string, EngineAnswer>;
}

/** "4." or "3...", for a move from a position reached by `num` ("3.Bf4") with `toMove` to play. */
export function nextNumber(num: string, toMove: 'w' | 'b') {
  const n = Number(num.match(/^(\d+)/)?.[1] ?? 0);
  return toMove === 'b' ? `${n}...` : `${n + 1}.`;
}

/** Positions every chapter from this chair passes through: the opening the learner chose to play. */
function sharedOpening(op: Opening, side: Colour) {
  const lines = op.lines.filter((l) => lineSide(op, l) === side);
  const keys = new Set<string>();
  if (!lines.length) return keys;
  for (let i = 0; lines.every((l) => l.plies[i] && positionKey(l.plies[i]) === positionKey(lines[0].plies[i])); i++) {
    keys.add(positionKey(lines[0].plies[i]));
  }
  return keys;
}

export function choiceAt(tree: Tree, key: string, club: ClubMove[] | undefined, opening: Set<string>): Choice {
  const node = tree.nodes[key];
  const goesOn = (e: TreeEdge) => tree.nodes[e.next].moves.length > 0;
  const course = node.moves.filter(goesOn);
  const counted = club ?? [];
  const total = counted.reduce((n, m) => n + m[1], 0);
  const gamesOf = (e: TreeEdge) => counted.find((m) => m[2] === e.from + e.to)?.[1] ?? 0;
  const reply = (e: TreeEdge, w: number): Reply => ({
    san: e.san,
    num: e.num,
    from: e.from,
    to: e.to,
    games: gamesOf(e),
    w,
    next: e.next,
    sev: e.sev,
    name: e.name,
  });
  if (opening.has(key) && course.length === 1) return { forced: true, total, replies: [reply(course[0], 1)], out: [] };
  if (total < THIN) return { thin: true, total, replies: course.map((e) => reply(e, e.w)), out: [] };
  const goes = new Set(course.map((e) => e.from + e.to));
  const replies = course.filter((e) => gamesOf(e) > 0).map((e) => reply(e, gamesOf(e)));
  const out: ClubMove[] = [];
  for (const m of counted) {
    if (goes.has(m[2])) continue;
    // A move order the course doesn't write down can still reach a position it teaches.
    const next = afterKey(node, m[3]);
    if (tree.nodes[next]?.moves.length && !node.moves.some((e) => e.from + e.to === m[2])) {
      replies.push({ san: m[0], num: `${nextNumber(node.num, node.toMove)}${m[0]}`, from: m[2].slice(0, 2), to: m[2].slice(2, 4), games: m[1], w: m[1], next });
    } else {
      out.push(m);
    }
  }
  return { total, replies, out };
}

const FILES = 'abcdefgh';

/** The board a move reaches, laid out from the squares it changes. */
function applyDiff(fen: string, diff: string) {
  const board = fen.split('');
  for (let i = 0; i + 3 <= diff.length; i += 3) board[(8 - Number(diff[i + 1])) * 8 + FILES.indexOf(diff[i])] = diff[i + 2];
  return board.join('');
}

function afterKey(node: Tree['nodes'][string], diff: string) {
  return applyDiff(node.fen, diff) + (node.toMove === 'w' ? 'b' : 'w');
}

export type Drawn = { kind: 'on'; reply: Reply } | { kind: 'off'; move: ClubMove };

/** The opponent's move: a draw weighted by club games. `rand` returns [0, 1), as Math.random does. */
export function pickReply(choice: Choice, rand: () => number): Drawn {
  const total = choice.replies.reduce((n, r) => n + r.w, 0) + choice.out.reduce((n, m) => n + m[1], 0);
  let left = rand() * total;
  for (const reply of choice.replies) {
    left -= reply.w;
    if (left < 0) return { kind: 'on', reply };
  }
  for (const move of choice.out) {
    left -= move[1];
    if (left < 0) return { kind: 'off', move };
  }
  return choice.out.length
    ? { kind: 'off', move: choice.out[choice.out.length - 1] }
    : { kind: 'on', reply: choice.replies[choice.replies.length - 1] };
}

/** The engine's reply to a move that left the course, when exits.py searched it. */
export function answerTo(book: Pick<SparBook, 'answers'>, leave: Pick<Leave, 'fen'>, you: 'w' | 'b'): EngineAnswer | null {
  return book.answers[leave.fen + you] ?? null;
}

/** The move that leaves the course, with the board it reaches. */
export function leaving(tree: Tree, key: string, [san, games, uci, diff, check]: ClubMove): Leave {
  const node = tree.nodes[key];
  const edge = node.moves.find((e) => e.from + e.to === uci);
  return {
    san,
    num: edge?.num ?? `${nextNumber(node.num, node.toMove)}${san}`,
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    games,
    fen: applyDiff(node.fen, diff),
    check: check === 1,
    known: !!edge,
    sev: edge?.sev,
    name: edge?.name,
  };
}

/** A club move's share of the games reaching its position, as a whole percent (never 0 for a move played). */
export function shareOf(reply: Pick<Reply, 'games'>, choice: Pick<Choice, 'total'>) {
  if (!choice.total || !reply.games) return null;
  return Math.max(1, Math.round((100 * reply.games) / choice.total));
}

export function sparBook(op: Opening, side: Colour, club: ClubBook): SparBook {
  const tree = buildTree(op, side);
  const you = turnOf(side);
  const opening = sharedOpening(op, side);
  const choices: SparBook['choices'] = {};
  const answers: SparBook['answers'] = {};
  for (const [key, node] of Object.entries(tree.nodes)) {
    if (node.toMove === you || !node.moves.length) continue;
    choices[key] = choiceAt(tree, key, club.positions[key], opening);
    for (const m of choices[key].out) {
      const after = afterKey(node, m[3]);
      const answer = club.answers?.[after];
      if (answer) answers[after] = answer;
    }
  }

  const lines: StudyLine[] = [];
  const study: SparBook['study'] = {};
  const own = (plies: Opening['lines'][number]['plies'], line: StudyLine) => {
    const at = lines.push(line) - 1;
    for (const p of plies) study[positionKey(p)] ??= at;
  };
  for (const line of op.lines) {
    if (lineSide(op, line) === side) own(line.plies, { slug: line.slug, name: line.name, sideline: false });
  }
  for (const s of op.sidelines?.items ?? []) {
    // From the reply on: the position it leaves from belongs to whatever taught the way there.
    if (s.line && lineSide(op, s.line) === side) own(s.line.plies.slice((s.line.start ?? 0) + 1), { slug: s.slug, name: s.line.name, sideline: true });
  }
  for (const line of op.lines) {
    if (lineSide(op, line) !== side) continue;
    const plies = line.plies.flatMap((p, i) => (toMove(p) === you ? [] : alternativesAt(op, line, i).flatMap((b) => b.plies)));
    if (plies.length) own(plies, { slug: line.slug, name: line.name, sideline: false, deviation: true });
  }
  const longest = Math.max(1, ...op.lines.filter((l) => lineSide(op, l) === side).map((l) => yourMoveIndexes(l, side).length));
  return { tree, choices, study, lines, longest, elo: club.elo, answers };
}

/** The book as the sparring page sends it: only what the game reads. The board takes moves only
    where the learner is to move, so only there does a position keep its legal moves; a position's
    note is said after the learner's move into it, so only those keep theirs. The wrong-move
    verdicts (a score for every legal move, most of the book) come a position at a time from
    /api/spar/[id]/verdicts as the learner reaches it. */
export function forBrowser(book: SparBook): SparBook {
  const you = book.tree.side;
  const nodes: Tree['nodes'] = {};
  for (const [key, { legal, verdicts: _verdicts, note, moves, ...node }] of Object.entries(book.tree.nodes)) {
    const mine = node.toMove === you;
    nodes[key] = {
      ...node,
      ...(mine ? { legal } : { note }),
      moves: moves.map(({ why: _why, ...edge }) => edge),
    };
  }
  return { ...book, tree: { ...book.tree, nodes } };
}

export interface Opponent {
  id: string;
  name: string;
  blurb: string;
}

/** Who's across the board. Flavour only: every one of them plays the same club numbers. */
export const OPPONENTS: Opponent[] = [
  { id: 'marta', name: 'Marta', blurb: 'Thursday club night regular. Never offers a draw.' },
  { id: 'kofi', name: 'Kofi', blurb: 'Plays blitz on the bus. Moves fast, thinks later.' },
  { id: 'ines', name: 'Inès', blurb: 'Reads one opening book a year, cover to cover.' },
  { id: 'raj', name: 'Raj', blurb: 'Loves a pawn grab. Will take anything you leave.' },
  { id: 'olek', name: 'Olek', blurb: 'Coaches juniors on Saturdays. Hates losing to them.' },
  { id: 'sunny', name: 'Sunny', blurb: 'Online every night. Rarely the same move twice.' },
];

export function pickOpponent(rand: () => number, not?: string) {
  const pool = OPPONENTS.filter((o) => o.id !== not);
  return pool[Math.floor(rand() * pool.length)] ?? OPPONENTS[0];
}

export const LIVES = 3;
