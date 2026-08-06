"use client";

import type { Mark, Ply } from "@/lib/content/types";
import {
  EVAL_WORTH_SAYING, MARKS, evalOf, evalSeverity, evalShare, evalSwing, evalText, evalWords,
} from "@/lib/study/eval";

/* The bar under the board and the swing row in the coach card, ported from
   eval.js. Renders nothing when the position carries no score — an opening
   whose evals have not been generated must read as though this feature does
   not exist rather than as though it is broken. */

export function EvalBar({ ply, depth }: { ply: Ply | null; depth: number | null }) {
  const p = evalOf(ply);
  if (!p) return null;
  const share = evalShare(p);
  const text = evalText(p);
  const words = evalWords(p);
  return (
    <div
      className="evalbar"
      role="img"
      aria-label={`Stockfish at depth ${depth} scores this ${text} — ${words}.`}
    >
      <span className="evalbar__label label">Stockfish</span>
      <span className="evalbar__track">
        <span className="evalbar__white" style={{ width: `${share.toFixed(1)}%` }}></span>
      </span>
      <b className="evalbar__score">{text}</b>
    </div>
  );
}

/* The mark's glyph alone, for the move tape and the board — decoration beside
   a move whose accessible name already carries the word. */
export function MarkBadge({ mark }: { mark: Mark }) {
  return (
    <i className={`movemark movemark--${mark}`} aria-hidden="true">{MARKS[mark].glyph}</i>
  );
}

/* Glyph and word together, the same shape SeverityChip gives an authored
   deviation — a derived mark is never carried by colour alone either. */
export function MarkChip({ mark }: { mark: Mark }) {
  const m = MARKS[mark];
  return (
    <span className={`severity severity--${mark}`}>
      <b className="severity__mark" aria-hidden="true">{m.glyph}</b>
      <span className="severity__word">{m.word}</span>
    </span>
  );
}

/* What the move just played was worth. Only where both positions are scored:
   half a subtraction is not a swing. */
export function EvalMove({ before, after }: { before: Ply | null; after: Ply | null }) {
  const a = evalOf(before);
  const b = evalOf(after);
  if (!a || !b || !after?.turn) return null;
  const swing = evalSwing(a, b, after.turn);
  if (Math.abs(swing) < EVAL_WORTH_SAYING) return null;
  const who = after.turn === "w" ? "White" : "Black";
  return (
    <div className={`tactics evalmove evalmove--${swing < 0 ? evalSeverity(-swing) : "gain"}`}>
      <span className="label">Stockfish</span>
      <span>
        {after.san} {swing < 0 ? "gives up" : "wins back"} <b>{Math.abs(swing / 100).toFixed(2)}</b>{" "}
        for {who} &mdash; the score goes from <b>{evalText(a)}</b> to <b>{evalText(b)}</b>.
      </span>
    </div>
  );
}
