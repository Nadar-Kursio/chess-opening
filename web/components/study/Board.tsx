"use client";

import { useEffect, useRef } from "react";
import type { Rejected } from "@/lib/study/useStudy";
import { FILES, PIECE_GLYPH } from "@/lib/chess/read";

/* Pure HTML/CSS: an 8x8 grid of divs inside a square wrapper, ported from
   board.js. Selection, targets and the refused attempt arrive as props and
   become classes — React reconciles in place, so a drag's pointer capture
   survives the re-render that paints them. */

interface Props {
  fen: string;
  from: string | null;
  to: string | null;
  checkSide: "w" | "b" | null;
  flipped: boolean;
  /** The board accepts moves: pointer cursors, pick-up and target cues. */
  live: boolean;
  /** Drill's keyboard navigation: grid semantics and the square cursor. */
  gridNav: boolean;
  /** Whose pieces may be picked up — they wear the grab cursor. */
  grabSide: "w" | "b" | null;
  selected: string | null;
  cursor: string;
  targets: string[];
  /** Squares your note marks — filled in the note colour, under the piece. */
  noted: string[];
  notedLive: string[];
  rejected: Rejected | null;
  /** False right after a drag-drop: the hand carried the piece, no glide. */
  animate: boolean;
  pieceAt: (sq: string) => string;
}

export default function Board({
  fen, from, to, checkSide, flipped, live, gridNav, grabSide, selected, cursor, targets, noted, notedLive, rejected, animate, pieceAt,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  /* Size the pieces to the actual rendered square, so they always fit at any
     board size — sizePieces(), scoped to this board. */
  useEffect(() => {
    const board = ref.current;
    if (!board) return;
    const size = () => {
      const square = board.clientWidth / 8;
      if (square > 0) {
        board.style.fontSize = square * 0.74 + "px";
        // The slide animation measures its start offset in squares.
        board.style.setProperty("--sq", square + "px");
        board.querySelectorAll<HTMLElement>(".coord").forEach((c) => {
          c.style.fontSize = Math.max(7, square * 0.16) + "px";
        });
      }
    };
    size();
    window.addEventListener("resize", size);
    return () => window.removeEventListener("resize", size);
  });

  const order: number[] = [];
  for (let i = 0; i < 64; i++) order.push(i);
  if (flipped) order.reverse();

  return (
    <div className={`board${live ? " live" : ""}`} role={gridNav ? "grid" : undefined} ref={ref}>
      {order.map((i, pos) => {
        const file = i % 8;
        const rank = 7 - ((i / 8) | 0);
        const name = FILES[file] + (rank + 1);
        const light = (file + rank) % 2 === 1;
        const col = pos % 8;
        const row = (pos / 8) | 0;
        const cls = ["sq", light ? "light" : "dark"];
        if (name === from || name === to) cls.push("played");
        const ch = fen[i];
        let piece: React.ReactNode = null;
        if (ch !== ".") {
          const isWhite = ch === ch.toUpperCase();
          if (checkSide && ch.toLowerCase() === "k" && (isWhite ? "w" : "b") === checkSide) {
            cls.push("in-check");
          }
          if (live && grabSide && (isWhite ? "w" : "b") === grabSide) cls.push("grab");
          /* The moved piece glides in from its origin square: it mounts on the
             destination already translated back by the move's grid delta, and
             the animation carries it home. */
          let slide: React.CSSProperties | undefined;
          if (animate && name === to && from) {
            const fromFile = FILES.indexOf(from[0]);
            const fromRank = +from[1] - 1;
            const fromCol = flipped ? 7 - fromFile : fromFile;
            const fromRow = flipped ? fromRank : 7 - fromRank;
            slide = {
              ["--slide-x" as string]: `calc(${fromCol - col} * var(--sq, 0px))`,
              ["--slide-y" as string]: `calc(${fromRow - row} * var(--sq, 0px))`,
            };
          }
          piece = (
            <span style={slide}
              className={`piece ${isWhite ? "white" : "black"}${animate && name === to ? " arriving" : ""}`}>
              {PIECE_GLYPH[ch.toLowerCase()]}
            </span>
          );
        }
        if (name === selected) cls.push("picked-up");
        if (gridNav && name === cursor) cls.push("cursor");
        const isTarget = targets.includes(name);
        if (isTarget) {
          cls.push("target");
          if (pieceAt(name) !== "") cls.push("target--capture");
        }
        if (noted.includes(name)) cls.push("noted");
        if (notedLive.includes(name)) cls.push("noted--live");
        if (rejected && (name === rejected.from || name === rejected.to)) {
          cls.push(rejected.kind === "illegal" ? "illegal" : "rejected");
          if (name === rejected.to) cls.push("rejected-to");
        }
        return (
          <div
            key={name}
            className={cls.join(" ")}
            data-sq={name}
            role={gridNav ? "gridcell" : undefined}
            tabIndex={gridNav ? (name === cursor ? 0 : -1) : undefined}
          >
            {/* Labels always show the square's TRUE file/rank; flipping changes
                position, not identity. */}
            {row === 7 ? <span className="coord coord--file">{FILES[file]}</span> : null}
            {col === 0 ? <span className="coord coord--rank">{rank + 1}</span> : null}
            {piece}
          </div>
        );
      })}
    </div>
  );
}
