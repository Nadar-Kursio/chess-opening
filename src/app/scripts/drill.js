/* ---------------- drill ---------------- */
/* Move first, then read. The next move is hidden and you play it on the board;
   the explanation arrives as the answer to your attempt rather than as a preamble
   to it.

   How sharp the feedback can be depends on what the build shipped for the line:
     0  exact match only. A wrong move is "not the move this line plays" -- never
        "illegal", because with no legal-move list we genuinely cannot tell.
     1  `legal` present: real illegal-move rejection, and target hints.
     2  `branches` present: the author's reply to the move you actually played.
   Level 0 needs no content work, so every opening in the catalogue is drillable
   today and simply gets better as data lands. */
function dxLevel(line){
  const p = line.plies;
  for(let i=0;i<p.length;i++) if(p[i].bx !== undefined) return 2;
  for(let i=0;i<p.length;i++) if(p[i].legal) return 1;
  return 0;
}
const DX_LEVEL_LABEL = [
  "Checks against this line",
  "Checks legality + this line",
  "Full feedback on your move",
];

let dxTimer = null;

function dxOn(){ return state.view === "op" && state.mode === "drill"; }
function dxAsking(){ return dxOn() && state.drill.phase === "ask"; }
function dxHideArrows(){ return dxAsking(); }

function dxOp(){ return DATA.find(o=>o.id===state.opId); }
function dxLine(){ const op = dxOp(); return op && op.lines[state.line]; }
function dxSide(){ const op = dxOp(); return op && op.orientation === "black" ? "b" : "w"; }

/* The move the learner is being asked for: the one after the position on screen. */
function dxAnswer(){ return curSeq()[state.ply + 1] || null; }

function dxLearnerPlies(line){
  const side = dxSide();
  return line.plies.filter((p,i)=>i>0 && p.turn===side).length;
}

function dxSetMode(mode){
  stopPlay();
  state.mode = mode;
  state.sel = null;
  db.ui.mode = mode;
  if(mode === "drill") dxStart();
  else { state.drill.phase = "ask"; render(); }
  dbSave();
}

function dxStart(){
  const d = state.drill;
  d.phase = "ask"; d.hint = 0; d.tries = 0; d.seen = {};
  d.msg = ""; d.tone = ""; d.cursor = state.flip ? "e5" : "e4";
  d.streak = db.streak.cur | 0;
  state.ply = 0;
  state.sel = null;
  dxAdvanceToAsk();
  render();
  dxSay("Drill started. Play the move on the board.");
}

/* Play the opponent's moves for them until it is the learner's turn again.
   In an opening line that is exactly one move, but the loop is what makes the
   function correct rather than the alternation happening to hold. */
function dxAdvanceToAsk(){
  const side = dxSide();
  let next = dxAnswer();
  while(next && next.turn !== side){
    state.ply += 1;
    next = dxAnswer();
  }
  if(next) state.drill.phase = "ask";
  else dxFinish();
}

function dxFinish(){
  const d = state.drill;
  const line = dxLine();
  const asked = dxLearnerPlies(line);
  const right = Object.keys(d.seen).filter(k=>d.seen[k]==="right").length;
  const hints = Object.keys(d.seen).filter(k=>d.seen[k]==="assisted").length;
  const key = dbLineKey(state.opId, state.line);
  const prev = db.lines[key];
  const score = asked ? right / asked : 0;
  db.lines[key] = {
    asked, right, hints, done:true,
    best: Math.max(score, (prev && prev.best) || 0),
  };
  db.streak.cur = d.streak;
  dbSave();
  syncChrome();
  d.phase = "done";
}

/* ---- attempts ---- */

function dxTry(from, to){
  if(!dxOn() || state.drill.phase === "done") return;
  const here = curSeq()[state.ply];
  const answer = dxAnswer();
  if(!answer) return;

  const pair = mvNormalise(here.fen, from, to);
  from = pair[0]; to = pair[1];

  if(from === answer.from && to === answer.to){ dxRight(answer); return; }

  if(mvIsLegal(here, from, to) === false){ dxNope(here, from, to); return; }

  // An authored deviation answers the move actually played, which is the whole
  // point -- a generic "wrong" is what the level-0 fallback below is for.
  const hit = brMatch(state.ply, from, to);
  if(hit >= 0){
    state.drill.tries += 1;
    state.drill.streak = 0;
    db.streak.cur = 0;
    if(state.drill.seen[state.ply + 1] === undefined) state.drill.seen[state.ply + 1] = "wrong";
    brEnter(state.ply, hit, "drill");
    return;
  }
  dxWrong(here, from, to);
}

