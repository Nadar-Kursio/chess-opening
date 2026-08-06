import type { Ply, Turn } from "@/lib/content/types";

/* Reading the position. No chess rules live here: the build is the only thing
   that knows legality, and this file reads the 64-char board string and
   whatever the build chose to ship alongside it. */

export const FILES = "abcdefgh";
export const PIECE_GLYPH: Record<string, string> = {
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

/* The board string runs rank 8 first, so index = (7 - rank) * 8 + file. */
export function squareIndex(sq: string): number {
  return (8 - +sq[1]) * 8 + FILES.indexOf(sq[0]);
}

export function pieceAt(fen: string, sq: string): string {
  const ch = fen[squareIndex(sq)];
  return ch === "." ? "" : ch;
}

export function sideOf(ch: string): Turn {
  return ch === ch.toUpperCase() ? "w" : "b";
}

export function isOwnPiece(fen: string, sq: string, side: Turn): boolean {
  const ch = pieceAt(fen, sq);
  return !!ch && sideOf(ch) === side;
}

const PIECE_NAMES: Record<string, string> = {
  k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn",
};
export function pieceName(ch: string): string {
  return PIECE_NAMES[String(ch).toLowerCase()] || "piece";
}

/* `legal` is fixed-width 4-char UCI records. A match has to land on a record
   boundary: a plain indexOf would happily match the tail of one move against
   the head of the next and call an illegal move legal. */
export function isLegalMove(ply: Ply | undefined, from: string, to: string): boolean | null {
  if (!ply || !ply.legal) return null; // this line ships no legal data
  const i = ply.legal.indexOf(from + to);
  return i >= 0 && i % 4 === 0;
}

export function legalTargets(ply: Ply | undefined, from: string): string[] {
  const out: string[] = [];
  if (!ply || !ply.legal) return out;
  for (let i = 0; i < ply.legal.length; i += 4) {
    if (ply.legal.slice(i, i + 2) === from) out.push(ply.legal.slice(i + 2, i + 4));
  }
  return out;
}

/* Castling can be expressed either way — king two squares, or king onto its own
   rook. They are the same move, and the data records the king's from/to. */
export function normaliseMove(fen: string, from: string, to: string): [string, string] {
  const piece = pieceAt(fen, from);
  const target = pieceAt(fen, to);
  if (piece && target && piece.toLowerCase() === "k" && target.toLowerCase() === "r"
      && sideOf(piece) === sideOf(target)) {
    return [from, (to[0] === "h" ? "g" : "c") + from[1]];
  }
  return [from, to];
}

/* Enough of a move name to quote the learner's attempt back at them. Not real
   SAN — it only ever appears inside feedback. */
export function moveName(fen: string, from: string, to: string): string {
  const ch = pieceAt(fen, from);
  if (!ch) return to;
  const kind = ch.toLowerCase();
  const takes = pieceAt(fen, to) !== "";
  if (kind === "k" && Math.abs(FILES.indexOf(to[0]) - FILES.indexOf(from[0])) === 2) {
    return FILES.indexOf(to[0]) > FILES.indexOf(from[0]) ? "O-O" : "O-O-O";
  }
  if (kind === "p") return (takes ? from[0] + "x" : "") + to;
  return ch.toUpperCase() + (takes ? "x" : "") + to;
}

/* Interpolating authored prose into HTML is how the coach card is built, so the
   one place a stray < could break the page gets a helper. */
export function esc(s: unknown): string {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* Bold the square coordinates in a sentence about the board. */
export function squaresHTML(t: unknown): string {
  return String(t).replace(/\b([a-h][1-8])\b/g, "<b>$1</b>");
}
export function tacticsHTML(t: string): string {
  return squaresHTML(t.charAt(0).toUpperCase() + t.slice(1));
}
