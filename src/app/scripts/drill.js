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
function feedbackLevel(line){
  const p = line.plies;
  for(let i=0;i<p.length;i++) if(p[i].bx !== undefined) return 2;
  for(let i=0;i<p.length;i++) if(p[i].legal) return 1;
  return 0;
}
/* One vocabulary for the depth of feedback, used by the nav badge and the study
   panel alike. Naming them for what they DO avoids calling the shallow end
   unfinished: a Core line drills perfectly well, it just cannot tell an illegal
   move from a merely off-book one, and it says so. */
const FEEDBACK_LEVELS = [
  {tag:"Core",
   blurb:"drills the line; cannot yet tell an illegal move from an off-book one"},
  {tag:"Checked",
   blurb:"knows every legal move, so it tells an illegal move from an off-book one"},
  {tag:"Coached",
   blurb:"answers the move you actually played"},
];

/* An opening is only as good as its weakest line -- claiming Coached because
   one line out of four is would be a promise the other three break. */
function openingFeedbackLevel(op){
  return op.lines.reduce((low, line)=>Math.min(low, feedbackLevel(line)), 2);
}

function openingFeedbackTitle(op){
  const lv = openingFeedbackLevel(op);
  const deviations = (op.branchsets || []).reduce((n,s)=>n+s.length, 0);
  return `${FEEDBACK_LEVELS[lv].tag} — ${FEEDBACK_LEVELS[lv].blurb}`
       + (deviations ? `, with ${deviations} deviations written` : "");
}

let drillTimer = null;

function drillOn(){ return state.view === "op" && state.mode === "drill"; }
function drillAsking(){ return drillOn() && state.drill.phase === "ask"; }
function drillHidesArrows(){ return drillAsking(); }

function drillSide(){ const op = currentOpening(); return op && op.orientation === "black" ? "b" : "w"; }

/* The move the learner is being asked for: the one after the position on screen. */
function drillAnswer(){ return currentPlies()[state.ply + 1] || null; }

/* Playing both sides means every move in the line is a question, so the score is
   out of all of them rather than out of your own colour's. */
function drillAskedCount(line){
  if(state.drill.bothSides) return line.plies.length - 1;
  const side = drillSide();
  return line.plies.filter((p,i)=>i>0 && p.turn===side).length;
}

function setMode(mode){
  stopAutoplay();
  state.mode = mode;
  state.selected = null;
  if(mode === "drill") drillStart();
  else { state.drill.phase = "ask"; render(); }
}

/* State only. `go()` calls this while it is still assembling the next view, and
   a render() in the middle of that would draw a half-built one. */
function drillReset(){
  const d = state.drill;
  d.phase = "ask"; d.hint = 0; d.tries = 0; d.seen = {}; d.rejected = null;
  d.verdict = ""; d.tone = ""; d.cursor = state.flipped ? "e5" : "e4";
  d.streak = db.streak.cur | 0;   // bothSides is a preference and deliberately survives
  state.ply = 0;
  state.selected = null;
  drillAdvanceToAsk();
}

function drillStart(){
  drillReset();
  render();
  announce("Drill started. Play the move on the board.");
}

/* Play the opponent's moves for them until it is the learner's turn again.
   In an opening line that is exactly one move, but the loop is what makes the
   function correct rather than the alternation happening to hold.

   With bothSides on nothing is played for you: every move is a question, which
   is how you drill a line you have to know from both ends. */
function drillAdvanceToAsk(){
  const side = drillSide();
  let next = drillAnswer();
  while(!state.drill.bothSides && next && next.turn !== side){
    state.ply += 1;
    next = drillAnswer();
  }
  if(next) state.drill.phase = "ask";
  else drillFinish();
}

function drillFinish(){
  const d = state.drill;
  const line = currentLine();
  const asked = drillAskedCount(line);
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
  syncAppbar();
  d.phase = "done";
}

/* ---- attempts ---- */

/* Standing on an answered move, with the opponent's reply still to come. With
   bothSides on the reply is a real question instead, so this is false. */
