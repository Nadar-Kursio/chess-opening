/* ---- Canvas arrow overlay (chess.com-style). Robust: uses Canvas 2D, not SVG. ---- */
const ARROW_COLORS = {
  atk:  "rgba(210,75,60,0.82)",
  def:  "rgba(78,138,214,0.80)",
  move: "rgba(124,163,90,0.72)",
  chk:  "rgba(234,59,51,0.92)",
  ctrl: "rgba(224,180,74,0.85)"
};
const ARROW_ON = { move:true, atk:true, chk:true, def:true, ctrl:true };

// Bold the square coordinates inside the auto-generated tactics sentence.
function tacticsHTML(t){
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return t.replace(/\b([a-h][1-8])\b/g, "<b>$1</b>");
}

function sqCenter(name, sq, flip){
  const file = FILES.indexOf(name[0]), rank = (+name[1]) - 1;
  const col = flip ? 7-file : file;
  const row = flip ? rank  : 7-rank;
  return { x:(col+0.5)*sq, y:(row+0.5)*sq };
}
function colrow(name, flip){
  const file = FILES.indexOf(name[0]), rank = (+name[1]) - 1;
  return { col: flip ? 7-file : file, row: flip ? rank : 7-rank };
}
function center(cr, sq){ return { x:(cr.col+0.5)*sq, y:(cr.row+0.5)*sq }; }

function drawArrows(){
  const cv = document.getElementById("arrowlayer");
  const board = document.getElementById("board");
  if(!cv || !board) return;
  const size = board.clientWidth;
  if(!size) return;
  const dpr = window.devicePixelRatio || 1;
  cv.width = size * dpr; cv.height = size * dpr;
  cv.style.width = size + "px"; cv.style.height = size + "px";
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,size,size);

  // Ahead of both gates below: a rejected attempt has to stay visible in the
  // phase where the book arrows are suppressed, and whether the learner has the
  // arrow overlay switched on is a separate question from whether they can see
  // the move they just tried.
  dxDrawBad(ctx, size/8);

  if(!state.arrows || dxHideArrows()) return;

  const ply = curPly();
  const arrows = (ply && ply.arrows) || [];
  const sq = size/8;

  // draw control rings first (under the lines)
  arrows.filter(a=>a.k==="ctrl" && ARROW_ON.ctrl).forEach(a=>{
    const c = sqCenter(a.t, sq, state.flip);
    ctx.beginPath();
    ctx.arc(c.x, c.y, sq*0.34, 0, Math.PI*2);
    ctx.lineWidth = Math.max(2, sq*0.05);
    ctx.strokeStyle = ARROW_COLORS.ctrl;
    ctx.setLineDash([sq*0.14, sq*0.10]);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // then the arrows, move first (so attack/check sit on top)
  const order = {move:0, def:1, atk:2, chk:3};
  arrows.filter(a=>a.k!=="ctrl" && ARROW_ON[a.k])
        .sort((a,b)=>(order[a.k]||0)-(order[b.k]||0))
        .forEach(a=>{
    const color = ARROW_COLORS[a.k]||"#999";
    const width = a.k==="chk" ? sq*0.16 : (a.k==="move" ? sq*0.10 : sq*0.13);
    const A = colrow(a.f, state.flip), B = colrow(a.t, state.flip);
    const dcol = Math.abs(A.col-B.col), drow = Math.abs(A.row-B.row);
    const isKnight = (dcol===1 && drow===2) || (dcol===2 && drow===1);
    if(isKnight){
      drawBentArrow(ctx, A, B, color, width, sq);   // L-shaped, chess.com style
    } else {
      const p1 = center(A, sq), p2 = center(B, sq);
      drawArrow(ctx, p1.x, p1.y, p2.x, p2.y, color, width, sq);
    }
  });
}

function arrowHead(ctx, tipx, tipy, ux, uy, head){
  const ang = Math.atan2(uy, ux), a = 0.42;
  ctx.beginPath();
  ctx.moveTo(tipx, tipy);
  ctx.lineTo(tipx - head*Math.cos(ang-a), tipy - head*Math.sin(ang-a));
  ctx.lineTo(tipx - head*Math.cos(ang+a), tipy - head*Math.sin(ang+a));
  ctx.closePath(); ctx.fill();
}

function drawArrow(ctx, x1, y1, x2, y2, color, width, sq){
  const dx = x2-x1, dy = y2-y1, len = Math.hypot(dx,dy) || 1;
  const ux = dx/len, uy = dy/len;
  const head = Math.max(sq*0.28, width*2.4);
  const startGap = sq*0.30, endGap = sq*0.34;
  const sx = x1 + ux*startGap, sy = y1 + uy*startGap;
  const exLine = x2 - ux*(endGap+head*0.55), eyLine = y2 - uy*(endGap+head*0.55);
  const tipx = x2 - ux*endGap, tipy = y2 - uy*endGap;
  ctx.lineCap = "round";
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(exLine,eyLine); ctx.stroke();
  arrowHead(ctx, tipx, tipy, ux, uy, head);
}

// L-shaped knight arrow: long leg (2 squares) first, then the short leg (1 square).
function drawBentArrow(ctx, A, B, color, width, sq){
  const bend = (Math.abs(A.col-B.col)===2) ? {col:B.col, row:A.row}   // long leg horizontal
                                            : {col:A.col, row:B.row};  // long leg vertical
  const pA = center(A, sq), pM = center(bend, sq), pB = center(B, sq);
  const head = Math.max(sq*0.28, width*2.4);
  const startGap = sq*0.30, endGap = sq*0.34;

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
