/* The shapes src/build.py --emit writes. A trimmed mirror of web/lib/content/types.ts: the trainer
   reads the same files, and tests/test_emit.py is what keeps the Python side honest. Nothing here
   is computed in the browser — legality is the packed `legal` string, scores are the shipped evals. */

export type Colour = 'white' | 'black';
export type Turn = 'w' | 'b';
export type Severity = 'blunder' | 'inaccuracy' | 'playable';
export type Mark = 'brilliant' | 'great' | 'inaccuracy' | 'blunder';
export type Tier = 'Foundation' | 'Structure' | 'Plans' | 'Mastery';

export interface Arrow {
  k: 'move' | 'atk' | 'def' | 'chk' | 'ctrl';
  f?: string;
  t: string;
}

export interface Ply {
  san: string;
  /** 64-char board string, rank 8 first; "." is an empty square. */
  fen: string;
  from: string | null;
  to: string | null;
  note?: string | null;
  num: string;
  /** Who played the move that reached this position ("w" on the starting position). */
  turn: Turn;
  check?: boolean;
  arrows?: Arrow[];
  tactics?: string;
  /** Fixed-width 4-char UCI records: every legal move from this position. */
  legal?: string;
  /** Index into the opening's branchsets: alternatives to the move played from here. */
  bx?: number;
  ev?: number;
  mate?: number;
  mark?: Mark;
  /** Every legal move from this position, scored ahead of time by from+to. */
  verdicts?: Record<string, MoveScore>;
}

/** A legal move as the engine sees it: SAN, White's score, g(ood), i(naccuracy) or b(lunder), mate distance. */
export type MoveScore = [san: string, ev: number, sev: 'g' | 'i' | 'b', mate?: number];

export interface Plan {
  point: string;
  structure?: string;
  tier?: Tier;
  next?: string[];
  endgame?: string;
}

export interface LineRecord {
  at: number;
  games: number;
  white: number;
  draw: number;
  black: number;
}

export interface Line {
  slug: string;
  name: string;
  note: string;
  plies: Ply[];
  tier?: Tier;
  side?: Colour;
  plan?: Plan;
  record?: LineRecord;
  /** A sideline's lesson opens here: the plies before it are the chapter's, already played. */
  start?: number;
}

export interface Branch {
  san: string;
  sev: Severity;
  why: string;
  plies: Ply[];
  tier?: Tier;
  name?: string;
  see?: string;
}

export interface Theory {
  big_idea: string;
  structure: string;
  white_plans: string[];
  black_plans: string[];
  traps: string[];
  who: string;
}

export interface Stage {
  tier: Tier;
  when: string;
  goal: string;
  learn: string[];
  drill: string;
  mistake: string;
  ready: string;
}

/** Prose cut around the moves it names: a string, or a move with the board it reaches. */
export type Seg = string | { b: number; t: string };

/** A position a lesson run reaches; `p`/`n` step back and forward along that run. */
export interface DemoBoard {
  fen: string;
  from: string | null;
  to: string | null;
  num: string;
  turn: Turn;
  check?: boolean;
  p: number | null;
  n?: number;
}

export interface DemoCard {
  seg: Seg[];
  boards?: DemoBoard[];
  hero?: number;
  name?: string;
}

/** The theory with its moves made playable — derived by engine/lesson.py at build time. */
export interface Lesson {
  idea: DemoCard;
  structure: DemoCard;
  plans: { white: Seg[][]; black: Seg[][]; boards?: DemoBoard[]; hero?: number };
  traps: DemoCard[];
}

export interface Opening {
  id: string;
  name: string;
  eco: string;
  section: string;
  orientation: Colour;
  tagline: string;
  level: string;
  theory: Theory;
  progression: { arc: string; stages: Stage[]; study: string; next: string };
  lesson?: Lesson;
  lines: Line[];
  branchsets?: Branch[][];
  /** The eval bar, move marks and wrong-move verdicts are on for this course. */
  engineView?: boolean;
  sidelines?: Sidelines;
}

export type SidelineKind = 'answer' | 'dodge' | 'set' | 'keep' | 'chapter';

/** Somewhere club players leave a chapter, and what the learner does then. */
export interface Sideline {
  slug: string;
  kind: SidelineKind;
  num: string;
  /** The moves before it, as a scoresheet. */
  after: string;
  /** Of the club games reaching this position. */
  pct: number;
  games: number;
  at: number;
  /** The chapter and opponent move it leaves at; none for a mistake found off the chapters. */
  chapter: string | null;
  moment: number | null;
  fen: string;
  from: string;
  to: string;
  short: string;
  note: string;
  name?: string;
  auto?: string;
  autoEv?: number;
  best?: string;
  bestEv?: number;
  /** The chapter that teaches it, for kind 'chapter'. */
  target?: string;
  play?: { from: string; to: string };
  yourMoves?: number;
  line?: Line;
}

export interface Sidelines {
  source: string;
  scanned: number;
  games: number;
  elo: [number, number];
  depth: number;
  moments: { chapter: string; index: number; label: string; leave: number }[];
  /** Percent of club replies in the first moves each chapter or sideline teaches, by slug. */
  coverage: Record<string, number>;
  items: Sideline[];
}

export interface Section {
  id: string;
  group: string;
  label: string;
}

export interface OpeningSummary {
  id: string;
  name: string;
  eco: string;
  section: string;
  orientation: Colour;
  tagline: string;
  level: string;
  deviations: number;
  lines: { slug: string; name: string; note: string; moveCount: number; tier?: Tier; side?: Colour }[];
}

export interface Catalog {
  sections: Section[];
  engine: { name: string | null; depth: number | null; generated: string | null };
  openings: OpeningSummary[];
  games: { id: string; name: string; op: string; tier?: Tier }[];
}

/** An annotated master game: the same ply shape as a line. */
export interface Game {
  id: string;
  name: string;
  note: string;
  op: string;
  tier?: Tier;
  plies: Ply[];
}