function drillReplying(){
  const d = state.drill;
  return !d.bothSides && (d.phase === "right" || d.phase === "reveal") && !!drillAnswer();
}

function drillPlayReply(answer){
  const d = state.drill;
  state.ply += 1;
  state.selected = null;
  d.rejected = null; d.verdict = ""; d.tone = ""; d.hint = 0; d.tries = 0;
  drillAdvanceToAsk();
  render();
  announce(answer.num + ". Your move.");
}

/* Naming the reply costs nothing: Continue was about to play it anyway, and
   nothing here is being scored. */
function drillWrongReply(here, from, to, answer){
  const d = state.drill;
  d.rejected = {from, to, kind:"wrong"};
  d.tone = "flat";
  d.verdict = `<b>${moveName(here.fen, from, to)}</b> isn't the reply this line plays &mdash; `
            + `it goes <b>${answer.san}</b>.`;
  state.selected = null;
  render();
  announce("Not the reply. The line plays " + answer.san + ".");
}

function drillTry(from, to){
  if(!drillOn() || state.drill.phase === "done") return;
  const here = currentPlies()[state.ply];
  const answer = drillAnswer();
  if(!answer) return;

  const pair = normaliseMove(here.fen, from, to);
  from = pair[0]; to = pair[1];

  // After your move is accepted, the reply is not a question -- you have already
  // been marked. Playing it on the board is just a nicer way to press Continue,
  // so it neither scores nor breaks a streak.
  if(drillReplying()){
    if(from === answer.from && to === answer.to){ drillPlayReply(answer); return; }
    drillWrongReply(here, from, to, answer);
    return;
  }

  if(from === answer.from && to === answer.to){ drillRight(answer); return; }

  if(isLegalMove(here, from, to) === false){ drillIllegal(here, from, to); return; }

  // An authored deviation answers the move actually played, which is the whole
  // point -- a generic "wrong" is what the level-0 fallback below is for.
  const hit = devMatch(state.ply, from, to);
  if(hit >= 0){
    state.drill.tries += 1;
    state.drill.streak = 0;
    db.streak.cur = 0;
    if(state.drill.seen[state.ply + 1] === undefined) state.drill.seen[state.ply + 1] = "wrong";
    devEnter(state.ply, hit, "drill");
    return;
  }
  drillWrong(here, from, to);
}

function drillRight(answer){
  const d = state.drill;
  const clean = d.tries === 0 && d.hint === 0;
  if(d.seen[state.ply + 1] === undefined) d.seen[state.ply + 1] = clean ? "right" : "assisted";
  if(clean){
    d.streak += 1;
    if(d.streak > (db.streak.best | 0)) db.streak.best = d.streak;
  }
  db.streak.cur = d.streak;
  state.selected = null;
  state.ply += 1;
  d.phase = "right"; d.tries = 0; d.hint = 0;
  d.verdict = ""; d.tone = "ok"; d.rejected = null;
  render();
  announce("Correct. " + answer.num + ".");
}

/* Legal but not this line's move. Deliberately not an error: most deviations are
   simply playable, and treating every one as a mistake teaches the wrong reflex.
   The author's specific answer arrives at level 2. */
function drillWrong(here, from, to){
  const d = state.drill;
  d.tries += 1;
  d.streak = 0;
  db.streak.cur = 0;
  if(d.seen[state.ply + 1] === undefined) d.seen[state.ply + 1] = "wrong";
  const name = moveName(here.fen, from, to);
  const level = feedbackLevel(currentLine());
  d.phase = "wrong";
  d.tone = level >= 1 ? "flat" : "warn";
  d.verdict = level >= 1
    ? `<b>${name}</b> is legal — it just isn't the move this line teaches. ${movePrinciple(here, from, to)}`
    : `<b>${name}</b> is not the move this line plays. Try another, or take a hint.`;
  d.rejected = {from, to, kind:"wrong"};
  state.selected = null;
  render();
  announce(name + ". Not this line's move.");
}

