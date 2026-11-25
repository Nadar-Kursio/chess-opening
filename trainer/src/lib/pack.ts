/* Position keys are 65 characters ("rnbqkbnr" + 56 more + who moves) and a course's tree repeats
   each one several times over: as an object key, as an edge's `next`, as a ply's `fen`. A page
   that hands a whole tree to the browser (sparring, the repertoire explorer) packs it first: every
   board becomes a short reference into one table, each board written once with its empty squares
   counted ("rnbqkbnr" "pppppppp" "8" ... as in FEN, without the slashes). `unpack` restores the
   exact value. It moves strings around and knows no chess. */

const BOARD = /^[.pnbrqkPNBRQK]{64}[wb]?$/;
// A reference: a character no board, note or move uses, then the table index. A real string that
// happens to start with it is written with it twice.
const REF = '§';
const IS_REF = /^§[0-9a-z]+$/;
const text = (s: string) => (s.startsWith(REF) ? REF + s : s);

export interface Packed<T> {
  boards: string[];
  data: unknown;
  /** Only so `unpack` gives back the type that went in. */
  readonly _type?: T;
}

const squeeze = (board: string) => board.replace(/\.{1,8}/g, (run) => String(run.length));
const stretch = (board: string) => board.replace(/[1-8]/g, (n) => '.'.repeat(Number(n)));

export function pack<T>(value: T): Packed<T> {
  const boards: string[] = [];
  const index = new Map<string, string>();
  const ref = (s: string) => {
    let r = index.get(s);
    if (!r) {
      r = REF + boards.length.toString(36);
      index.set(s, r);
      boards.push(squeeze(s));
    }
    return r;
  };
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return BOARD.test(v) ? ref(v) : text(v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) {
        // Absent and false read the same wherever these trees are used (null doesn't: it's kept).
        if (x === undefined || x === false) continue;
        out[BOARD.test(k) ? ref(k) : text(k)] = walk(x);
      }
      return out;
    }
    return v;
  };
  return { boards, data: walk(value) };
}

export function unpack<T>(packed: Packed<T>): T {
  const boards = packed.boards.map(stretch);
  const at = (s: string) => (IS_REF.test(s) ? boards[parseInt(s.slice(1), 36)] : s.startsWith(REF + REF) ? s.slice(1) : s);
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return at(v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) out[at(k)] = walk(x);
      return out;
    }
    return v;
  };
  return walk(packed.data) as T;
}
