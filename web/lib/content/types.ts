/* The shapes src/build.py --emit writes into web/content/. Hand-maintained
   mirrors of the Python side; tests/test_emit.py is what keeps them honest.
   Nothing here is computed in the browser — every field is engine-verified at
   compile time, and the client only reads. */

export type Colour = "white" | "black";
export type Turn = "w" | "b";
export type Severity = "blunder" | "inaccuracy" | "playable";
export type Tier = "Foundation" | "Structure" | "Plans" | "Mastery";

export interface Arrow {
  k: "move" | "atk" | "def" | "chk" | "ctrl";
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
  turn: Turn;
  check?: boolean;
  arrows?: Arrow[];
  tactics?: string;
  /** Fixed-width 4-char UCI records — the drill's only legality source. */
  legal?: string;
  /** Index into the opening's branchsets: the deviations answered here. */
  bx?: number;
  /** Stockfish centipawns (White's view) and mate distance, where scored. */
  ev?: number;
  mate?: number;
  /** The author's own note for this position, shipped from src/content/notes/. */
  mine?: { text?: string; arrows?: { f: string; t: string }[]; spots?: string[] };
}

export interface LineRecord {
  at: number;
  games: number;
  white: number;
  draw: number;
  black: number;
}

export interface Plan {
  point: string;
  structure?: string;
  tier?: Tier;
  next?: string[];
  endgame?: string;
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

export interface Progression {
  arc: string;
  stages: Stage[];
  study: string;
  next: string;
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
  progression: Progression;
  lines: Line[];
  branchsets?: Branch[][];
}

export interface Section {
  id: string;
  group: string;
  label: string;
}

export interface LineSummary {
  slug: string;
  name: string;
  note: string;
  moveCount: number;
  tier?: Tier;
  side?: Colour;
}

export interface OpeningSummary {
  id: string;
  name: string;
  eco: string;
  section: string;
  orientation: Colour;
  tagline: string;
  level: string;
  /** min over lines: 0 Core, 1 Checked, 2 Coached — drill.js's vocabulary. */
  feedback: 0 | 1 | 2;
  deviations: number;
  lines: LineSummary[];
}

export interface Catalog {
  sections: Section[];
  engine: { name: string | null; depth: number | null; generated: string | null };
  openings: OpeningSummary[];
  structures: { id: string; name: string; tier?: Tier }[];
  games: { id: string; name: string; op: string; tier?: Tier }[];
}