function drillIllegal(here, from, to){
  const d = state.drill;
  d.phase = "wrong";
  d.tone = "bad";
  d.verdict = `<b>${moveName(here.fen, from, to)}</b> isn't a legal move here.`;
  d.rejected = {from, to, kind:"illegal"};
  state.selected = null;
  render();
  announce("Not a legal move.");
}

/* True, and derivable from the board alone -- no authoring. The point is to tell
   a learner who has just played something reasonable that it WAS reasonable. */
function movePrinciple(here, from, to){
  const ch = pieceAt(here.fen, from);
  const kind = String(ch).toLowerCase();
  const home = /^[a-h][18]$/.test(from);
  if(pieceAt(here.fen, to)) return "Taking material is rarely wrong; this line has a bigger idea in mind.";
  if(kind === "q" && state.ply < 8) return "Bringing the queen out this early usually costs time once it is attacked.";
  if(kind === "k") return "Moving the king before castling gives up the right to castle.";
  if((kind === "n" || kind === "b") && home) return "Developing a piece toward the centre is rarely wrong.";
  if(kind === "p") return "A quiet pawn move is playable — just slower than what this line wants.";
  return "Playable. This line has a specific idea in mind instead.";
}

/* ---- hints ---- */

function drillHint(){
  const d = state.drill;
  if(!drillOn() || d.phase === "done") return;
  if(d.hint >= 3) return;
  d.hint += 1;
  if(d.hint === 3){ drillShow(); return; }
  d.phase = "ask";
  render();
  announce(d.hint === 1 ? "Hint: which piece." : "Hint: the idea.");
}

function drillShow(){
  const d = state.drill;
  const answer = drillAnswer();
  if(!answer) return;
  if(d.seen[state.ply + 1] === undefined) d.seen[state.ply + 1] = "assisted";
  d.streak = 0;
  db.streak.cur = 0;
  state.selected = null;
  state.ply += 1;
  d.phase = "reveal"; d.hint = 0; d.tries = 0;
  d.verdict = ""; d.tone = "flat"; d.rejected = null;
  render();
  announce("The move is " + answer.san + ".");
}

function drillContinue(){
  const d = state.drill;
  if(d.phase === "done") return;
  d.verdict = ""; d.tone = ""; d.hint = 0; d.tries = 0; d.rejected = null;
  state.selected = null;
  drillAdvanceToAsk();
  render();
}

function drillRestart(){
  if(!drillOn()) return;
  drillStart();
}

/* Mask the answer inside prose written for a reader who can already see it.
   Necessary, not cosmetic: an Italian note reads "the knight begins its famous
   journey: d2-f1-g3", which hands over the next two moves. */
function drillRedact(text, answer){
  if(!text || !answer) return text;
  let out = String(text);
  if(answer.san) out = out.split(answer.san).join("…");
  if(answer.to) out = out.replace(new RegExp("\\b" + answer.to + "\\b", "g"), "…");
  return out;
}

/* ---- view ---- */

/* Read or drill, and -- in either -- "they played something else". The two live
   in one bar because they are the two questions you can ask of a position: show
   me the line, or answer the move in front of me. */
function modeBarHTML(line){
  const level = feedbackLevel(line);
  return `
    <div class="study__modes">
      <div class="segmented" role="group" aria-label="How to study this line">
        <button class="seg" data-act="mode" data-v="read"
          aria-pressed="${state.mode==="read"}">Read</button>
        <button class="seg" data-act="mode" data-v="drill"
          aria-pressed="${state.mode==="drill"}"
          title="Play each move before it is shown">Drill</button>
      </div>
      ${state.mode==="drill"?`<button class="pill${state.drill.bothSides?" on":""}"
        data-act="bothsides" aria-pressed="${state.drill.bothSides}"
        title="${state.drill.bothSides
          ? "Answering for both colours. Switch back to only your own."
          : "Answer for both colours instead of having the replies played for you."}"
        ><span class="glyph" aria-hidden="true">⇄</span>Both sides</button>`:""}
      <span class="spacer"></span>
      <span class="feedback-level feedback-level--${level}"
        title="How much this line can tell you about a wrong move">
        <b class="feedback-level__tag">${FEEDBACK_LEVELS[level].tag}</b>
        <span class="feedback-level__what">${FEEDBACK_LEVELS[level].blurb}</span>
      </span>
      <button class="pill pill--warn${state.picking?" on":""}" data-act="deviate"
        ${state.deviation?"disabled":""}>They deviated<kbd>D</kbd></button>
    </div>`;
}

