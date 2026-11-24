import { alternativesAt, lineSide, positionKey, sidesTaught, toMove, turnOf, type Tree, type TreeNode } from './course.ts';
import { verdictOf, verdictWords } from './engineView.ts';
import { treeFor, yourAlternatives } from './recall.ts';
import type { Colour, Opening, Ply, Severity, Turn } from './types.ts';

/* The learner's own games against the course. A game is walked by SAN down the same tree free
   practice plays (chapters, the authored deviations and their answers, and the sidelines), so
   "in book" means exactly what the trainer teaches. Nothing is searched or judged here: where the
   game left, the course's move and the shipped engine verdict are all looked up. Pure, so
   tests/games.test.ts drives it against the real compiled course. */

export type Site = 'lichess' | 'chesscom';
export type Result = 'win' | 'draw' | 'loss';

export const SITE_NAME: Record<Site, string> = { lichess: 'Lichess', chesscom: 'Chess.com' };

export interface ImportedGame {
  site: Site;
  id: string;
  url: string;
  playedAt: Date;
  colour: Colour;
  result: Result;
  opponent: string;
  opponentRating: number | null;
  rating: number | null;
  speed: string;
  /** The site's own name for the opening, for games no course covers. */
  openingName: string | null;
  moves: string[];
  /** The positions the moves reach, where the server has replayed them. */
  positions?: GamePosition[];
}

