import { lineSide, positionKey, toMove, turnOf } from './course.ts';
import { leaving, type SparBook } from './spar.ts';
import type { Colour, Opening } from './types.ts';

/* Traps met in the learner's own games. A trap course's bait is read off its own lines: the first
   line taught from the setter's chair where the other side makes a move the course marks as a
   mistake (the engine's mark, or the authored severity) while the course also gives them a sound
   alternative there. Taking the bait is reaching the position that move reaches, so another move
   order into it still counts. Pure, so tests/gameTraps.test.ts checks every shipped trap. */

export interface Bait {
  trapId: string;
  /** Who sets the trap: the trap course's own chair. */
  setter: Colour;
  /** The trap course's line that springs it. */
  line: string;
  /** Before the bait is taken: the victim to move. */
  key: string;
  /** After it is taken. */
  taken: string;
  /** "4...Qxb2" */
  num: string;
  /** The board after the bait is taken, and the move that took it. */
  fen: string;
  from: string;
  to: string;
  /** The setter's answer that punishes it, as the position it reaches. */
  punish: { key: string; num: string } | null;
}

const cache = new WeakMap<Opening, Bait | null>();

/** The move a trap course is about, or null for a course that marks no mistake by the victim. */
export function baitOf(trap: Opening): Bait | null {
  if (cache.has(trap)) return cache.get(trap)!;
  const setter = trap.orientation;
  const victim = turnOf(setter === 'white' ? 'black' : 'white');
  const victimLines = trap.lines.filter((l) => lineSide(trap, l) !== setter);
  let bait: Bait | null = null;
  for (const line of trap.lines) {
    if (lineSide(trap, line) !== setter) continue;
    const plies = line.plies;
    for (let i = 0; i + 1 < plies.length && !bait; i++) {
      if (toMove(plies[i]) !== victim) continue;
      const move = plies[i + 1];
      const set = plies[i].bx === undefined ? [] : (trap.branchsets?.[plies[i].bx!] ?? []);
      const authored = set.find((b) => b.san === move.san);
      const mistake = move.mark === 'blunder' || move.mark === 'inaccuracy' || (!!authored && authored.sev !== 'playable');
      if (!mistake) continue;
      const key = positionKey(plies[i]);
      const sound =
        set.some((b) => b.san !== move.san && b.sev === 'playable') ||
        victimLines.some((v) => {
          const j = v.plies.findIndex((p) => positionKey(p) === key);
          return j >= 0 && !!v.plies[j + 1] && positionKey(v.plies[j + 1]) !== positionKey(move);
        });
      if (!sound) continue;
      const reply = plies[i + 2];
      bait = {
        trapId: trap.id,
        setter,
        line: line.slug,
        key,
        taken: positionKey(move),
        num: move.num,
        fen: move.fen,
        from: move.from!,
        to: move.to!,
        punish: reply ? { key: positionKey(reply), num: reply.num } : null,
      };
    }
    if (bait) break;
  }
  cache.set(trap, bait);
  return bait;
}

export type TrapOutcome = 'sprung' | 'caught' | 'dodged';

/** sprung: the learner set it and the opponent took the bait; caught: the learner took it; dodged: offered and refused, by either side. */
export interface TrapMeeting {
  trapId: string;
  outcome: TrapOutcome;
  /** The learner set it (played the trap course's chair). */
  setter: boolean;
  /** Index of the bait position in the game: the move from it is the one that took or refused it. */
  ply: number;
  /** The setter followed with the course's punishing move, when the bait was taken. */
  punished: boolean | null;
}

/**
 * The traps a game walked into. `keys` is the starting position then the position after each move,
 * as the server's replay keys them.
 */
export function trapsInGame(baits: Bait[], colour: Colour, keys: string[]): TrapMeeting[] {
  const at = new Map<string, number>();
  keys.forEach((k, i) => {
    if (!at.has(k)) at.set(k, i);
  });
  const out: TrapMeeting[] = [];
  for (const b of baits) {
    const i = at.get(b.key);
    if (i === undefined || i + 1 >= keys.length) continue;
    const setter = b.setter === colour;
    const took = keys[i + 1] === b.taken;
    out.push({
      trapId: b.trapId,
      outcome: took ? (setter ? 'sprung' : 'caught') : 'dodged',
      setter,
      ply: i,
      punished: took ? (i + 2 < keys.length ? keys[i + 2] === b.punish?.key : null) : null,
    });
  }
  return out.sort((a, b) => a.ply - b.ply);
}

/** Every trap course's bait, for the courses that have one. */
export function baitsOf(openings: Opening[]) {
  return openings.filter((op) => op.section === 'traps').flatMap((op) => baitOf(op) ?? []);
}

/**
 * Whether a sparring game's positions are one the sparring partner could have played: from the
 * start, every step a move of the course's tree or a club reply into it, and only the last one a
 * club move that leaves the course. The browser reports the path, so the server checks it before
 * believing a trap was sprung in it.
 */
export function sparPathValid(book: SparBook, keys: string[]) {
  if (keys[0] !== book.tree.root) return false;
  for (let i = 1; i < keys.length; i++) {
    const from = keys[i - 1];
    const node = book.tree.nodes[from];
    if (!node) return false;
    if (node.moves.some((e) => e.next === keys[i])) continue;
    const choice = book.choices[from];
    if (choice?.replies.some((r) => r.next === keys[i])) continue;
    const last = i === keys.length - 1;
    if (last && choice?.out.some((m) => leaving(book.tree, from, m).fen + (node.toMove === 'w' ? 'b' : 'w') === keys[i])) continue;
    return false;
  }
  return true;
}
