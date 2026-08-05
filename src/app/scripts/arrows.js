/* ---- Canvas arrow overlay (chess.com-style). Robust: uses Canvas 2D, not SVG. ---- */
const ARROW_COLORS = {
  atk:  "rgba(210,75,60,0.82)",
  def:  "rgba(78,138,214,0.80)",
  move: "rgba(124,163,90,0.72)",
  chk:  "rgba(234,59,51,0.92)",
  ctrl: "rgba(224,180,74,0.85)",
  mine: "rgba(168,116,208,0.88)",    // --mine in tokens.css; change both
  live: "rgba(168,116,208,0.45)"     // the same mark, still being dragged out
};
const ARROW_ON = { move:true, atk:true, chk:true, def:true, ctrl:true };

// Bold the square coordinates in a sentence about the board.
function squaresHTML(t){
  return String(t).replace(/\b([a-h][1-8])\b/g, "<b>$1</b>");
}
function tacticsHTML(t){
  return squaresHTML(t.charAt(0).toUpperCase() + t.slice(1));
}

function squareCenter(name, size, flipped){
  const file = FILES.indexOf(name[0]), rank = (+name[1]) - 1;
  const col = flipped ? 7-file : file;
  const row = flipped ? rank  : 7-rank;
  return { x:(col+0.5)*size, y:(row+0.5)*size };
}
function squareGrid(name, flipped){
  const file = FILES.indexOf(name[0]), rank = (+name[1]) - 1;
  return { col: flipped ? 7-file : file, row: flipped ? rank : 7-rank };
}
function gridCenter(cr, size){ return { x:(cr.col+0.5)*size, y:(cr.row+0.5)*size }; }

function drawArrows(){
  const canvas = document.getElementById("arrowlayer");
  const board = document.getElementById("board");
  if(!canvas || !board) return;
  const size = board.clientWidth;
  if(!size) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + "px"; canvas.style.height = size + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,size,size);

  // Ahead of every gate below: a refused attempt has to stay visible in the
  // phase where the book arrows are suppressed, and which overlays the learner
  // has switched on is a separate question from whether they can see the move
  // they just tried.
  drillDrawRejected(ctx, size/8);

  if(drillHidesArrows()) return;
  if(state.arrows) drawMoveArrows(ctx, size/8);
  // Last, so your own mark is never the thing buried under five engine arrows.
  if(state.mine) drawMyMarks(ctx, size/8);
}

/* What the move that was just played attacks, defends and controls. */
function drawMoveArrows(ctx, square){
  const ply = currentPly();
  const arrows = (ply && ply.arrows) || [];

  // draw control rings first (under the lines)
  arrows.filter(a=>a.k==="ctrl" && ARROW_ON.ctrl).forEach(a=>{
    drawRing(ctx, a.t, ARROW_COLORS.ctrl, square, [square*0.14, square*0.10]);
  });

  // then the arrows, move first (so attack/check sit on top)
  const order = {move:0, def:1, atk:2, chk:3};
  arrows.filter(a=>a.k!=="ctrl" && ARROW_ON[a.k])
        .sort((a,b)=>(order[a.k]||0)-(order[b.k]||0))
        .forEach(a=>{
    const width = a.k==="chk" ? square*0.16 : (a.k==="move" ? square*0.10 : square*0.13);
    drawArrowBetween(ctx, a.f, a.t, ARROW_COLORS[a.k]||"#999", width, square);
  });
}

/* What YOU said about the position: the arrows and circled squares beside a
   note, whether it came from src/content/notes/ or was drawn here. Nothing
   engine-derived reaches this function -- these are drawn exactly as they were
   authored, which is the point of them.

   While the editor is open it is the working copy that draws, so a mark appears
   under the pointer and disappears again on Cancel. */
function drawMyMarks(ctx, square){
  const mine = state.note || noteShown(currentPly());
  if(mine){
    (mine.spots || []).forEach(sq=>drawRing(ctx, sq, ARROW_COLORS.mine, square));
    (mine.arrows || []).forEach(a=>{
      drawArrowBetween(ctx, a.f, a.t, ARROW_COLORS.mine, square*0.12, square);
    });
  }
  // The mark being made: a rubber band under the finger, and the tail of a
  // two-tap arrow waiting for its second square.
  const d = state.drawing;
  if(d && d.to !== d.from) drawArrowBetween(ctx, d.from, d.to, ARROW_COLORS.live, square*0.12, square);
  else if(d) drawRing(ctx, d.from, ARROW_COLORS.live, square);
  if(state.note && state.note.from) drawRing(ctx, state.note.from, ARROW_COLORS.live, square);
}

