import { lineBySlug, positionKey } from './course.ts';
import { bareSan, depthOf, exitKey, moveNum, resolveSan, type Arrow, type Deviation, type ImportedGame, type Matched, type Walk } from './games.ts';
import { treeFor, type Run } from './recall.ts';
import type { ClubBook, EngineAnswer } from './spar.ts';
import type { Opening, Ply, Severity } from './types.ts';

/* "How did my opening go?": one imported game read as a prep report. Built on the walk games.ts
   makes; every score, share and answer here is looked up in the shipped course, coaching and club
   files, never worked out. Pure, so tests/games.test.ts drives it against the real course. */

/**
 * you: the learner played a move the course doesn't; new: the opponent did, and the course has
 * nothing there; covered: the opponent left the chapters for a move the course answers, and the
 * game stayed in book from there; book: the chapters held to their end or the game's.
 */
export type PrepKind = 'you' | 'new' | 'covered' | 'book';

export interface Prep {
  kind: PrepKind;
  /** The game move the report turns on: the one that left the chapters, or the last in book. */
  ply: number;
  /** That move as "7...Qb6". */
  num: string;
  /** The move number of the last move still in book. */
  bookTo: number;
  /** The game finished before the course did. */
  over: boolean;
}

/** The move number the ply-th move of a game is played on. */
export const moveNo = (ply: number) => Math.floor(ply / 2) + 1;

export function prepOf(w: Walk, moves: string[]): Prep {
  const depth = depthOf(w);
  const bookTo = moveNo(Math.max(0, depth - 1));
  if (w.outcome === 'you' || w.outcome === 'them') {
    return { kind: w.outcome === 'you' ? 'you' : 'new', ply: depth, num: moveNum(depth, w.played!), bookTo, over: false };
  }
  if (w.met && w.met.kind !== 'uncovered') return { kind: 'covered', ply: w.met.ply, num: w.met.num, bookTo, over: w.outcome === 'over' };
  const last = Math.max(0, depth - 1);
  return { kind: 'book', ply: last, num: moves[last] ? moveNum(last, moves[last]) : '', bookTo, over: w.outcome === 'over' };
}

/** The prep badge a game wears in lists: short enough for a phone row. */
export function prepBadge(p: Prep) {
  switch (p.kind) {
    case 'you':
      return `Left prep at ${p.num}`;
    case 'new':
      return `They left at ${p.num}`;
    case 'covered':
      return `Ready for ${p.num}`;
    case 'book':
      return p.over ? 'In book all game' : `In book to move ${p.bookTo}`;
  }
}

/** Whether the learner's prep held: they never left it first. */
export const held = (p: Prep) => p.kind !== 'you';

/* ---------- across games ---------- */

export interface Leak {
  num: string;
  course: string;
  kind: 'you' | 'new';
  times: number;
  /** The newest game it happened in. */
  game: { site: ImportedGame['site']; id: string };
}

export interface PrepSummary {
  /** Games that reached a course the learner studies. */
  games: number;
  held: number;
  /** Where prep ran out most often, when it happened more than once. */
  leak: Leak | null;
}

/** Games are newest first, as the server reads them. */
export function prepSummary(matched: Matched[], studied: Set<string>, courseName: (id: string) => string): PrepSummary {
  let games = 0;
  let kept = 0;
  const leaks = new Map<string, Leak>();
  for (const m of matched) {
    if (!m.walk || !studied.has(m.walk.openingId)) continue;
    games++;
    const p = prepOf(m.walk, m.game.moves);
    if (held(p)) kept++;
    if (p.kind !== 'you' && p.kind !== 'new') continue;
    const id = `${m.walk.openingId}|${exitKey(m.walk)}|${bareSan(m.walk.played!)}`;
    const leak = leaks.get(id);
    if (leak) leak.times++;
    else leaks.set(id, { num: p.num, course: courseName(m.walk.openingId), kind: p.kind, times: 1, game: { site: m.game.site, id: m.game.id } });
  }
  const top = [...leaks.values()].sort((a, b) => b.times - a.times)[0];
  return { games, held: kept, leak: top && top.times > 1 ? top : null };
}

/** A Recall card's game: the newest game the learner left the course at its position. */
export interface FromGame {
  href: string;
  opponent: string;
  move: number;
}

/** By "openingId|position key", for labelling Recall cards. Games are newest first. */
export function gameOrigins(matched: Matched[]) {
  const out = new Map<string, FromGame>();
  for (const m of matched) {
    if (!m.deviation || !m.walk) continue;
    const id = `${m.walk.openingId}|${m.deviation.key}`;
    if (!out.has(id)) out.set(id, { href: `/games/${m.game.site}/${m.game.id}`, opponent: m.game.opponent, move: moveNo(depthOf(m.walk)) });
  }
  return out;
}

/** Labels each Recall question with the game that left the course at its position, if one did. */
export function withGames(runs: Run[], origins: Map<string, FromGame>): Run[] {
  if (!origins.size) return runs;
  return runs.map((run) => ({
    ...run,
    asks: run.asks.map((a) => {
      const game = origins.get(`${run.openingId}|${a.key}`);
      return game ? { ...a, game } : a;
    }),
  }));
}

/* ---------- one game, in full ---------- */

type Score = Pick<Ply, 'ev' | 'mate'>;

export interface ScoredMove {
  num: string;
  arrow: Arrow | null;
  /** White's score after the move, from the shipped evals or verdicts; null where none ships. */
  score: Score | null;
}

/** Where to go over the move again: a chapter or sideline step, opening at `ply` when given. */
export interface PracticeLink {
  slug: string;
  name: string;
  sideline: boolean;
  /** Index in the chapter's plies where the board opens. */
  ply: number | null;
  /** The chapter's number on the course page, for chapters. */
  chapter: number | null;
}