function drillScoreHTML(line){
  const d = state.drill;
  const asked = drillAskedCount(line);
  const done = Object.keys(d.seen).length;
  const right = Object.keys(d.seen).filter(k=>d.seen[k]==="right").length;
  const pct = asked ? Math.round(100 * done / asked) : 0;
  return `
      <div class="coach__score">
        <span class="coach__turn">${d.phase==="done" ? "Line complete"
          : `Your move &mdash; <b>${moverSide()==="w"?"White":"Black"}</b>`}</span>
        <span class="coach__tally"><b>${right}</b> of <b>${asked}</b> first try
          <span class="sep">&middot;</span> streak <b>${d.streak}</b></span>
      </div>
      <div class="coach__progress" role="progressbar" aria-valuenow="${done}"
        aria-valuemin="0" aria-valuemax="${asked}"><i style="width:${pct}%"></i></div>`;
}

function drillHintsHTML(){
  const d = state.drill;
  const answer = drillAnswer();
  if(!answer || !d.hint) return "";
  const rungs = [];
  if(d.hint >= 1){
    const here = currentPlies()[state.ply];
    rungs.push(`<li>Move ${d.bothSides ? (answer.turn==="w"?"White&rsquo;s":"Black&rsquo;s") : "your"} <b>${pieceName(pieceAt(here.fen, answer.from))}</b>.</li>`);
  }
  if(d.hint >= 2){
    const why = drillRedact(answer.note, answer) || drillRedact(answer.tactics, answer);
    rungs.push(`<li>${why}</li>`);
  }
  return `<ol class="coach__hints">${rungs.join("")}</ol>`;
}

function drillPanelHTML(line){
  const d = state.drill;
  const played = currentPlies()[state.ply];

  if(d.phase === "done"){
    const asked = drillAskedCount(line);
    const right = Object.keys(d.seen).filter(k=>d.seen[k]==="right").length;
    return `
      <article class="coach" data-tone="ok">
        ${drillScoreHTML(line)}
        <p class="coach__prompt">You played ${right} of ${asked} first time.</p>
        <div class="coach__actions">
          <button class="btn btn--primary" data-act="restart">Drill again<kbd>R</kbd></button>
          <button class="btn" data-act="mode" data-v="read">Read this line</button>
        </div>
      </article>
      ${planFor(currentOpening(), line)}`;
  }

  if(d.phase === "right" || d.phase === "reveal"){
    const reply = drillReplying() ? drillAnswer() : null;
    return `
      <article class="coach" data-tone="${d.tone}">
        ${drillScoreHTML(line)}
        <header class="coach__head">
          <span class="coach__move">${played.num}</span>
          <span class="label">${d.phase==="right" ? "You played it" : "Shown to you"}</span>
        </header>
        <p class="coach__body">${played.note}</p>
        ${played.tactics?tacticsLineHTML(played.tactics):""}
        ${d.verdict?`<p class="verdict">${d.verdict}</p>`:""}
        ${reply?`<p class="coach__aside">Play <b>${reply.turn==="w"?"White":"Black"}</b>&rsquo;s
          reply on the board, or press Continue to have it played.</p>`:""}
        <div class="coach__actions">
          <button class="btn btn--primary btn--wide" data-act="continue">Continue &#8594;<kbd>↵</kbd></button>
        </div>
      </article>`;
  }

  // asking, or just answered wrongly
  return `
      <article class="coach" data-tone="${d.tone||"flat"}">
        ${drillScoreHTML(line)}
        ${d.verdict?`<p class="verdict">${d.verdict}</p>`:""}
        <p class="coach__prompt">Play ${moverSide()==="w"?"White":"Black"}&rsquo;s move on the board.</p>
        ${played.note?`<p class="coach__context">${drillRedact(played.note, drillAnswer())}</p>`:""}
        ${drillHintsHTML()}
        <div class="coach__actions">
          <button class="btn" data-act="hint">Hint<kbd>H</kbd></button>
          <button class="btn" data-act="show">Show me<kbd>S</kbd></button>
          <button class="btn" data-act="restart">Restart<kbd>R</kbd></button>
        </div>
      </article>`;
}

