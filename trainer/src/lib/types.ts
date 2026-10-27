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
}

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
  lines: Line[];
  branchsets?: Branch[][];
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
}
