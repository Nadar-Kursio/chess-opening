"use client";

import { useState } from "react";
import type { DemoBoard, Seg } from "@/lib/content/types";
import Board from "@/components/study/Board";

/* Prose whose moves drive a board. Every move the text names is a button —
   pressing it shows that position on the figure, ‹ › walk the run it belongs
   to — and the chips wear the scoresheet's grammar, so notation that can be
   pressed looks like the notation the reader already presses elsewhere.

   This is the reusable half: it renders a figure and a body and leaves their
   placement to whoever composes it (the lesson card today, an article
   tomorrow). Nothing here computes chess — a chip only points at a position
   the build already replayed and shipped in the {seg, boards, hero} record. */

export interface DemoBlock {
  heading?: string;
  /** Each entry is one paragraph, or one bullet when `list` is set. */
  items: Seg[][];
  list?: boolean;
}

interface Props {
  blocks: DemoBlock[];
  boards?: DemoBoard[];
  hero?: number;
  /** A static diagram for a text that plays no moves (the pawn structure). */
  diagram?: { board: string; caption: string } | null;
  flipped: boolean;
}

/* The board is a read-only diagram here, so everything interactive on the
   study board arrives switched off. */
const inert = {
  live: false,
  gridNav: false,
  grabSide: null,
  selected: null,
  cursor: "",
  targets: [] as string[],
  noted: [] as string[],
  notedLive: [] as string[],
  rejected: null,
  pieceAt: () => "",
};

export default function Demo({ blocks, boards, hero, diagram, flipped }: Props) {
  const [at, setAt] = useState(hero ?? 0);
  /* The hero position renders without a glide: a page must not play itself.
     Only a press animates, and then only the move it lands on. */
  const [touched, setTouched] = useState(false);
  const go = (i: number) => { setTouched(true); setAt(i); };

  const b = boards && boards.length ? boards[at] : null;
  const caption = b
    ? b.num || (b.n !== undefined ? `Before ${boards![b.n].num}` : "Start")
    : diagram?.caption;

  const rich = (parts: Seg[]) =>
    parts.map((s, i) =>
      typeof s === "string" ? (
        <span key={i} dangerouslySetInnerHTML={{ __html: s }} />
      ) : (
        <button key={i} type="button"
          className={`chip${b && s.b === at ? " chip--current" : ""}`}
          aria-pressed={!!b && s.b === at}
          onClick={() => go(s.b)}>
          {s.t}
        </button>
      )
    );

  const figure = (fen: string, from: string | null, to: string | null, checkSide: "w" | "b" | null) => (
    <div className="board-frame" aria-hidden="true">
      <div className="board-square">
        <Board fen={fen} from={from} to={to} checkSide={checkSide}
          flipped={flipped} animate={touched} {...inert} />
      </div>
    </div>
  );

  return (
    <>
      {b ? (
        <figure className="demo__fig">
          {figure(b.fen, b.from, b.to, b.check ? (b.turn === "w" ? "b" : "w") : null)}
          <figcaption className="demo__nav">
            <button type="button" className="btn btn--icon" disabled={b.p === null}
              aria-label="Back one move in this sequence"
              onClick={() => b.p !== null && go(b.p)}>←</button>
            <span className="demo__num">{caption}</span>
            <button type="button" className="btn btn--icon" disabled={b.n === undefined}
              aria-label="Forward one move in this sequence"
              onClick={() => b.n !== undefined && go(b.n!)}>→</button>
          </figcaption>
        </figure>
      ) : diagram ? (
        <figure className="demo__fig">
          {figure(diagram.board, null, null, null)}
          <figcaption className="demo__nav">
            <span className="demo__num">{caption}</span>
          </figcaption>
        </figure>
      ) : null}
      <div className="demo__body">
        {blocks.map((blk, i) => (
          <div key={i}>
            {blk.heading ? <p className="demo__sub label">{blk.heading}</p> : null}
            {blk.list ? (
              <ul>{blk.items.map((x, j) => <li key={j}>{rich(x)}</li>)}</ul>
            ) : (
              blk.items.map((x, j) => <p key={j} className="demo__text">{rich(x)}</p>)
            )}
          </div>
        ))}
      </div>
    </>
  );
}
