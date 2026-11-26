import { Chess } from 'chess.js';
import { positionKey } from './course.ts';
import type { Run, WrongMove } from './recall.ts';
import type { Opening, Ply } from './types.ts';

/* Where a wrong answer in Recall goes, so the board can play it out before taking it back. The
   browser knows no chess, so the page replays each run here, on the server, and hands over the
   board after every other legal move from each asked position. The score is the course's own: the
   shipped verdict for that move, else the eval of the position it reaches when the course reaches
   it some other way, else none. Nothing here judges a move. */

type Score = Pick<Ply, 'ev' | 'mate'>;

const scored = new WeakMap<Opening, Map<string, Score>>();

/** Every position the course ships an eval for, by position key. */
function evalsOf(op: Opening) {
  let byKey = scored.get(op);
  if (byKey) return byKey;
  byKey = new Map();
  const add = (plies: Ply[]) => {
    for (const p of plies) {
      if ((p.ev !== undefined || p.mate !== undefined) && !byKey!.has(positionKey(p))) byKey!.set(positionKey(p), { ev: p.ev, mate: p.mate });
    }
  };
  for (const line of op.lines) add(line.plies);
  for (const set of op.branchsets ?? []) for (const b of set) add(b.plies);
  for (const s of op.sidelines?.items ?? []) if (s.line) add(s.line.plies);
  scored.set(op, byKey);
  return byKey;
}

const boardOf = (fen: string) =>
  fen
    .split(' ')[0]
    .replace(/\d/g, (n) => '.'.repeat(Number(n)))
    .replaceAll('/', '');

function wrongFrom(chess: Chess, position: Ply, accept: string[], evals: Map<string, Score>) {
  const out: Record<string, WrongMove> = {};
  for (const m of chess.moves({ verbose: true })) {
    const uci = m.from + m.to;
    // The board sends from+to only, and promotes to a queen.
    if (accept.includes(uci) || (m.promotion && m.promotion !== 'q')) continue;
    const verdict = position.verdicts?.[uci];
    const after = m.after.split(' ');
    const score = verdict ? { ev: verdict[1], mate: verdict[3] } : evals.get(boardOf(m.after) + after[1]);
    out[uci] = {
      san: m.san,
      fen: boardOf(m.after),
      ...(/[+#]$/.test(m.san) ? { check: true } : {}),
      ...(score?.ev !== undefined ? { ev: score.ev } : {}),
      ...(score?.mate !== undefined ? { mate: score.mate } : {}),
    };
  }
  return out;
}

/** The runs with every asked position's wrong moves filled in. A run that won't replay is left as it is. */
export function withWrongMoves(runs: Run[], opening: (id: string) => Opening): Run[] {
  return runs.map((run) => {
    const chess = new Chess();
    if (boardOf(chess.fen()) !== run.plies[0]?.fen) return run;
    const evals = evalsOf(opening(run.openingId));
    const wrong = new Map<number, Record<string, WrongMove>>();
    const asked = new Map(run.asks.map((a) => [a.at, a]));
    try {
      for (let i = 0; i < run.plies.length; i++) {
        const ask = asked.get(i);
        if (ask) wrong.set(i, wrongFrom(chess, run.plies[i], ask.accept, evals));
        if (i + 1 < run.plies.length) chess.move(run.plies[i + 1].san);
      }
    } catch {
      return run;
    }
    return { ...run, asks: run.asks.map((a) => ({ ...a, wrong: wrong.get(a.at) })) };
  });
}
