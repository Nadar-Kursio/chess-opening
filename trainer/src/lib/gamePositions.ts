import 'server-only';
import { Chess } from 'chess.js';
import type { GamePosition } from './games';

/* The positions an imported game passes through, so a game that reaches the course by another move
   order (1.d4 d5 2.Nf3 Nf6 3.Bf4 for the London) is matched by position, not given up on at move
   two. The course's own positions come from the build; this only replays the site's moves, on the
   server, and never decides anything about a position. */

/** Plies replayed: well past the deepest line any course teaches. */
export const REPLAY_PLIES = 40;
const CACHE_SIZE = 5000;
const cache = new Map<string, GamePosition[]>();

const board = (fen: string) =>
  fen
    .split(' ')[0]
    .replace(/\d/g, (n) => '.'.repeat(Number(n)))
    .replaceAll('/', '');

/** The position after each of the first moves, as course position keys; stops at a move it can't read. */
export function replay(moves: string[]): GamePosition[] {
  const id = moves.slice(0, REPLAY_PLIES).join(' ');
  const hit = cache.get(id);
  if (hit) return hit;
  const chess = new Chess();
  const out: GamePosition[] = [];
  for (const san of moves.slice(0, REPLAY_PLIES)) {
    try {
      const m = chess.move(san);
      const fen = board(m.after);
      out.push({ key: fen + chess.turn(), fen, from: m.from, to: m.to, check: chess.inCheck() });
    } catch {
      break;
    }
  }
  if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value!);
  cache.set(id, out);
  return out;
}
