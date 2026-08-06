"use client";

import { useState } from "react";
import type { LessonBoard, Seg } from "@/lib/content/types";
import Board from "@/components/study/Board";

/* One lesson card, set the way a chess book sets a page: the diagram beside
   the paragraph that talks about it. Every move the prose names is a button —
   pressing it shows that position on the card's board — so the notation is the
   control, not decoration on top of one. Nothing here computes chess: a chip
   only points at a position the build already replayed and shipped. */

export interface LessonBlock {
  heading?: string;
  /** Each entry is one paragraph, or one bullet when `list` is set. */
  items: Seg[][];
  list?: boolean;
}

interface Props {
  label: string;
  danger?: boolean;
  blocks: LessonBlock[];
  boards?: LessonBoard[];
  hero?: number;
  /** A static diagram for a card whose prose plays no moves (the structure). */
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

export default function LessonCard({ label, danger, blocks, boards, hero, diagram, flipped }: Props) {
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
    <article className={`lesson-card${b || diagram ? "" : " lesson-card--plain"}${danger ? " lesson-card--danger" : ""}`}>
      <p className={`lesson-card__head label ${danger ? "label--danger" : "label--accent"}`}>{label}</p>
      {b ? (
        <figure className="lesson-card__fig">
          {figure(b.fen, b.from, b.to, b.check ? (b.turn === "w" ? "b" : "w") : null)}
          <figcaption className="lesson-card__nav">
            <button type="button" className="btn btn--icon" disabled={b.p === null}
              aria-label="Back one move in this sequence"
              onClick={() => b.p !== null && go(b.p)}>←</button>
            <span className="lesson-card__num">{caption}</span>
            <button type="button" className="btn btn--icon" disabled={b.n === undefined}
              aria-label="Forward one move in this sequence"
              onClick={() => b.n !== undefined && go(b.n!)}>→</button>
          </figcaption>
        </figure>
      ) : diagram ? (
        <figure className="lesson-card__fig">
          {figure(diagram.board, null, null, null)}
          <figcaption className="lesson-card__nav">
            <span className="lesson-card__num">{caption}</span>
          </figcaption>
        </figure>
      ) : null}
      <div className="lesson-card__body">
        {blocks.map((blk, i) => (
          <div key={i} className="lesson-card__block">
            {blk.heading ? <p className="lesson-card__sub label">{blk.heading}</p> : null}
            {blk.list ? (
              <ul>{blk.items.map((x, j) => <li key={j}>{rich(x)}</li>)}</ul>
            ) : (
              blk.items.map((x, j) => <p key={j} className="lesson-card__text">{rich(x)}</p>)
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
