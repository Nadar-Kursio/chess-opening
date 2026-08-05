"use client";

import type { Ply } from "@/lib/content/types";
import type { NoteRecord } from "@/lib/db";
import { esc, squaresHTML, tacticsHTML } from "@/lib/chess/read";
import { EvalMove } from "./Eval";

/* The read-mode coach card and its companions, from render.js. Authored prose
   ships as (trusted, build-escaped) HTML, so it renders via
   dangerouslySetInnerHTML — the same trust the old app placed in it. */

export function TacticsLine({ tactics }: { tactics: string }) {
  return (
    <div className="tactics">
      <span className="label">On the board</span>
      <span dangerouslySetInnerHTML={{ __html: tacticsHTML(tactics) + "." }} />
    </div>
  );
}

export function Verdict({ verdict, tone, framed }: { verdict: string; tone: string; framed?: boolean }) {
  if (!verdict) return null;
  return (
    <p className={`verdict${framed ? " verdict--framed" : ""}`} data-tone={tone || "flat"}
      dangerouslySetInnerHTML={{ __html: verdict }} />
  );
}

export function CoachNote({ ply, index, prev }: { ply: Ply; index: number; prev: Ply | null }) {
  return (
    <article className="coach">
      <header className="coach__head">
        <span className="coach__move">{index === 0 ? "Start" : ply.num}</span>
        <span className="label">
          {index === 0 ? "Before the first move" : ply.turn === "w" ? "White to have moved" : "Black to have moved"}
        </span>
      </header>
      <p className="coach__body" dangerouslySetInnerHTML={{ __html: ply.note || "" }} />
      {index > 0 && ply.tactics ? <TacticsLine tactics={ply.tactics} /> : null}
      {index > 0 ? <EvalMove before={prev} after={ply} /> : null}
    </article>
  );
}

/* The author's note for this position — read-only here: writing notes in the
   browser is the notepad, which is not part of this port yet. A note saved by
   the old app cannot reach this key-space, so what shows is the shipped file
   note, in its own card in its own colour, unverified by design. */
export function NoteCard({ ply, show }: { ply: Ply; show: boolean }) {
  const n: NoteRecord | null = ply.mine || null;
  if (!show || !n) return null;
  const marks = (n.arrows || []).map((a) => `${a.f}→${a.t}`)
    .concat((n.spots || []).map((s) => `○${s}`));
  return (
    <article className="mynote">
      <header className="mynote__head">
        <span className="label">My note</span>
        {marks.length ? <span className="mynote__marks">{marks.join(" ")}</span> : null}
        <span className="mynote__where">from the notes file</span>
      </header>
      {n.text ? (
        <p className="mynote__body"
          dangerouslySetInnerHTML={{ __html: squaresHTML(n.text) }} />
      ) : null}
    </article>
  );
}
