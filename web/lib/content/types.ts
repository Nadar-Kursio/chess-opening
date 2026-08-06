/* The shapes src/build.py --emit writes into web/content/. Hand-maintained
   mirrors of the Python side; tests/test_emit.py is what keeps them honest.
   Nothing here is computed in the browser — every field is engine-verified at
   compile time, and the client only reads. */

export type Colour = "white" | "black";
export type Turn = "w" | "b";
export type Severity = "blunder" | "inaccuracy" | "playable";
export type Mark = "brilliant" | "great" | "inaccuracy" | "blunder";
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
  /** The engine's verdict on the move, derived by engine/marks.py at build. */
  mark?: Mark;
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

/** A demo text cut around its moves: prose, or a move that has a board.
    The shape any illustrated surface ships — engine/illustrate.py writes it,
    components/demo/Demo.tsx renders it. */
export type Seg = string | { b: number; t: string };

/** One position a demo run reaches. `p`/`n` walk the run it belongs to;
    an anchor — the position the run starts from — has `num: ""`. */
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
  /** Traps only: the colon-stopped name the author gave it. */
  name?: string;
}

export interface LessonPlans {
  white: Seg[][];
  black: Seg[][];
  boards?: DemoBoard[];
  hero?: number;
}

/** The theory, cut around the moves it names — derived by engine/lesson.py,
    every board replayed from a position the opening's lines reach. */
export interface Lesson {
  idea: DemoCard;
  structure: DemoCard;
  plans: LessonPlans;
  traps: DemoCard[];
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
  lesson?: Lesson;
  progression: Progression;
  lines: Line[];
  branchsets?: Branch[][];
}

/** structures.json carries more (plans, pitfalls, taxonomy); the lesson reads
    only the diagram and its name. */
export interface StructureRecord {
  id: string;
  name: string;
  board: string;
  tier?: Tier;
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
