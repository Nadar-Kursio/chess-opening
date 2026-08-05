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
  tail: string | null;
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

export default function BoardColumn(p: Props) {
  const atStart = p.index === 0;
  const atEnd = p.index >= p.total;
  const showArrows = p.arrowsOn && !p.hidesOverlays;
  const showMine = p.mineOn && !p.hidesOverlays;
  /* The canvas measures THIS board — never a lookup by id, so a page may one
     day carry a second board (structures, games) without the layers fighting
     over which one they belong to. */
  const squareRef = useRef<HTMLDivElement>(null);
  return (
    <div className="study__board">
      <div className="board-frame">
        <div className="board-square" ref={squareRef}>
          <Board
            fen={p.ply.fen}
            from={p.ply.from}
            to={p.ply.to}
            checkSide={p.ply.check ? (p.ply.turn === "w" ? "b" : "w") : null}
            flipped={p.flipped}
            live={p.live}
            gridNav={p.gridNav}
            grabSide={p.grabSide}
            selected={p.selected}
            cursor={p.cursor}
            targets={p.targets}
            rejected={p.rejected}
            pieceAt={(sq) => pieceAt(p.ply.fen, sq)}
          />
          <ArrowLayer
            boardRef={squareRef}
            fen={p.ply.fen}
            arrows={p.ply.arrows || []}
            mine={showMine ? p.mine : null}
            drawing={showMine ? p.drawing : null}
            tail={showMine ? p.tail : null}
            rejected={p.rejected}
            showArrows={showArrows}
            showMine={showMine}
            flipped={p.flipped}
          />
        </div>
      </div>

      <EvalBar ply={p.ply} depth={p.depth} />

      <div className="transport">
        <button className="btn btn--icon" id="b-first" disabled={atStart}
          aria-label="Back to the start" title="Start (Home)" onClick={p.onFirst}>⇤</button>
        <button className="btn btn--icon" id="b-prev" disabled={atStart}
          aria-label="Back one move" title="Back (←)" onClick={p.onPrev}>←</button>
        <span className="transport__readout">{p.readout}</span>
        <button className="btn btn--icon" id="b-next" disabled={atEnd || p.locked}
          aria-label="Forward one move" title="Forward (→)" onClick={p.onNext}>→</button>
        <button className="btn btn--icon" id="b-last" disabled={atEnd || p.locked}
          aria-label="Jump to the end" title="End (End)" onClick={p.onLast}>⇥</button>
      </div>

      <div className="board-tools">
        <button className={`btn${p.autoplay ? " on" : ""}`} id="b-play" disabled={!p.canPlay}
          onClick={p.onPlay}>
          <span className="glyph" aria-hidden="true">{p.autoplay ? "■" : "▶"}</span>
          {p.autoplay ? "Stop" : "Play"}
        </button>
        <button className="btn" id="b-flip"
          aria-label={`Flip the board to put ${p.flipped ? "White" : "Black"} at the bottom`}
          title={`Flip the board to put ${p.flipped ? "White" : "Black"} at the bottom`}
          onClick={p.onFlip}>
          <span className="glyph" aria-hidden="true">⇅</span>Flip
        </button>
        <button className={`btn${showArrows ? " on" : ""}`} id="b-arrows"
          aria-pressed={showArrows} disabled={p.hidesOverlays}
          title="What the move attacks, defends and controls, drawn on the board"
          onClick={p.onArrows}>
          <span className="glyph" aria-hidden="true">↗</span>Arrows
        </button>
        <button className={`btn${showMine ? " on" : ""}`} id="b-mine"
          aria-pressed={showMine} disabled={p.hidesOverlays}
          title="Your own notes and the marks that go with them"
          onClick={p.onMine}>
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

      {p.hint ? <p className="board-hint">{p.hint}</p> : null}
    </div>
  );
}