/** A move as the sites and the course both write it, less check marks and annotation. */
export const bareSan = (san: string) => san.replace(/[+#!?]+$/, '');

/** "5.c3" or "5...c6" for the move at `ply` (0 is White's first move). */
export function moveNum(ply: number, san: string) {
  return `${Math.floor(ply / 2) + 1}${ply % 2 ? '...' : '.'}${san}`;
}

const FILES = 'abcdefgh';
const squareIndex = (sq: string) => (8 - Number(sq[1])) * 8 + FILES.indexOf(sq[0]);

export interface Arrow {
  from: string;
  to: string;
}

/**
 * The squares a SAN move goes between, read off the position's shipped legal moves: the piece
 * letter, destination and any disambiguation must pick out exactly one of them. No move is
 * generated, so a position without `legal` gives null.
 */
export function resolveSan(position: Pick<TreeNode, 'fen' | 'toMove' | 'legal'>, san: string): Arrow | null {
  const legal = position.legal;
  if (!legal) return null;
  const records = new Set<string>();
  for (let i = 0; i + 4 <= legal.length; i += 4) records.add(legal.slice(i, i + 4));
  const s = bareSan(san);
  const back = position.toMove === 'w' ? '1' : '8';
  if (s === 'O-O' || s === 'O-O-O') {
    const to = `${s === 'O-O' ? 'g' : 'c'}${back}`;
    return records.has(`e${back}${to}`) ? { from: `e${back}`, to } : null;
  }
  const m = s.match(/^([NBRQK])?([a-h])?([1-8])?x?([a-h][1-8])(?:=?[NBRQ])?$/);
  if (!m) return null;
  const [, piece = 'P', file, rank, to] = m;
  const mine = position.toMove === 'w' ? piece : piece.toLowerCase();
  const hits = [...records].filter(
    (r) => r.slice(2) === to && position.fen[squareIndex(r)] === mine && (!file || r[0] === file) && (!rank || r[1] === rank),
  );
  return hits.length === 1 ? { from: hits[0].slice(0, 2), to } : null;
}

/* ---------- one course, one chair ---------- */

interface Teaches {
  slug: string;
  name: string;
  sideline: boolean;
}

interface Course {
  op: Opening;
  side: Colour;
  tree: Tree;
  /** Moves the chapters themselves play, as "from>to" position keys. */
  chapter: Set<string>;
  /** The opponent's authored deviations from the chapters, by the same edge id. */
  authored: Map<string, { sev: Severity; name?: string }>;
  /** The opponent move a sideline's lesson opens with, as the same edge id, to its slug. */
  sidelineAt: Map<string, string>;
  /** Every line that asks the learner for a move at a position, chapters first. */
  teaches: Map<string, Teaches[]>;
}

const courses = new WeakMap<Opening, Map<Colour, Course>>();
const edgeId = (from: string, to: string) => `${from}>${to}`;

function courseFor(op: Opening, side: Colour): Course {
  let bySide = courses.get(op);
  if (!bySide) courses.set(op, (bySide = new Map()));
  let course = bySide.get(side);
  if (course) return course;

  const you = turnOf(side);
  const chapter = new Set<string>();
  const authored: Course['authored'] = new Map();
  const sidelineAt = new Map<string, string>();
  const teaches = new Map<string, Teaches[]>();
  const teach = (plies: Ply[], from: number, t: Teaches) => {
    for (let i = from; i + 1 < plies.length; i++) {
      if (toMove(plies[i]) !== you) continue;
      const key = positionKey(plies[i]);
      const list = teaches.get(key) ?? [];
      if (!list.some((x) => x.slug === t.slug)) list.push(t);
      teaches.set(key, list);
    }
  };
  for (const line of op.lines) {
    if (lineSide(op, line) !== side) continue;
    line.plies.forEach((p, i) => {
      if (i) chapter.add(edgeId(positionKey(line.plies[i - 1]), positionKey(p)));
      if (toMove(p) === you) return;
      for (const b of alternativesAt(op, line, i)) {
        const id = edgeId(positionKey(p), positionKey(b.plies[0]));
        if (!authored.has(id)) authored.set(id, { sev: b.sev, name: b.name });
      }
    });
    teach(line.plies, 0, { slug: line.slug, name: line.name, sideline: false });
  }
  for (const s of op.sidelines?.items ?? []) {
    const line = s.line;
    if (!line || lineSide(op, line) !== side) continue;
    const start = line.start ?? 0;
    if (line.plies[start + 1]) sidelineAt.set(edgeId(positionKey(line.plies[start]), positionKey(line.plies[start + 1])), s.slug);
    teach(line.plies, start, { slug: s.slug, name: s.name ?? line.name, sideline: true });
  }
  course = { op, side, tree: treeFor(op, side), chapter, authored, sidelineAt, teaches };
  bySide.set(side, course);
  return course;
}

/* ---------- walking a game ---------- */

export type Outcome = 'you' | 'them' | 'end' | 'over';

/** The first move the opponent made off the chapters, and whether the course has it. */
export interface Met {
  /** Index of the move in the game. */
  ply: number;
  /** The position it was played from. */
  key: string;
  san: string;
  num: string;
  kind: 'branch' | 'sideline' | 'uncovered';
  slug?: string;
  sev?: Severity;
  name?: string;
}

/** A position the game reached, from the site's moves replayed on the server. */
export interface GamePosition {
  key: string;
  fen: string;
  from: string;
  to: string;
  check: boolean;
}

/** A position on the game's way through the course. */
export interface Step {
  key: string;
  fen: string;
  san: string;
  num: string;
  from: string | null;
  to: string | null;
  check?: boolean;
  /** In the course's tree; false for the moves of a detour that came back to it. */
  book: boolean;
}

export interface Walk {
  openingId: string;
  side: Colour;
  /** The start, then the position after each move up to where the game left the course. */
  steps: Step[];
  /**
   * you: the learner played a move the course doesn't; them: the opponent did; end: the course had
   * nothing further and the game went on; over: the game finished inside the course.
   */
  outcome: Outcome;
  /** The game's move at the point it left, for you and them. */
  played: string | null;
  /** Moves that left the course for a while and came back to it by another move order. */
  detours: { from: number; to: number }[];
  sidelines: string[];
  met: Met | null;
  /** A course the learner doesn't study that follows this game further. */
  cover?: string;
}

export const depthOf = (w: Walk) => w.steps.length - 1;
export const exitKey = (w: Walk) => w.steps.at(-1)!.key;

/**
 * Follows a game down the course. With the game's positions it goes by position, so a move order
 * the course doesn't draw still counts when it lands somewhere the course has been, and a few moves
 * off the course that come back to it are a detour, not an exit. Without them it goes by SAN.
 */
export function walkCourse(op: Opening, side: Colour, moves: string[], positions: GamePosition[] = []): Walk {
  const c = courseFor(op, side);
  const nodes = c.tree.nodes;
  const you = turnOf(side);
  const start = nodes[c.tree.root];
  const steps: Step[] = [{ key: c.tree.root, fen: start.fen, san: '', num: '', from: null, to: null, book: true }];
  const detours: Walk['detours'] = [];
  const sidelines: string[] = [];
  let met: Met | null = null;
  let key = c.tree.root;
  const fromGame = (j: number, book: boolean): Step => ({
    key: positions[j].key,
    fen: positions[j].fen,
    san: moves[j],
    num: moveNum(j, moves[j]),
    from: positions[j].from,
    to: positions[j].to,
    check: positions[j].check,
    book,
  });

  for (let i = 0; i < moves.length; ) {
    const node = nodes[key];
    const pos = positions[i];
    const san = bareSan(moves[i]);
    const edge = node.moves.find((e) => (pos ? e.next === pos.key : bareSan(e.san) === san));
    if (edge) {
      const id = edgeId(key, edge.next);
      const slug = c.sidelineAt.get(id);
      if (slug) sidelines.push(slug);
      if (!met && node.toMove !== you && !c.chapter.has(id)) {
        const a = c.authored.get(id);
        met = { ply: i, key, san: edge.san, num: edge.num, kind: slug ? 'sideline' : 'branch', slug, sev: a?.sev ?? edge.sev, name: a?.name ?? edge.name };
      }
      const n = nodes[edge.next];
      steps.push({ key: edge.next, fen: n.fen, san: edge.san, num: edge.num, from: edge.from, to: edge.to, check: n.check, book: true });
      key = edge.next;
      i++;
      continue;
    }
    if (pos && nodes[pos.key]) {
      steps.push(fromGame(i, true));
      key = pos.key;
      i++;
      continue;
    }
    const back = pos ? positions.findIndex((p, j) => j > i && !!nodes[p.key]) : -1;
    if (back < 0) break;
    detours.push({ from: i, to: back });
    for (let j = i; j <= back; j++) steps.push(fromGame(j, j === back));
    key = positions[back].key;
    i = back + 1;
  }

  const at = steps.length - 1;
  const node = nodes[key];
  const outcome: Outcome = at >= moves.length ? 'over' : !node.moves.length ? 'end' : node.toMove === you ? 'you' : 'them';
  const played = outcome === 'you' || outcome === 'them' ? moves[at] : null;
  if (outcome === 'them' && !met) met = { ply: at, key, san: played!, num: moveNum(at, played!), kind: 'uncovered' };
  return { openingId: op.id, side, steps, outcome, played, detours, sidelines, met };
}

/** Plies a game must share with a course the learner doesn't study before it's offered as theirs. */
const SUGGEST_DEPTH = 6;

/**
 * The course this game follows furthest. Courses the learner studies come first: leaving the
 * London is about the London even when a trap course happens to share a move more. A studied
 * course counts once the learner has played their first move of it, since picking a different
 * first move is choosing another opening, not forgetting this one. Any other course needs a few
 * moves in common before it's suggested, or every 1.e4 game would be "a Ruy Lopez".
 */
export function matchGame(
  openings: Opening[],
  studied: Set<string>,
  colour: Colour,
  moves: string[],
  positions?: GamePosition[],
): Walk | null {
  const first = colour === 'white' ? 1 : 2;
  let best: Walk | null = null;
  let bestStudied = false;
  let other: Walk | null = null;
  for (const op of openings) {
    if (!sidesTaught(op).includes(colour)) continue;
    const isStudied = studied.has(op.id);
    const w = walkCourse(op, colour, moves, positions);
    if (depthOf(w) < (isStudied ? first : SUGGEST_DEPTH)) continue;
    if (!isStudied && (!other || depthOf(w) > depthOf(other))) other = w;
    if (!best || (isStudied && !bestStudied) || (isStudied === bestStudied && depthOf(w) > depthOf(best))) {
      best = w;
      bestStudied = isStudied;
    }
  }
  if (best && other && bestStudied && depthOf(other) > depthOf(best)) best.cover = other.openingId;
  return best;
}

/* ---------- what it means ---------- */

/** When the learner finished Learn for each chapter or sideline, by opening then slug. */
export type Learned = Map<string, Map<string, Date>>;

export interface Deviation {
  key: string;
  fen: string;
  toMove: Turn;
  /** The course's moves here, commonest first. */
  course: { num: string; arrow: Arrow }[];
  played: { num: string; arrow: Arrow | null };
  /** The engine's words for the move played, where the course ships verdicts. */
  verdict: { title: string; text: string; sev: 'good' | 'inaccuracy' | 'blunder' } | null;
  /** The course chose against this move on purpose, and says why. */
  authored: { sev: Severity; why: string; name?: string } | null;
  teaches: Teaches[];
  /** A chapter or sideline teaching this position that the learner has done Learn for. */
  learnedAt: Date | null;
}

/** The learner's move where the game left the course, set beside what the course plays. */
export function deviationOf(op: Opening, w: Walk, learned?: Map<string, Date>): Deviation | null {
  if (w.outcome !== 'you' || !w.played) return null;
  const c = courseFor(op, w.side);
  const key = exitKey(w);
  const node = c.tree.nodes[key];
  const ply = depthOf(w);
  const san = bareSan(w.played);
  const scored = Object.entries(node.verdicts ?? {}).find(([, v]) => bareSan(v[0]) === san);
  const arrow = scored ? { from: scored[0].slice(0, 2), to: scored[0].slice(2, 4) } : resolveSan(node, w.played);
  const alt = arrow ? yourAlternatives(op, w.side, key).find((a) => a.from === arrow.from && a.to === arrow.to) : undefined;
  const course = [...node.moves].sort((a, b) => b.w - a.w).map((e) => ({ num: e.num, arrow: { from: e.from, to: e.to } }));
  const num = moveNum(ply, w.played);
  const v = arrow ? verdictOf(node, arrow.from, arrow.to, alt?.sev) : null;
  const teaches = c.teaches.get(key) ?? [];
  const dates = teaches.map((t) => learned?.get(t.slug)).filter((d): d is Date => !!d);
  return {
    key,
    fen: node.fen,
    toMove: node.toMove,
    course,
    played: { num, arrow },
    verdict: v ? { ...verdictWords(v, node, num), sev: v.sev } : null,
    authored: alt ? { sev: alt.sev, why: alt.why, name: alt.name } : null,
    teaches,
    learnedAt: dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null,
  };
}

/** The boards from the start to where the game left, for stepping through it. */
export function walkPlies(op: Opening, w: Walk): Ply[] {
  const nodes = courseFor(op, w.side).tree.nodes;
  return w.steps.map((s, i) => {
    const n = s.book ? nodes[s.key] : undefined;
    return {
      san: s.san,
      fen: s.fen,
      from: s.from,
      to: s.to,
      num: s.num,
      turn: i && i % 2 === 0 ? 'b' : 'w',
      check: s.check,
      ev: n?.ev,
      mate: n?.mate,
      // A mark judges the course's move into a position; a transposition got there another way.
      mark: n && n.from === s.from && n.to === s.to ? n.mark : undefined,
    };
  });
}

/** Whether the miss counts against the learner's memory: they had learned the move before this game. */
export const forgot = (d: Deviation, playedAt: Date) => !!d.learnedAt && d.learnedAt <= playedAt;

/* ---------- the report ---------- */

export interface Tally {
  games: number;
  win: number;
  draw: number;
  loss: number;
}

const tally = (): Tally => ({ games: 0, win: 0, draw: 0, loss: 0 });
const count = (t: Tally, r: Result) => {
  t.games++;
  t[r]++;
};
/** Points per game as a percentage, a draw counting half. */
export const scorePct = (t: Tally) => (t.games ? Math.round(((t.win + t.draw / 2) / t.games) * 100) : 0);

export interface Matched {
  game: ImportedGame;
  walk: Walk | null;
  deviation: Deviation | null;
}

export interface Forgotten extends Deviation {
  times: number;
  /** What the learner played instead, commonest first. */
  instead: { num: string; times: number }[];
  lastPlayed: Date;
  /** At least one of these games came after the learner had learned the move. */
  forgot: boolean;
  games: { site: Site; id: string }[];
}

export interface Departure extends Met {
  /** A course the learner doesn't study that has this move. */
  cover?: string;
  fen: string;
  toMove: Turn;
  arrow: Arrow | null;
  times: number;
  /** How the learner scored in these games. */
  results: Tally;
}

export interface CourseReport {
  openingId: string;
  name: string;
  side: Colour;
  studied: boolean;
  engineView: boolean;
  games: Matched[];
  /** Average plies in book. */
  depth: number;
  /** Games where the learner played the course's move every time it had one. */
  knew: Tally;
  /** Games where the learner left the course. */
  left: Tally;
  forgotten: Forgotten[];
  departures: Departure[];
}

export interface Report {
  games: number;
  /** Per course and chair: studied courses first, then by games. */
  courses: CourseReport[];
  /** Games no course follows, by the site's name for the opening family. */
  elsewhere: { name: string; games: number; white: number; black: number }[];
}

/** "Sicilian Defense: Dragon Variation" → "Sicilian Defense". */
const openingFamily = (name: string | null) => name?.split(/[:,]/)[0].trim() || 'Unnamed openings';

export function buildReport(
  games: ImportedGame[],
  openings: Opening[],
  studied: Set<string>,
  learned: Learned,
): { report: Report; matched: Matched[] } {
  const byId = new Map(openings.map((op) => [op.id, op]));
  const matched: Matched[] = games.map((game) => {
    const walk = matchGame(openings, studied, game.colour, game.moves, game.positions);
    const deviation = walk ? deviationOf(byId.get(walk.openingId)!, walk, learned.get(walk.openingId)) : null;
    return { game, walk, deviation };
  });

  const groups = new Map<string, CourseReport>();
  const elsewhere = new Map<string, Report['elsewhere'][number]>();
  for (const m of matched) {
    if (!m.walk) {
      const name = openingFamily(m.game.openingName);
      const e = elsewhere.get(name) ?? { name, games: 0, white: 0, black: 0 };
      e.games++;
      e[m.game.colour]++;
      elsewhere.set(name, e);
      continue;
    }
    const op = byId.get(m.walk.openingId)!;
    const id = `${op.id}|${m.walk.side}`;
    let g = groups.get(id);
    if (!g) {
      g = {
        openingId: op.id,
        name: op.name,
        side: m.walk.side,
        studied: studied.has(op.id),
        engineView: !!op.engineView,
        games: [],
        depth: 0,
        knew: tally(),
        left: tally(),
        forgotten: [],
        departures: [],
      };
      groups.set(id, g);
    }
    g.games.push(m);
    count(m.walk.outcome === 'you' ? g.left : g.knew, m.game.result);

    if (m.deviation) {
      const d = m.deviation;
      let f = g.forgotten.find((x) => x.key === d.key);
      if (!f) {
        f = { ...d, times: 0, instead: [], lastPlayed: m.game.playedAt, forgot: false, games: [] };
        g.forgotten.push(f);
      }
      f.times++;
      f.forgot ||= forgot(d, m.game.playedAt);
      if (m.game.playedAt > f.lastPlayed) f.lastPlayed = m.game.playedAt;
      f.games.push({ site: m.game.site, id: m.game.id });
      const alt = f.instead.find((x) => x.num === d.played.num);
      if (alt) alt.times++;
      else f.instead.push({ num: d.played.num, times: 1 });
    }

    const met = m.walk.met;
    if (met) {
      let dep = g.departures.find((x) => x.key === met.key && bareSan(x.san) === bareSan(met.san));
      if (!dep) {
        const node = courseFor(op, m.walk.side).tree.nodes[met.key];
        const edge = node.moves.find((e) => bareSan(e.san) === bareSan(met.san));
        dep = {
          ...met,
          cover: m.walk.cover,
          fen: node.fen,
          toMove: node.toMove,
          arrow: edge ? { from: edge.from, to: edge.to } : resolveSan(node, met.san),
          times: 0,
          results: tally(),
        };
        g.departures.push(dep);
      }
      dep.times++;
      count(dep.results, m.game.result);
    }
  }

  for (const g of groups.values()) {
    g.depth = g.games.reduce((n, m) => n + depthOf(m.walk!), 0) / g.games.length;
    g.forgotten.sort((a, b) => b.times - a.times || b.lastPlayed.getTime() - a.lastPlayed.getTime());
    for (const f of g.forgotten) f.instead.sort((a, b) => b.times - a.times);
    g.departures.sort((a, b) => b.times - a.times || a.ply - b.ply);
  }
  const courseList = [...groups.values()].sort(
    (a, b) => Number(b.studied) - Number(a.studied) || b.games.length - a.games.length,
  );
  return {
    report: {
      games: games.length,
      courses: courseList,
      elsewhere: [...elsewhere.values()].sort((a, b) => b.games - a.games),
    },
    matched,
  };
}

/**
 * The positions to practise from the learner's games, most often missed first: only in courses
 * they study and in lines they have learned, since Recall asks from memory.
 */
export function practiceKeys(report: Report, openingId?: string) {
  const out: { openingId: string; key: string; times: number }[] = [];
  for (const g of report.courses) {
    if (!g.studied || (openingId && g.openingId !== openingId)) continue;
    for (const f of g.forgotten) if (f.learnedAt) out.push({ openingId: g.openingId, key: f.key, times: f.times });
  }
  return out.sort((a, b) => b.times - a.times);
}