/* ---- board input ---- */
/* Selection, hover targets and drag are class-only mutations. A render() here
   would delete the node under the pointer mid-drag, and the focused square
   mid-keystroke. */
function drillArm(){
  if(!boardLive()) return;
  const board = document.getElementById("board");
  if(!board) return;
  board.classList.add("live");
  board.setAttribute("role", "grid");
  const cursor = state.drill.cursor;
  board.querySelectorAll("[data-sq]").forEach(sq=>{
    sq.setAttribute("role", "gridcell");
    sq.setAttribute("tabindex", sq.dataset.sq === cursor ? "0" : "-1");
  });
  drillPaint();
}

function drillPaint(){
  const board = document.getElementById("board");
  if(!board) return;
  const here = currentPlies()[state.ply];
  const targets = state.selected ? legalTargets(here, state.selected) : [];
  // The refused move was never played, so the board shows no trace of it unless
  // it is marked. Held until the next attempt rather than flashed -- you have to
  // be able to look at what you did.
  const rejected = state.drill.rejected;
  board.querySelectorAll("[data-sq]").forEach(sq=>{
    const name = sq.dataset.sq;
    sq.classList.toggle("picked-up", name === state.selected);
    sq.classList.toggle("cursor", name === state.drill.cursor);
    const isTarget = targets.indexOf(name) >= 0;
    sq.classList.toggle("target", isTarget);
    sq.classList.toggle("target--capture", isTarget && pieceAt(here.fen, name) !== "");
    const marked = rejected && (name === rejected.from || name === rejected.to);
    sq.classList.toggle("rejected", !!marked && rejected.kind === "wrong");
    sq.classList.toggle("illegal", !!marked && rejected.kind === "illegal");
    sq.classList.toggle("rejected-to", !!marked && name === rejected.to);
  });
}

/* Drops the last attempt without a re-render. Called from pointerdown, where
   replacing #content would delete the node the pointer is on and abandon a drag
   before it starts -- so the verdict node is removed directly instead. */
function drillClearVerdict(){
  const d = state.drill;
  d.verdict = ""; d.tone = "";
  // Every .verdict on the page, not just the coach card's: read mode renders the
  // same answer outside the card, and a selector scoped to .coach left it on
  // screen after the mark under it had already gone.
  document.querySelectorAll(".verdict").forEach(n=>n.remove());
  const card = document.querySelector(".coach");
  if(card) card.setAttribute("data-tone", "flat");
  drillPaint();
  drawArrows();
}

/* Drawn by arrows.js, which clears the canvas and then asks for this before it
   decides whether the book arrows are allowed -- the attempt has to be visible
   in exactly the phase where the book arrows are not. */
function drillDrawRejected(ctx, square){
  const rejected = state.drill.rejected;
  if(!rejected || !drillOn()) return;
  const colour = rejected.kind === "illegal"
    ? "rgba(204,106,98,0.85)" : "rgba(221,169,74,0.85)";
  drawArrowBetween(ctx, rejected.from, rejected.to, colour, square*0.11, square);
}

/* Whose move it is in the position on screen -- which in drill is always the
   learner, and with the deviation picker open is always the opponent. */
