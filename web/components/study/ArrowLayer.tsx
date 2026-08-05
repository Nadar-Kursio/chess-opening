"use client";

import { useEffect, useRef } from "react";
import type { Arrow } from "@/lib/content/types";
import type { NoteRecord } from "@/lib/db";
import type { Drawing, Rejected } from "@/lib/study/useStudy";
import { FILES, pieceAt } from "@/lib/chess/read";

/* Canvas arrow overlay, ported from arrows.js — Canvas 2D, not SVG, including
   the L-shaped knight arrows. Redraws whole on every relevant change; the
   canvas is cheap and the code stays the original's. */

const ARROW_COLORS: Record<string, string> = {
  atk: "rgba(210,75,60,0.82)",
  def: "rgba(78,138,214,0.80)",
  move: "rgba(124,163,90,0.72)",
  chk: "rgba(234,59,51,0.92)",
  ctrl: "rgba(224,180,74,0.85)",
  mine: "rgba(168,116,208,0.88)", // --mine in tokens.css; change both
  live: "rgba(168,116,208,0.45)", // the same mark, still being dragged out
};
const REJECTED_COLORS = {
  illegal: "rgba(204,106,98,0.85)",
  wrong: "rgba(221,169,74,0.85)",
};

interface Props {
  boardRef: React.RefObject<HTMLElement | null>;
  fen: string;
  arrows: Arrow[];
  mine: NoteRecord | null;
  drawing: Drawing | null;
  pendingFrom: string | null;
  rejected: Rejected | null;
  showArrows: boolean;
  showMine: boolean;
  flipped: boolean;
}

