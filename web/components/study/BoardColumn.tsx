"use client";

import { useRef } from "react";
import type { Ply, Turn } from "@/lib/content/types";
import type { NoteRecord } from "@/lib/db";
import type { Drawing, Rejected } from "@/lib/study/useStudy";
import { pieceAt } from "@/lib/chess/read";
import Board from "./Board";
import ArrowLayer from "./ArrowLayer";
import { EvalBar } from "./Eval";

/* The board, its transport and its display tools — everything that belongs to
   the board column, in the order it is read. Ported from boardColumnHTML. */

interface Props {
  ply: Ply;
  index: number;
  total: number;
  locked: boolean;
  flipped: boolean;
  autoplay: boolean;
  canPlay: boolean;
  arrowsOn: boolean;
  mineOn: boolean;
  hidesOverlays: boolean;
  live: boolean;
  gridNav: boolean;
  grabSide: Turn | null;
  selected: string | null;
  cursor: string;
  targets: string[];
  rejected: Rejected | null;
  mine: NoteRecord | null;
  drawing: Drawing | null;
  /** The first square of a two-tap note arrow, waiting for its second. */
  pendingFrom: string | null;
  depth: number | null;
  readout: React.ReactNode;
  hint: React.ReactNode;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  onFlip: () => void;
  onArrows: () => void;
  onMine: () => void;
  onPlay: () => void;
}

export default function BoardColumn({
  ply, index, total, locked, flipped, autoplay, canPlay, arrowsOn, mineOn,
  hidesOverlays, live, gridNav, grabSide, selected, cursor, targets, rejected,
  mine, drawing, pendingFrom, depth, readout, hint,
  onFirst, onPrev, onNext, onLast, onFlip, onArrows, onMine, onPlay,
}: Props) {
  const atStart = index === 0;
  const atEnd = index >= total;
  const showArrows = arrowsOn && !hidesOverlays;
  const showMine = mineOn && !hidesOverlays;
  /* The canvas measures THIS board — never a lookup by id, so a page may one
     day carry a second board (structures, games) without the layers fighting
     over which one they belong to. */
  const squareRef = useRef<HTMLDivElement>(null);
  /* Spots render as the board's own square fills; the live list previews the
     press still on its square and the two-tap arrow's waiting tail. */
  const noted = showMine ? mine?.spots || [] : [];
  const notedLive = showMine
    ? [
        ...(drawing && drawing.to === drawing.from ? [drawing.from] : []),
        ...(pendingFrom ? [pendingFrom] : []),
      ]
    : [];
  return (
    <div className="study__board">
      <div className="board-frame">
        <div className="board-square" ref={squareRef}>
          <Board
            fen={ply.fen}
            from={ply.from}
            to={ply.to}
            checkSide={ply.check ? (ply.turn === "w" ? "b" : "w") : null}
            flipped={flipped}
            live={live}
            gridNav={gridNav}
            grabSide={grabSide}
            selected={selected}
            cursor={cursor}
            targets={targets}
            noted={noted}
            notedLive={notedLive}
            rejected={rejected}
            pieceAt={(sq) => pieceAt(ply.fen, sq)}
          />
          <ArrowLayer
            boardRef={squareRef}
            fen={ply.fen}
            arrows={ply.arrows || []}
            mine={showMine ? mine : null}
            drawing={showMine ? drawing : null}
            rejected={rejected}
            showArrows={showArrows}
            showMine={showMine}
            flipped={flipped}
          />
        </div>
      </div>

      <EvalBar ply={ply} depth={depth} />

      <div className="transport">
        <button className="btn btn--icon" disabled={atStart}
          aria-label="Back to the start" title="Start (Home)" onClick={onFirst}>⇤</button>
        <button className="btn btn--icon" disabled={atStart}
          aria-label="Back one move" title="Back (←)" onClick={onPrev}>←</button>
        <span className="transport__readout">{readout}</span>
        <button className="btn btn--icon" disabled={atEnd || locked}
          aria-label="Forward one move" title="Forward (→)" onClick={onNext}>→</button>
        <button className="btn btn--icon" disabled={atEnd || locked}
          aria-label="Jump to the end" title="End (End)" onClick={onLast}>⇥</button>
      </div>

      <div className="board-tools">
        <button className={`btn${autoplay ? " on" : ""}`} disabled={!canPlay}
          onClick={onPlay}>
          <span className="glyph" aria-hidden="true">{autoplay ? "■" : "▶"}</span>
          {autoplay ? "Stop" : "Play"}
        </button>
        <button className="btn" 
          aria-label={`Flip the board to put ${flipped ? "White" : "Black"} at the bottom`}
          title={`Flip the board to put ${flipped ? "White" : "Black"} at the bottom`}
          onClick={onFlip}>
          <span className="glyph" aria-hidden="true">⇅</span>Flip
        </button>
        <button className={`btn${showArrows ? " on" : ""}`} 
          aria-pressed={showArrows} disabled={hidesOverlays}
          title="What the move attacks, defends and controls, drawn on the board"
          onClick={onArrows}>
          <span className="glyph" aria-hidden="true">↗</span>Arrows
        </button>
        <button className={`btn${showMine ? " on" : ""}`} 
          aria-pressed={showMine} disabled={hidesOverlays}
          title="Your own notes and the marks that go with them"
          onClick={onMine}>
          <span className="glyph" aria-hidden="true">✎</span>Notes
        </button>
      </div>

      {showArrows || showMine ? (
        <div className="legend">
          {showArrows ? (
            <>
              <span><i className="move"></i>the move</span>
              <span><i className="attack"></i>attacks</span>
              <span><i className="check"></i>check</span>
              <span><i className="defend"></i>defends</span>
              <span><i className="control"></i>controls a key square</span>
            </>
          ) : null}
          {showMine ? <span><i className="mine"></i>your note</span> : null}
        </div>
      ) : null}

      {hint ? <p className="board-hint">{hint}</p> : null}
    </div>
  );
}