function moverSide(){
  const next = currentPlies()[state.ply + 1];
  return next ? next.turn : (state.ply % 2 === 0 ? "w" : "b");
}

/* The board takes moves in three situations, and they want different answers:
   being asked, having just answered wrongly, and standing on an answered move
   with the reply still to play. The last is why Continue is never the only way
   forward -- the board is the interface, a button is the fallback. */
function boardLive(){
  if(state.deviation) return false;
  if(state.picking) return true;
  // Reading is not watching. The board is the most obvious thing on the page, so
  // it answers a move at all times rather than only after you have found a mode
  // switch -- and in read mode answering means the deviation library, which is
  // otherwise reachable only by hunting through a list.
  if(state.view === "op" && !drillOn()) return true;
  if(!drillOn()) return false;
  const p = state.drill.phase;
  return p === "ask" || p === "wrong" || p === "right" || p === "reveal";
}

function boardMove(from, to){
  if(state.picking || !drillOn()) readModeTry(from, to);
  else drillTry(from, to);
}

/* Read mode: the learner is showing me a move -- either the one this line plays
   next, or the one they want to know about instead. */
function readModeTry(from, to){
  const here = currentPlies()[state.ply];
  const pair = normaliseMove(here.fen, from, to);
  from = pair[0]; to = pair[1];

  // Playing the move the line plays walks it forward. `devAt` drops that move
  // from the deviation list -- from here it is the main line -- so without this
  // the most natural move on the board would answer "I have no notes on that".
  const next = currentPlies()[state.ply + 1];
  if(next && next.from === from && next.to === to){
    state.selected = null;
    state.drill.verdict = ""; state.drill.tone = ""; state.drill.rejected = null;
    step(1);
    announce(next.san + ".");
    return;
  }

  const hit = devMatch(state.ply, from, to);
  if(hit >= 0){ state.selected = null; state.drill.rejected = null; devEnter(state.ply, hit, "read"); return; }

  const name = moveName(here.fen, from, to);
  const illegal = isLegalMove(here, from, to) === false;
  if(illegal){
    state.drill.verdict = `<b>${name}</b> isn't a legal move in this position.`;
    state.drill.tone = "bad";
  } else {
    state.drill.verdict = `<b>${name}</b> isn't one I have notes on. `
      + (next?`This line plays <b>${next.san}</b>. `:"")
      + movePrinciple(here, from, to);
    state.drill.tone = "flat";
  }
  // Mark the board, in the same two colours the drill uses and for the same two
  // reasons: red for a move that cannot be played, amber for a legal one that is
  // not the move this line plays. Reading and drilling disagreeing about what a
  // refused move looks like would teach the colours twice.
  state.drill.rejected = {from, to, kind: illegal ? "illegal" : "wrong"};
  // The answer belongs to the position that produced it. Tying it to the ply
  // means every way of leaving -- arrow keys, the move list, another line --
  // drops it without a single navigation hook knowing this feature exists.
  state.drill.verdictPly = state.ply;
  state.selected = null;
  render();
  announce(name + ".");
}

function drillPick(sq){
  const here = currentPlies()[state.ply];
  // Before every early return below, and here rather than in the pointer handler
  // so the keyboard reaches it too: touching the board at all -- any square,
  // pickable or not -- means you are done looking at the last attempt.
  if(state.drill.rejected){ state.drill.rejected = null; drillClearVerdict(); }
  if(state.selected === sq){ state.selected = null; drillPaint(); return; }
  if(state.selected){ const from = state.selected; state.selected = null; boardMove(from, sq); return; }
  if(!isOwnPiece(here.fen, sq, moverSide())) return;
  state.selected = sq;
  state.drill.cursor = sq;
  drillPaint();
}

document.getElementById("content").addEventListener("pointerdown", e=>{
  if(!boardLive()) return;
  const cell = e.target.closest("[data-sq]");
  if(!cell) return;
  const sq = cell.dataset.sq;
  const here = currentPlies()[state.ply];
  e.preventDefault();

  if(!state.selected && isOwnPiece(here.fen, sq, moverSide())){
    state.drag = {from:sq, id:e.pointerId};
    try{ cell.setPointerCapture(e.pointerId); }catch(err){}
  }
  drillPick(sq);
});

