/* ---------------- move helpers ---------------- */
/* No chess rules live here. The build is the only thing that knows legality;
   this file reads the 64-char board string and whatever the build chose to ship
   alongside it. */

/* The board string runs rank 8 first, so index = (7 - rank) * 8 + file --
   the same indexing boardCells() already assumes. */
function mvIdx(sq){
  return (8 - (+sq[1])) * 8 + FILES.indexOf(sq[0]);
}
function mvPieceAt(fen, sq){
  const ch = fen[mvIdx(sq)];
  return ch === "." ? "" : ch;
}
function mvSideOf(ch){ return ch === ch.toUpperCase() ? "w" : "b"; }
function mvIsOwn(fen, sq, side){
  const ch = mvPieceAt(fen, sq);
  return !!ch && mvSideOf(ch) === side;
}

const MV_NAMES = {k:"king", q:"queen", r:"rook", b:"bishop", n:"knight", p:"pawn"};
function mvPieceName(ch){ return MV_NAMES[String(ch).toLowerCase()] || "piece"; }

/* `legal` is fixed-width 4-char UCI records. A match has to land on a record
   boundary: a plain indexOf would happily match the tail of one move against the
   head of the next and call an illegal move legal. */
function mvIsLegal(ply, from, to){
  if(!ply || !ply.legal) return null;        // this line ships no legal data
  const i = ply.legal.indexOf(from + to);
  return i >= 0 && i % 4 === 0;
}
function mvTargets(ply, from){
  const out = [];
  if(!ply || !ply.legal) return out;
  for(let i=0;i<ply.legal.length;i+=4){
    if(ply.legal.slice(i, i+2) === from) out.push(ply.legal.slice(i+2, i+4));
  }
  return out;
}

/* Castling can be expressed either way -- king two squares, or king onto its own
   rook. They are the same move, and the data records the king's from/to. */
function mvNormalise(fen, from, to){
  const p = mvPieceAt(fen, from), t = mvPieceAt(fen, to);
  if(p && t && p.toLowerCase()==="k" && t.toLowerCase()==="r" && mvSideOf(p)===mvSideOf(t)){
    return [from, (to[0] === "h" ? "g" : "c") + from[1]];
  }
  return [from, to];
}

/* Enough of a move name to quote the learner's attempt back at them. Not real
   SAN -- no disambiguation, no check marks -- and it never needs to be, because
   it only ever appears inside feedback. */
function mvName(fen, from, to){
  const ch = mvPieceAt(fen, from);
  if(!ch) return to;
  const kind = ch.toLowerCase();
  const takes = mvPieceAt(fen, to) !== "";
  if(kind === "k" && Math.abs(FILES.indexOf(to[0]) - FILES.indexOf(from[0])) === 2){
    return FILES.indexOf(to[0]) > FILES.indexOf(from[0]) ? "O-O" : "O-O-O";
  }
  if(kind === "p") return (takes ? from[0] + "x" : "") + to;
  return ch.toUpperCase() + (takes ? "x" : "") + to;
}
