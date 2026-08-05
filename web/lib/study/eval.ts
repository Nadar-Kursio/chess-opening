import type { Ply, Severity } from "@/lib/content/types";

/* The engine's score, ported 1:1 from src/app/scripts/eval.js. Nothing is
   computed in the browser: position-evals.py searched every position with
   Stockfish at one depth, the build hung the number off the ply, and these
   functions only present it. */

export function evalOf(ply: Ply | null | undefined): Ply | null {
  return ply && ply.ev !== undefined ? ply : null;
}

/* Centipawns from White's point of view — which side is winning is a fact about
   the position, not about who is reading it. */
export function evalText(ply: Ply): string {
  if (ply.mate !== undefined) return (ply.mate > 0 ? "M" : "−M") + Math.abs(ply.mate);
  const ev = ply.ev ?? 0;
  return (ev > 0 ? "+" : ev < 0 ? "−" : "") + Math.abs(ev / 100).toFixed(2);
}

/* The usual logistic squash: the gap between +0.2 and +0.8 is visible and the
   gap between +8 and +12 is not, which is the right way round for something
   read at a glance. */
export function evalShare(ply: Ply): number {
  if (ply.mate !== undefined) return ply.mate > 0 ? 100 : 0;
  const ev = ply.ev ?? 0;
  return 100 / (1 + Math.exp(-0.00368208 * Math.max(-1500, Math.min(1500, ev))));
}

/* The number in words — a bar with no gloss teaches a learner nothing they did
   not already know. */
export function evalWords(ply: Ply): string {
  if (ply.mate !== undefined) {
    return `mate in ${Math.abs(ply.mate)} for ${ply.mate > 0 ? "White" : "Black"}`;
  }
  const ev = ply.ev ?? 0;
  const cp = Math.abs(ev);
  const who = ev >= 0 ? "White" : "Black";
  if (cp < 30) return "level";
  if (cp < 90) return `${who} a shade better`;
  if (cp < 250) return `${who} clearly better`;
  if (cp < 600) return `${who} winning`;
  return `${who} completely winning`;
}

/* A score as one comparable number, so a mate sorts above every centipawn eval. */
export function evalScalar(ply: Ply): number {
  return ply.mate !== undefined
    ? Math.sign(ply.mate) * (10000 - Math.abs(ply.mate))
    : ply.ev ?? 0;
}

/* What the move between two positions did to the score, from the point of view
   of whoever played it. Negative means they gave something away. */
export function evalSwing(before: Ply, after: Ply, mover: "w" | "b"): number {
  return Math.round((mover === "w" ? 1 : -1) * (evalScalar(after) - evalScalar(before)));
}

/* The bands the research skill calibrates authored severities on. */
export function evalSeverity(cost: number): Severity {
  return cost >= 300 ? "blunder" : cost >= 50 ? "inaccuracy" : "playable";
}

/* A move only earns a sentence when it moved the number — the `inaccuracy`
   floor, so the sentence appears exactly when the same bands would give the
   move a label. */
export const EVAL_WORTH_SAYING = 50;