function dxRight(answer){
  const d = state.drill;
  const clean = d.tries === 0 && d.hint === 0;
  if(d.seen[state.ply + 1] === undefined) d.seen[state.ply + 1] = clean ? "right" : "assisted";
  if(clean){
    d.streak += 1;
    if(d.streak > (db.streak.best | 0)) db.streak.best = d.streak;
  }
  db.streak.cur = d.streak;
  state.sel = null;
  state.ply += 1;
  d.phase = "right"; d.tries = 0; d.hint = 0;
  d.msg = ""; d.tone = "ok";
  render();
  dxSay("Correct. " + answer.num + ".");
}

/* Legal but not this line's move. Deliberately not an error: most deviations are
   simply playable, and treating every one as a mistake teaches the wrong reflex.
   The author's specific answer arrives at level 2. */
function dxWrong(here, from, to){
  const d = state.drill;
  d.tries += 1;
  d.streak = 0;
  db.streak.cur = 0;
  if(d.seen[state.ply + 1] === undefined) d.seen[state.ply + 1] = "wrong";
  const name = mvName(here.fen, from, to);
  const level = dxLevel(dxLine());
  d.phase = "wrong";
  d.tone = level >= 1 ? "flat" : "warn";
  d.msg = level >= 1
    ? `<b>${name}</b> is legal — it just isn't the move this line teaches. ${dxPrinciple(here, from, to)}`
    : `<b>${name}</b> is not the move this line plays. Try another, or take a hint.`;
  state.sel = null;
  render();
  dxSay(name + ". Not this line's move.");
}

function dxNope(here, from, to){
  const d = state.drill;
  d.phase = "wrong";
  d.tone = "bad";
  d.msg = `That isn't a legal move here.`;
  state.sel = null;
  render();
  const sq = document.querySelector(`[data-sq="${to}"]`);
  if(sq){ sq.classList.add("dxnope"); setTimeout(()=>sq.classList.remove("dxnope"), 450); }
  dxSay("Not a legal move.");
}

/* True, and derivable from the board alone -- no authoring. The point is to tell
   a learner who has just played something reasonable that it WAS reasonable. */
function dxPrinciple(here, from, to){
  const ch = mvPieceAt(here.fen, from);
  const kind = String(ch).toLowerCase();
  const home = /^[a-h][18]$/.test(from);
  if(mvPieceAt(here.fen, to)) return "Taking material is rarely wrong; this line has a bigger idea in mind.";
  if(kind === "q" && state.ply < 8) return "Bringing the queen out this early usually costs time once it is attacked.";
  if(kind === "k") return "Moving the king before castling gives up the right to castle.";
  if((kind === "n" || kind === "b") && home) return "Developing a piece toward the centre is rarely wrong.";
  if(kind === "p") return "A quiet pawn move is playable — just slower than what this line wants.";
  return "Playable. This line has a specific idea in mind instead.";
}

/* ---- hints ---- */

function dxHint(){
  const d = state.drill;
  if(!dxOn() || d.phase === "done") return;
  if(d.hint >= 3){ return; }
  d.hint += 1;
  if(d.hint === 3){ dxShow(); return; }
  d.phase = "ask";
  render();
  dxSay(d.hint === 1 ? "Hint: which piece." : "Hint: the idea.");
}

function dxShow(){
  const d = state.drill;
  const answer = dxAnswer();
  if(!answer) return;
  if(d.seen[state.ply + 1] === undefined) d.seen[state.ply + 1] = "assisted";
  d.streak = 0;
  db.streak.cur = 0;
  state.sel = null;
  state.ply += 1;
  d.phase = "reveal"; d.hint = 0; d.tries = 0;
  d.msg = ""; d.tone = "flat";
  render();
  dxSay("The move is " + answer.san + ".");
}

