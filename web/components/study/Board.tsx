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
  live: boolean;
  selected: string | null;
  cursor: string;
  targets: string[];
  rejected: Rejected | null;
  pieceAt: (sq: string) => string;
}

export default function Board({
  fen, from, to, checkSide, flipped, live, selected, cursor, targets, rejected, pieceAt,
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
    <div className={`board${live ? " live" : ""}`} id="board" role={live ? "grid" : undefined} ref={ref}>
      {order.map((i, pos) => {
        const file = i % 8;
        const rank = 7 - ((i / 8) | 0);
        const name = FILES[file] + (rank + 1);
        const light = (file + rank) % 2 === 1;
        const cls = ["sq", light ? "light" : "dark"];
        if (name === from || name === to) cls.push("played");
        const ch = fen[i];
        let piece: React.ReactNode = null;
        if (ch !== ".") {
          const isWhite = ch === ch.toUpperCase();
          if (checkSide && ch.toLowerCase() === "k" && (isWhite ? "w" : "b") === checkSide) {
            cls.push("in-check");
          }
          piece = (
            <span className={`piece ${isWhite ? "white" : "black"}${name === to ? " arriving" : ""}`}>
              {PIECE_GLYPH[ch.toLowerCase()]}
            </span>
          );
        }
        if (name === selected) cls.push("picked-up");
        if (live && name === cursor) cls.push("cursor");
        const isTarget = targets.includes(name);
        if (isTarget) {
          cls.push("target");
          if (pieceAt(name) !== "") cls.push("target--capture");
        }
        if (rejected && (name === rejected.from || name === rejected.to)) {
          cls.push(rejected.kind === "illegal" ? "illegal" : "rejected");
          if (name === rejected.to) cls.push("rejected-to");
        }
        const col = pos % 8;
        const row = (pos / 8) | 0;
        return (
          <div
            key={name}
            className={cls.join(" ")}
            data-sq={name}
            role={live ? "gridcell" : undefined}
            tabIndex={live ? (name === cursor ? 0 : -1) : undefined}
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