document.getElementById("content").addEventListener("pointerup", e=>{
  const drag = state.drag;
  if(!drag || drag.id !== e.pointerId) return;
  state.drag = null;
  const cell = document.elementFromPoint(e.clientX, e.clientY);
  const drop = cell && cell.closest && cell.closest("[data-sq]");
  if(!drop || drop.dataset.sq === drag.from) return;   // a click, not a drag
  state.selected = null;
  boardMove(drag.from, drop.dataset.sq);
});

/* ---- keyboard ---- */
/* Returns true when it has handled the key, so the page-level handler can bail. */
function drillKey(e){
  if(e.metaKey || e.ctrlKey || e.altKey) return false;
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return false;
  if(state.view !== "op") return false;

  const k = e.key;
  const d = state.drill;

  // Escape unwinds one layer at a time, innermost first.
  if(k === "Escape"){
    if(state.selected){ state.selected = null; drillPaint(); return true; }
    if(state.picking){ state.picking = false; render(); return true; }
    if(state.deviation){ devExit(); return true; }
    return false;
  }
  if(k === "d" || k === "D"){ if(!state.deviation){ ACTIONS.deviate(); return true; } return false; }
  if(state.deviation){
    if(k === "ArrowRight"){ step(1); return true; }
    if(k === "ArrowLeft"){ step(-1); return true; }
    return false;
  }
  if(k === "m" || k === "M"){ setMode(state.mode === "drill" ? "read" : "drill"); return true; }
  if(!drillOn()) return false;

  if(k === "h" || k === "H"){ drillHint(); return true; }
  if(k === "s" || k === "S"){ drillShow(); return true; }
  if(k === "r" || k === "R"){ drillRestart(); return true; }

  if((k === "Enter" || k === " ") && (d.phase === "right" || d.phase === "reveal")){
    drillContinue(); return true;
  }

  const board = document.getElementById("board");
  const onBoard = board && board.contains(document.activeElement);
  if(!onBoard) return drillAsking() && (k === "ArrowRight" || k === "End");   // never reveal by stepping

  if(k === "Enter" || k === " "){ drillPick(d.cursor); return true; }
  // Not `step`: that is the global that moves through a line, and shadowing it
  // here puts the earlier step() calls in this function into its dead zone.
  const delta = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,1], ArrowDown:[0,-1]}[k];
  if(delta){
    const file = FILES.indexOf(d.cursor[0]) + (state.flipped ? -delta[0] : delta[0]);
    const rank = (+d.cursor[1]) + (state.flipped ? -delta[1] : delta[1]);
    if(file >= 0 && file < 8 && rank >= 1 && rank <= 8){
      d.cursor = FILES[file] + rank;
      drillPaint();
      const cell = board.querySelector(`[data-sq="${d.cursor}"]`);
      if(cell){ board.querySelectorAll("[data-sq]").forEach(s=>s.setAttribute("tabindex","-1"));
                cell.setAttribute("tabindex","0"); cell.focus(); }
    }
    return true;
  }
  return false;
}

ACTIONS.mode      = t=>setMode(t.dataset.v);
ACTIONS.bothsides = ()=>{
  // Restarts the line: the score is out of a different number of moves now, and
  // half-answered progress against the old count would be meaningless.
  state.drill.bothSides = !state.drill.bothSides;
  db.ui.bothSides = state.drill.bothSides;
  dbSave();
  drillStart();
  announce(state.drill.bothSides
    ? "Answering for both colours, from the start of the line."
    : "Answering for your own colour only, from the start of the line.");
};
ACTIONS.hint     = ()=>drillHint();
ACTIONS.show     = ()=>drillShow();
ACTIONS.restart  = ()=>drillRestart();
ACTIONS.continue = ()=>drillContinue();
