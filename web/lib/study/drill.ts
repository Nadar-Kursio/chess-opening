import type { Line, Ply, Turn } from "@/lib/content/types";
import { pieceAt } from "@/lib/chess/read";

/* Drill vocabulary and pure helpers, ported from src/app/scripts/drill.js.
   How sharp the feedback can be depends on what the build shipped for the line:
     0  exact match only — a wrong move is never called "illegal"
     1  `legal` present: real illegal-move rejection, and target hints
     2  `branches` present: the author's reply to the move you actually played */

export function feedbackLevel(line: Line): 0 | 1 | 2 {
  if (line.plies.some((p) => p.bx !== undefined)) return 2;
  if (line.plies.some((p) => p.legal)) return 1;
  return 0;
}

export const FEEDBACK_LEVELS = [
  { tag: "Core", blurb: "drills the line; cannot yet tell an illegal move from an off-book one" },
  { tag: "Checked", blurb: "knows every legal move, so it tells an illegal move from an off-book one" },
  { tag: "Coached", blurb: "answers the move you actually played" },
] as const;

/* Playing both sides means every move in the line is a question, so the score
   is out of all of them rather than out of your own colour's. */
export function drillAskedCount(line: Line, side: Turn, bothSides: boolean): number {
  if (bothSides) return line.plies.length - 1;
  return line.plies.filter((p, i) => i > 0 && p.turn === side).length;
}

/* Whose move it is in the position at `ply`. */
export function moverSide(plies: Ply[], ply: number): Turn {
  const next = plies[ply + 1];
  return next ? next.turn : ply % 2 === 0 ? "w" : "b";
}

/* True, and derivable from the board alone — no authoring. The point is to tell
   a learner who has just played something reasonable that it WAS reasonable. */
export function movePrinciple(here: Ply, from: string, to: string, ply: number): string {
  const ch = pieceAt(here.fen, from);
  const kind = String(ch).toLowerCase();
  const home = /^[a-h][18]$/.test(from);
  if (pieceAt(here.fen, to)) return "Taking material is rarely wrong; this line has a bigger idea in mind.";
  if (kind === "q" && ply < 8) return "Bringing the queen out this early usually costs time once it is attacked.";
  if (kind === "k") return "Moving the king before castling gives up the right to castle.";
  if ((kind === "n" || kind === "b") && home) return "Developing a piece toward the centre is rarely wrong.";
  if (kind === "p") return "A quiet pawn move is playable — just slower than what this line wants.";
  return "Playable. This line has a specific idea in mind instead.";
}

/* Mask the answer inside prose written for a reader who can already see it. */
export function drillRedact(text: string | null | undefined, answer: Ply | null): string {
  if (!text || !answer) return text || "";
  let out = String(text);
  if (answer.san) out = out.split(answer.san).join("…");
  if (answer.to) out = out.replace(new RegExp("\\b" + answer.to + "\\b", "g"), "…");
  return out;
}