/* One arrow between two named squares, bent into an L when it is shaped like a
   knight's move. Every arrow the page draws comes through here. */
function drawArrowBetween(ctx, from, to, color, width, square){
  const A = squareGrid(from, state.flipped), B = squareGrid(to, state.flipped);
  const dcol = Math.abs(A.col-B.col), drow = Math.abs(A.row-B.row);
  if((dcol===1 && drow===2) || (dcol===2 && drow===1)){
    drawBentArrow(ctx, A, B, color, width, square);   // L-shaped, chess.com style
  } else {
    const p1 = gridCenter(A, square), p2 = gridCenter(B, square);
    drawArrow(ctx, p1.x, p1.y, p2.x, p2.y, color, width, square);
  }
}

function drawRing(ctx, sq, color, square, dash){
  const c = squareCenter(sq, square, state.flipped);
  ctx.beginPath();
  ctx.arc(c.x, c.y, square*0.34, 0, Math.PI*2);
  ctx.lineWidth = Math.max(2, square*0.05);
  ctx.strokeStyle = color;
  ctx.setLineDash(dash || []);
  ctx.stroke();
  ctx.setLineDash([]);
}

function arrowHead(ctx, tipx, tipy, ux, uy, head){
  const ang = Math.atan2(uy, ux), a = 0.42;
  ctx.beginPath();
  ctx.moveTo(tipx, tipy);
  ctx.lineTo(tipx - head*Math.cos(ang-a), tipy - head*Math.sin(ang-a));
  ctx.lineTo(tipx - head*Math.cos(ang+a), tipy - head*Math.sin(ang+a));
  ctx.closePath(); ctx.fill();
}

function drawArrow(ctx, x1, y1, x2, y2, color, width, square){
  const dx = x2-x1, dy = y2-y1, len = Math.hypot(dx,dy) || 1;
  const ux = dx/len, uy = dy/len;
  const head = Math.max(square*0.28, width*2.4);
  const startGap = square*0.30, endGap = square*0.34;
  const sx = x1 + ux*startGap, sy = y1 + uy*startGap;
  const exLine = x2 - ux*(endGap+head*0.55), eyLine = y2 - uy*(endGap+head*0.55);
  const tipx = x2 - ux*endGap, tipy = y2 - uy*endGap;
  ctx.lineCap = "round";
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(exLine,eyLine); ctx.stroke();
  arrowHead(ctx, tipx, tipy, ux, uy, head);
}

// L-shaped knight arrow: long leg (2 squares) first, then the short leg (1 square).
function drawBentArrow(ctx, A, B, color, width, square){
  const bend = (Math.abs(A.col-B.col)===2) ? {col:B.col, row:A.row}   // long leg horizontal
                                           : {col:A.col, row:B.row};  // long leg vertical
  const pA = gridCenter(A, square), pM = gridCenter(bend, square), pB = gridCenter(B, square);
  const head = Math.max(square*0.28, width*2.4);
  const startGap = square*0.30, endGap = square*0.34;

  // first leg direction (origin -> bend), used only to trim the start
  const d1x = pM.x-pA.x, d1y = pM.y-pA.y, L1 = Math.hypot(d1x,d1y)||1;
  const sx = pA.x + d1x/L1*startGap, sy = pA.y + d1y/L1*startGap;

  // second leg direction (bend -> target), used for the head
  const d2x = pB.x-pM.x, d2y = pB.y-pM.y, L2 = Math.hypot(d2x,d2y)||1;
  const ux2 = d2x/L2, uy2 = d2y/L2;
  const tipx = pB.x - ux2*endGap, tipy = pB.y - uy2*endGap;
  const basex = tipx - ux2*head*0.55, basey = tipy - uy2*head*0.55;

  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(pM.x, pM.y);     // the corner
  ctx.lineTo(basex, basey);   // stop short of the tip
  ctx.stroke();
  arrowHead(ctx, tipx, tipy, ux2, uy2, head);
}

window.addEventListener("resize", drawArrows);