export default function ArrowLayer({
  boardRef, fen, arrows, mine, drawing, pendingFrom, rejected, showArrows, showMine, flipped,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  /* An arrow bends into an L only for a knight's move BY a knight. The played
     move's arrow checks the destination — its knight has already arrived —
     while every other arrow leaves from a square its piece still stands on.
     An arrow out of an empty square is somebody's idea, not a path: straight. */
  const knightAt = (sq: string) => pieceAt(fen, sq).toLowerCase() === "n";

  useEffect(() => {
    const draw = () => {
      const canvas = ref.current;
      const board = boardRef.current?.querySelector<HTMLElement>(".board");
      if (!canvas || !board) return;
      const size = board.clientWidth;
      if (!size) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const square = size / 8;

      /* Ahead of every gate below: a refused attempt has to stay visible in the
         phase where the book arrows are suppressed. */
      if (rejected) {
        drawArrowBetween(ctx, rejected.from, rejected.to,
          REJECTED_COLORS[rejected.kind], square * 0.11, square, flipped,
          knightAt(rejected.from));
      }

      if (showArrows) {
        // control rings first (under the lines)
        arrows.filter((a) => a.k === "ctrl").forEach((a) => {
          drawRing(ctx, a.t, ARROW_COLORS.ctrl, square, flipped, [square * 0.14, square * 0.1]);
        });
        // then the arrows, move first (so attack/check sit on top)
        const order: Record<string, number> = { move: 0, def: 1, atk: 2, chk: 3 };
        arrows
          .filter((a) => a.k !== "ctrl")
          .sort((a, b) => (order[a.k] || 0) - (order[b.k] || 0))
          .forEach((a) => {
            const width = a.k === "chk" ? square * 0.16 : a.k === "move" ? square * 0.1 : square * 0.13;
            if (a.f) {
              drawArrowBetween(ctx, a.f, a.t, ARROW_COLORS[a.k] || "#999", width, square, flipped,
                a.k === "move" ? knightAt(a.t) : knightAt(a.f));
            }
          });
      }

      /* Last, so your own mark is never buried under five engine arrows. */
      if (showMine) {
        if (mine) {
          (mine.spots || []).forEach((sq) => drawRing(ctx, sq, ARROW_COLORS.mine, square, flipped));
          (mine.arrows || []).forEach((a) => {
            drawArrowBetween(ctx, a.f, a.t, ARROW_COLORS.mine, square * 0.12, square, flipped,
              knightAt(a.f));
          });
        }
        /* The mark being made: a rubber band under the finger, and the tail of
           a two-tap arrow waiting for its second square. */
        if (drawing && drawing.to !== drawing.from) {
          drawArrowBetween(ctx, drawing.from, drawing.to, ARROW_COLORS.live,
            square * 0.12, square, flipped, knightAt(drawing.from));
        } else if (drawing) {
          drawRing(ctx, drawing.from, ARROW_COLORS.live, square, flipped);
        }
        if (pendingFrom) drawRing(ctx, pendingFrom, ARROW_COLORS.live, square, flipped);
      }
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  });

  return <canvas className="arrows" ref={ref}></canvas>;
}

/* ---- geometry, verbatim from arrows.js ---- */

function squareGrid(name: string, flipped: boolean) {
  const file = FILES.indexOf(name[0]);
  const rank = +name[1] - 1;
  return { col: flipped ? 7 - file : file, row: flipped ? rank : 7 - rank };
}
function gridCenter(cr: { col: number; row: number }, size: number) {
  return { x: (cr.col + 0.5) * size, y: (cr.row + 0.5) * size };
}

function drawRing(
  ctx: CanvasRenderingContext2D, sq: string, color: string, square: number,
  flipped: boolean, dash?: number[]
) {
  const c = gridCenter(squareGrid(sq, flipped), square);
  ctx.beginPath();
  ctx.arc(c.x, c.y, square * 0.34, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(2, square * 0.05);
  ctx.strokeStyle = color;
  ctx.setLineDash(dash || []);
  ctx.stroke();
  ctx.setLineDash([]);
}

function arrowHead(
  ctx: CanvasRenderingContext2D, tipx: number, tipy: number, ux: number, uy: number, head: number
) {
  const ang = Math.atan2(uy, ux);
  const a = 0.42;
  ctx.beginPath();
  ctx.moveTo(tipx, tipy);
  ctx.lineTo(tipx - head * Math.cos(ang - a), tipy - head * Math.sin(ang - a));
  ctx.lineTo(tipx - head * Math.cos(ang + a), tipy - head * Math.sin(ang + a));
  ctx.closePath();
  ctx.fill();
}

function drawStraight(
  ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number,
  color: string, width: number, square: number
) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const head = Math.max(square * 0.28, width * 2.4);
  const startGap = square * 0.3, endGap = square * 0.34;
  const sx = x1 + ux * startGap, sy = y1 + uy * startGap;
  const exLine = x2 - ux * (endGap + head * 0.55), eyLine = y2 - uy * (endGap + head * 0.55);
  const tipx = x2 - ux * endGap, tipy = y2 - uy * endGap;
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(exLine, eyLine);
  ctx.stroke();
  arrowHead(ctx, tipx, tipy, ux, uy, head);
}

/* One arrow between two named squares, bent into an L when it is a knight's
   move a knight is actually making — `mayBend` is the caller's verdict on the
   piece, this function's is the geometry. */
function drawArrowBetween(
  ctx: CanvasRenderingContext2D, from: string, to: string, color: string,
  width: number, square: number, flipped: boolean, mayBend: boolean
) {
  const A = squareGrid(from, flipped), B = squareGrid(to, flipped);
  const dcol = Math.abs(A.col - B.col), drow = Math.abs(A.row - B.row);
  if (mayBend && ((dcol === 1 && drow === 2) || (dcol === 2 && drow === 1))) {
    // L-shaped knight arrow: long leg (2 squares) first, then the short leg.
    const bend = dcol === 2 ? { col: B.col, row: A.row } : { col: A.col, row: B.row };
    const pA = gridCenter(A, square), pM = gridCenter(bend, square), pB = gridCenter(B, square);
    const head = Math.max(square * 0.28, width * 2.4);
    const startGap = square * 0.3, endGap = square * 0.34;

    const d1x = pM.x - pA.x, d1y = pM.y - pA.y;
    const L1 = Math.hypot(d1x, d1y) || 1;
    const sx = pA.x + (d1x / L1) * startGap, sy = pA.y + (d1y / L1) * startGap;

    const d2x = pB.x - pM.x, d2y = pB.y - pM.y;
    const L2 = Math.hypot(d2x, d2y) || 1;
    const ux2 = d2x / L2, uy2 = d2y / L2;
    const tipx = pB.x - ux2 * endGap, tipy = pB.y - uy2 * endGap;
    const basex = tipx - ux2 * head * 0.55, basey = tipy - uy2 * head * 0.55;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(pM.x, pM.y);
    ctx.lineTo(basex, basey);
    ctx.stroke();
    arrowHead(ctx, tipx, tipy, ux2, uy2, head);
  } else {
    const p1 = gridCenter(A, square), p2 = gridCenter(B, square);
    drawStraight(ctx, p1.x, p1.y, p2.x, p2.y, color, width, square);
  }
}