export interface TheirMove {
  num: string;
  arrow: Arrow | null;
  /** The share of club games reaching the position that went this way, where the club file counts enough. */
  club: { pct: number; games: number } | null;
  sev?: Severity;
  name?: string;
  /** The course's authored words on it, compiled HTML. */
  why?: string;
  /** The course's reply, and whether the learner found it. */
  answer: (ScoredMove & { found: boolean }) | null;
  sideline: { slug: string; name: string; short: string } | null;
  /** Stockfish's reply where the course stops, searched ahead of time (exits.py), never course theory. */
  engine: EngineAnswer | null;
}

export interface PrepReport {
  prep: Prep;
  /** The learner's move and the course's, scored, when the learner left. */
  yours: { played: ScoredMove; course: ScoredMove[] } | null;
  theirs: TheirMove | null;
  /** The move the learner should go over, in its chapter or sideline. */
  practice: PracticeLink | null;
  /** Boards up to the key position: the moves of the walk, plus the opponent's move that left. */
  upTo: number;
}

/** Club players' share of a reply, read off club/<id>.json. Below this many games it's noise. */
const CLUB_MIN = 20;

export function clubShare(club: ClubBook | null, key: string, san: string) {
  const replies = club?.positions[key];
  if (!replies) return null;
  const games = replies.reduce((n, r) => n + r[1], 0);
  const mine = replies.find((r) => bareSan(r[0]) === bareSan(san));
  if (games < CLUB_MIN || !mine) return null;
  return { pct: Math.max(1, Math.round((100 * mine[1]) / games)), games };
}

const scoreOf = (p: Score | undefined): Score | null => (p && (p.ev !== undefined || p.mate !== undefined) ? { ev: p.ev, mate: p.mate } : null);

/** Where a chapter or sideline teaching `key` asks for the move there; the chapter first. */
export function practiceAt(op: Opening, d: Pick<Deviation, 'teaches' | 'key'>): PracticeLink | null {
  const t = d.teaches.find((x) => !x.sideline) ?? d.teaches[0];
  const line = t && lineBySlug(op, t.slug);
  if (!t || !line) return null;
  const at = line.plies.findIndex((p, i) => i >= (line.start ?? 0) && positionKey(p) === d.key);
  const index = op.lines.findIndex((l) => l.slug === t.slug);
  return {
    slug: t.slug,
    name: t.name,
    sideline: t.sideline,
    // One move early, so the opponent's move that sets the question is played on the board first.
    ply: at < 0 ? null : Math.max(line.start ?? 0, at - 1),
    chapter: index < 0 ? null : index + 1,
  };
}

export function prepReport(op: Opening, w: Walk, game: Pick<ImportedGame, 'moves' | 'positions'>, deviation: Deviation | null, club: ClubBook | null): PrepReport {
  const prep = prepOf(w, game.moves);
  const nodes = treeFor(op, w.side).nodes;
  const depth = depthOf(w);

  if (prep.kind === 'you' && deviation) {
    const node = nodes[deviation.key];
    const scored = (arrow: Arrow | null): Score | null => {
      const v = arrow && node.verdicts?.[arrow.from + arrow.to];
      return v ? { ev: v[1], mate: v[3] } : null;
    };
    const course = deviation.course.map((c) => {
      const edge = node.moves.find((e) => e.from === c.arrow.from && e.to === c.arrow.to);
      return { num: c.num, arrow: c.arrow, score: scored(c.arrow) ?? scoreOf(edge && nodes[edge.next]) };
    });
    return {
      prep,
      yours: { played: { ...deviation.played, score: scored(deviation.played.arrow) }, course },
      theirs: null,
      practice: practiceAt(op, deviation),
      upTo: depth,
    };
  }

  if (prep.kind === 'new') {
    const key = exitKey(w);
    const san = w.played!;
    const after = game.positions?.[depth]?.key;
    return {
      prep,
      yours: null,
      theirs: {
        num: prep.num,
        arrow: resolveSan(nodes[key], san),
        club: clubShare(club, key, san),
        answer: null,
        sideline: null,
        engine: (after && club?.answers?.[after]) || null,
      },
      practice: null,
      upTo: depth + (game.positions?.[depth] ? 1 : 0),
    };
  }

  if (prep.kind === 'covered' && w.met) {
    const met = w.met;
    const edge = nodes[met.key].moves.find((e) => bareSan(e.san) === bareSan(met.san));
    // The learner's own reply when it's one the course plays, else the course's main one.
    const replies = edge ? [...nodes[edge.next].moves].sort((a, b) => b.w - a.w) : [];
    const next = w.steps[met.ply + 2];
    const played = next?.book ? replies.find((e) => e.next === next.key) : undefined;
    const reply = played ?? replies[0];
    const sideline = met.kind === 'sideline' ? op.sidelines?.items.find((s) => s.slug === met.slug) : undefined;
    return {
      prep,
      yours: null,
      theirs: {
        num: met.num,
        arrow: edge ? { from: edge.from, to: edge.to } : null,
        club: clubShare(club, met.key, met.san),
        sev: met.sev,
        name: met.name ?? sideline?.name,
        why: met.why,
        answer: reply
          ? {
              num: reply.num,
              arrow: { from: reply.from, to: reply.to },
              score: scoreOf(nodes[reply.next]),
              found: !!played,
            }
          : null,
        sideline: sideline ? { slug: sideline.slug, name: sideline.name ?? sideline.line?.name ?? met.num, short: sideline.short } : null,
        engine: null,
      },
      practice: null,
      upTo: met.ply + 1,
    };
  }

  return { prep, yours: null, theirs: null, practice: null, upTo: depth };
}