function dxContinue(){
  const d = state.drill;
  if(d.phase === "done") return;
  d.msg = ""; d.tone = ""; d.hint = 0; d.tries = 0;
  state.sel = null;
  dxAdvanceToAsk();
  render();
}

function dxRetry(){
  if(!dxOn()) return;
  dxStart();
}

/* Mask the answer inside prose written for a reader who can already see it.
   Necessary, not cosmetic: an Italian note reads "the knight begins its famous
   journey: d2-f1-g3", which hands over the next two moves. */
function dxRedact(text, answer){
  if(!text || !answer) return text;
  let out = String(text);
  if(answer.san) out = out.split(answer.san).join("…");
  if(answer.to) out = out.replace(new RegExp("\\b" + answer.to + "\\b", "g"), "…");
  return out;
}

/* ---- view ---- */

function dxBarHTML(line){
  const level = dxLevel(line);
  return `
      <div class="dxbar">
        <div class="dxmodes" role="tablist" aria-label="Study mode">
          <button class="dxmode${state.mode==="read"?" on":""}" data-act="mode" data-v="read"
            role="tab" aria-selected="${state.mode==="read"}">Read</button>
          <button class="dxmode${state.mode==="drill"?" on":""}" data-act="mode" data-v="drill"
            role="tab" aria-selected="${state.mode==="drill"}"
            title="Play each move before it is shown">Drill</button>
        </div>
        <div class="dxbarend">
          <span class="dxlvl" title="How much this line can tell you about a wrong move">${DX_LEVEL_LABEL[level]}</span>
          <button class="dxdev${state.pick?" on":""}" data-act="deviate"
            ${state.branch?"disabled":""}>They deviated&hellip; <kbd>D</kbd></button>
        </div>
      </div>`;
}

function dxScoreHTML(line){
  const d = state.drill;
  const asked = dxLearnerPlies(line);
  const done = Object.keys(d.seen).length;
  const right = Object.keys(d.seen).filter(k=>d.seen[k]==="right").length;
  const pct = asked ? Math.round(100 * done / asked) : 0;
  return `
        <div class="dxhead">
          <span class="dxturn">${d.phase==="done" ? "Line complete"
            : `Your move &mdash; <b>${dxSide()==="w"?"White":"Black"}</b>`}</span>
          <span class="dxscore"><b>${right}</b> of <b>${asked}</b> first try
            <span class="sep">&middot;</span> streak <b>${d.streak}</b></span>
        </div>
        <div class="dxprogress" role="progressbar" aria-valuenow="${done}"
          aria-valuemin="0" aria-valuemax="${asked}"><i style="width:${pct}%"></i></div>`;
}

function dxHintsHTML(){
  const d = state.drill;
  const answer = dxAnswer();
  if(!answer || !d.hint) return "";
  const rungs = [];
  if(d.hint >= 1){
    const here = curSeq()[state.ply];
    rungs.push(`<li class="rung">Move your <b>${mvPieceName(mvPieceAt(here.fen, answer.from))}</b>.</li>`);
  }
  if(d.hint >= 2){
    const why = dxRedact(answer.note, answer) || dxRedact(answer.tactics, answer);
    rungs.push(`<li class="rung">${why}</li>`);
  }
  return `<ol class="dxhints">${rungs.join("")}</ol>`;
}

