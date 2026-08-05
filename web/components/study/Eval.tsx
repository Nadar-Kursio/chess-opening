"use client";

import type { Ply } from "@/lib/content/types";
import {
  EVAL_WORTH_SAYING, evalOf, evalSeverity, evalShare, evalSwing, evalText, evalWords,
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