function dxPanelHTML(line){
  const d = state.drill;
  const played = curSeq()[state.ply];

  if(d.phase === "done"){
    const asked = dxLearnerPlies(line);
    const right = Object.keys(d.seen).filter(k=>d.seen[k]==="right").length;
    return `
      <div class="drill" data-phase="done" data-tone="ok">
        ${dxScoreHTML(line)}
        <p class="dxprompt">You played ${right} of ${asked} first time.</p>
        <div class="dxacts">
          <button class="ctl" data-act="retry">Drill again <kbd>R</kbd></button>
          <button class="ctl" data-act="mode" data-v="read">Read this line</button>
        </div>
      </div>`;
  }

  if(d.phase === "right" || d.phase === "reveal"){
    return `
      <div class="drill" data-phase="${d.phase}" data-tone="${d.tone}">
        ${dxScoreHTML(line)}
        <div class="cmtop">
          <span class="cmmove">${played.num}</span>
          <span class="cmwho">${d.phase==="right" ? "You played it" : "Shown to you"}</span>
        </div>
        <p class="cmtext">${played.note}</p>
        ${played.tactics?`<div class="tactics"><span class="lbl">On the board</span><span class="body">${tacticsHTML(played.tactics)}.</span></div>`:""}
        <div class="dxacts">
          <button class="ctl wide" data-act="continue">Continue &#8594; <kbd>↵</kbd></button>
        </div>
      </div>`;
  }

  // asking, or just answered wrongly
  return `
      <div class="drill" data-phase="${d.phase}" data-tone="${d.tone||"flat"}">
        ${dxScoreHTML(line)}
        ${d.msg?`<p class="dxmsg">${d.msg}</p>`:""}
        <p class="dxprompt">Play ${dxSide()==="w"?"White":"Black"}&rsquo;s move on the board.</p>
        ${played.note?`<p class="dxcontext">${dxRedact(played.note, dxAnswer())}</p>`:""}
        ${dxHintsHTML()}
        <div class="dxacts">
          <button class="ctl" data-act="hint">Hint <kbd>H</kbd></button>
          <button class="ctl" data-act="show">Show me <kbd>S</kbd></button>
          <button class="ctl" data-act="retry">Restart line <kbd>R</kbd></button>
        </div>
      </div>`;
}

/* ---- board input ---- */
/* Selection, hover targets and drag are class-only mutations. A render() here
   would delete the node under the pointer mid-drag, and the focused square
   mid-keystroke. */
function dxArm(){
  if(!dxArmed()) return;
  const board = document.getElementById("board");
  if(!board) return;
  board.classList.add("dxlive");
  board.setAttribute("role", "grid");
  const cur = state.drill.cursor;
  board.querySelectorAll("[data-sq]").forEach(sq=>{
    sq.setAttribute("role", "gridcell");
    sq.setAttribute("tabindex", sq.dataset.sq === cur ? "0" : "-1");
  });
  dxPaint();
}

function dxPaint(){
  const board = document.getElementById("board");
  if(!board) return;
  const here = curSeq()[state.ply];
  const targets = state.sel ? mvTargets(here, state.sel) : [];
  board.querySelectorAll("[data-sq]").forEach(sq=>{
    const name = sq.dataset.sq;
    sq.classList.toggle("dxsel", name === state.sel);
    sq.classList.toggle("dxcur", name === state.drill.cursor);
    const isTarget = targets.indexOf(name) >= 0;
    sq.classList.toggle("dxhint", isTarget);
    sq.classList.toggle("dxcap", isTarget && mvPieceAt(here.fen, name) !== "");
  });
}

/* Whose move it is in the position on screen -- which in drill is always the
   learner, and with the deviation picker open is always the opponent. */
function dxMoverSide(){
  const next = curSeq()[state.ply + 1];
  return next ? next.turn : (state.ply % 2 === 0 ? "w" : "b");
}

/* The board is live in two situations, and they want different answers. */
function dxArmed(){
  if(state.branch) return false;
  if(state.pick) return true;
  return dxOn() && (state.drill.phase === "ask" || state.drill.phase === "wrong");
}

function dxBoardMove(from, to){
  if(state.pick) brTry(from, to);
  else dxTry(from, to);
}

/* Read mode: the learner is showing me what the opponent played. */
function brTry(from, to){
  const here = curSeq()[state.ply];
  const pair = mvNormalise(here.fen, from, to);
  from = pair[0]; to = pair[1];

  const hit = brMatch(state.ply, from, to);
  if(hit >= 0){ brEnter(state.ply, hit, "read"); return; }

  const name = mvName(here.fen, from, to);
  if(mvIsLegal(here, from, to) === false){
    state.drill.msg = `<b>${name}</b> isn't a legal move in this position.`;
    state.drill.tone = "bad";
  } else {
    const next = curSeq()[state.ply + 1];
    state.drill.msg = `<b>${name}</b> isn't one I have notes on. `
      + (next?`This line plays <b>${next.san}</b>. `:"")
      + dxPrinciple(here, from, to);
    state.drill.tone = "flat";
  }
  state.sel = null;
  render();
  dxSay(name + ".");
}

function dxPick(sq){
  const here = curSeq()[state.ply];
  if(state.sel === sq){ state.sel = null; dxPaint(); return; }
  if(state.sel){ const from = state.sel; state.sel = null; dxBoardMove(from, sq); return; }
  if(!mvIsOwn(here.fen, sq, dxMoverSide())) return;
  state.sel = sq;
  state.drill.cursor = sq;
  dxPaint();
}

document.getElementById("content").addEventListener("pointerdown", e=>{
  if(!dxArmed()) return;
  const cell = e.target.closest("[data-sq]");
  if(!cell) return;
  const sq = cell.dataset.sq;
  const here = curSeq()[state.ply];
  e.preventDefault();

  if(!state.sel && mvIsOwn(here.fen, sq, dxMoverSide())){
    state.drag = {from:sq, id:e.pointerId};
    try{ cell.setPointerCapture(e.pointerId); }catch(err){}
  }
  dxPick(sq);
});

document.getElementById("content").addEventListener("pointerup", e=>{
  const drag = state.drag;
  if(!drag || drag.id !== e.pointerId) return;
  state.drag = null;
  const cell = document.elementFromPoint(e.clientX, e.clientY);
  const drop = cell && cell.closest && cell.closest("[data-sq]");
  if(!drop || drop.dataset.sq === drag.from) return;   // a click, not a drag
  state.sel = null;
  dxBoardMove(drag.from, drop.dataset.sq);
});

/* ---- keyboard ---- */
/* Returns true when it has handled the key, so the page-level handler can bail. */
function dxKey(e){
  if(e.metaKey || e.ctrlKey || e.altKey) return false;
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return false;
  if(state.view !== "op") return false;

  const k = e.key;
  const d = state.drill;

  // Escape unwinds one layer at a time, innermost first.
  if(k === "Escape"){
    if(state.sel){ state.sel = null; dxPaint(); return true; }
    if(state.pick){ state.pick = false; render(); return true; }
    if(state.branch){ brExit(); return true; }
    return false;
  }
  if(k === "d" || k === "D"){ if(!state.branch){ ACTIONS.deviate(); return true; } return false; }
  if(state.branch){
    if(k === "ArrowRight"){ step(1); return true; }
    if(k === "ArrowLeft"){ step(-1); return true; }
    return false;
  }
  if(k === "m" || k === "M"){ dxSetMode(state.mode === "drill" ? "read" : "drill"); return true; }
  if(!dxOn()) return false;

  if(k === "h" || k === "H"){ dxHint(); return true; }
  if(k === "s" || k === "S"){ dxShow(); return true; }
  if(k === "r" || k === "R"){ dxRetry(); return true; }

  if((k === "Enter" || k === " ") && (d.phase === "right" || d.phase === "reveal")){
    dxContinue(); return true;
  }

  const board = document.getElementById("board");
  const onBoard = board && board.contains(document.activeElement);
  if(!onBoard) return dxAsking() && (k === "ArrowRight" || k === "End");   // never reveal by stepping

  if(k === "Enter" || k === " "){ dxPick(d.cursor); return true; }
  // Not `step`: that is the global that moves through a line, and shadowing it
  // here puts the earlier step() calls in this function into its dead zone.
  const delta = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,1], ArrowDown:[0,-1]}[k];
  if(delta){
    const file = FILES.indexOf(d.cursor[0]) + (state.flip ? -delta[0] : delta[0]);
    const rank = (+d.cursor[1]) + (state.flip ? -delta[1] : delta[1]);
    if(file >= 0 && file < 8 && rank >= 1 && rank <= 8){
      d.cursor = FILES[file] + rank;
      dxPaint();
      const cell = board.querySelector(`[data-sq="${d.cursor}"]`);
      if(cell){ board.querySelectorAll("[data-sq]").forEach(s=>s.setAttribute("tabindex","-1"));
                cell.setAttribute("tabindex","0"); cell.focus(); }
    }
    return true;
  }
  return false;
}

ACTIONS.mode     = t=>dxSetMode(t.dataset.v);
ACTIONS.hint     = ()=>dxHint();
ACTIONS.show     = ()=>dxShow();
ACTIONS.retry    = ()=>dxRetry();
ACTIONS.continue = ()=>dxContinue();
