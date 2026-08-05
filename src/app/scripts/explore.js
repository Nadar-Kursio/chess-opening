/* ---------------- explore ---------------- */
/* Read mode answers a deviation with what somebody wrote about it, and only for
   the moves somebody wrote about. Explore answers it with what the engine says
   -- for every legal move in the position -- and then lets you keep playing.

   Nothing is computed here. `engine-tree.py` searched these positions with
   Stockfish and the build inlined the result, so the eval is on screen the
   instant the piece lands rather than after a browser engine has thought about
   it, and it is a real depth-18 number rather than what a tab could manage in
   two seconds. What that trades away is the edge of the tree, which this file
   says out loud every time you reach it: an eval that quietly stops updating is
   indistinguishable from an eval that means something.

   There are still no chess rules in the browser. A move record says which piece
   goes where and what else the move disturbs -- the rook a castle drags along,
   the square an en-passant empties, the piece a promotion leaves behind -- and
   `treeApply` writes those squares. Knowing that Nf3 is legal in the first place
   is the build's job, and stays there. */

function exploreOn(){ return state.view === "op" && state.mode === "explore"; }

function exploreTree(){
  const op = currentOpening();
  return (op && TREES[op.id]) || null;
}

/* Whether this line has a tree at all. The mode is offered per line, not per
   opening: one spine covers the Chigorin and its deep dive, and the other five
   Ruy Lopez variations have none. */
function exploreReady(line){
  return !!(exploreTree() && line && line.tree !== undefined);
}

/* The tree position for a ply of the line, or -1 where the tree stops. A line
   running past its spine is ordinary rather than broken -- the deep dive
   continues thirteen moves beyond the tree the Chigorin ships. */
function exploreSpine(line, ply){
  if(!exploreReady(line)) return -1;
  const at = exploreTree().spines[line.tree].at[ply];
  return at === undefined ? -1 : at;
}

function exploreNodeAt(i){
  const tree = exploreTree();
  return tree && i >= 0 ? tree.nodes[i] : null;
}

/* ---- evals ---- */
/* Centipawns from White's point of view throughout, which is what the engine
   reports and what every chess interface shows. Only the wording around the
   number flips for the reader: which side is winning is a fact about the
   position, not about who is reading it. */

function evalText(v, mate){
  if(mate !== undefined && mate !== null) return (mate > 0 ? "M" : "−M") + Math.abs(mate);
  if(v === undefined || v === null) return "?";
  return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v / 100).toFixed(2);
}

/* Where the bar sits. A linear centipawn scale pegs at the first won pawn and
   never moves again, so this is the usual logistic squash: the gap between +0.2
   and +0.8 is visible and the gap between +8 and +12 is not, which is the right
   way round for something read at a glance. */
function evalShare(v, mate){
  if(mate !== undefined && mate !== null) return mate > 0 ? 100 : 0;
  return 100 / (1 + Math.exp(-0.00368208 * Math.max(-1500, Math.min(1500, v || 0))));
}

/* A score as a single number the two sides can be compared on, so a mate sorts
   above every eval instead of beside the centipawns it has no relation to. */
function evalScalar(m){
  return m.n !== undefined && m.n !== null ? Math.sign(m.n) * (10000 - Math.abs(m.n)) : m.v;
}

/* What a move cost, in centipawns, against the best move in the position and
   from the point of view of whoever played it. Never negative: the engine's
   first choice is the ceiling. */
function evalCost(node, move){
  if(!node || !node.m.length) return 0;
  const sign = node.t === "w" ? 1 : -1;
  return Math.max(0, Math.round(sign * (evalScalar(node.m[0]) - evalScalar(move))));
}

/* The same three words the written deviations use, on the bands the research
   skill calibrates them with: under 50cp is a real move, 300cp+ loses something.
   An engine label and an authored one disagreeing about what "blunder" means
   would turn both of them into noise. */
function evalSeverity(cost){
  return cost >= 300 ? "blunder" : cost >= 50 ? "inaccuracy" : "playable";
}

/* The number in words. A learner reading "+0.42" for the first time has no idea
   whether that is worth playing for, and the whole point of putting an engine in
   front of them is that they learn what the numbers feel like. */
function evalWords(v, mate){
  if(mate !== undefined && mate !== null){
    return `mate in ${Math.abs(mate)} for ${mate > 0 ? "White" : "Black"}`;
  }
  const cp = Math.abs(v || 0), who = (v || 0) >= 0 ? "White" : "Black";
  if(cp < 30) return "level";
  if(cp < 90) return `${who} a shade better`;
  if(cp < 250) return `${who} clearly better`;
  if(cp < 600) return `${who} winning`;
  return `${who} completely winning`;
}

function evalBarHTML(step, depth){
  if(step.via === "none"){
    return `
      <div class="evalbar evalbar--blank">
        <div class="evalbar__row">
          <div class="evalbar__track evalbar__track--blank" role="img"
            aria-label="No score: this position was never searched."></div>
          <b class="evalbar__score">—</b>
        </div>
        <p class="evalbar__caption">not searched</p>
      </div>`;
  }
  const v = step.v, mate = step.n;
  const share = evalShare(v, mate), text = evalText(v, mate);
  const words = evalWords(v, mate);
  // Where the number came from, every time it is shown. The three cases are
  // genuinely different promises, and a bar that looked the same for all of them
  // would be claiming the weakest one everywhere or the strongest one nowhere.
  const source = step.via === "search" ? `depth ${depth}`
               : step.via === "move" ? `depth ${depth}, from the move`
               : "along the engine's line";
  return `
      <div class="evalbar">
        <div class="evalbar__row">
          <div class="evalbar__track" role="img"
            aria-label="Stockfish scores this ${text} — ${words} — ${source}.">
            <span class="evalbar__white" style="width:${share.toFixed(1)}%"></span>
          </div>
          <b class="evalbar__score">${text}</b>
        </div>
        <p class="evalbar__caption">Stockfish <span class="sep">&middot;</span>
          ${source} <span class="sep">&middot;</span> ${words}</p>
      </div>`;
}

/* ---- moving pieces ---- */

function treeApply(board, m){
  const squares = board.split("");
  const from = squareIndex(m.f), to = squareIndex(m.o);
  squares[to] = m.q || squares[from];
  squares[from] = ".";
  if(m.x) squares[squareIndex(m.x)] = ".";
  if(m.r){
    squares[squareIndex(m.r[1])] = squares[squareIndex(m.r[0])];
    squares[squareIndex(m.r[0])] = ".";
  }
  return squares.join("");
}

/* The node's own move list, in the packed form move.js already reads. Handing
   the board its legality this way means target dots, illegal-move rejection and
   everything else in that file work in explore without knowing it exists. */
function treeLegal(node){
  return node ? node.m.map(m=>m.f + m.o).join("") : "";
}

/* Where a step's score came from, which is not the same question as what it is.
   Three answers, and the panel says which:

     search  this position was searched, so it has a score AND every reply to it
     move    the parent's search priced this move, so the score is real and there
             is no list of replies -- one ply past the edge of what was expanded
     line    the score is what the engine's continuation is worth, carried along
             it, which is what a PV score means and where every engine UI shows it

   Only "search" offers alternatives. Collapsing the other two into "no data"
   would throw away a number that is perfectly good, and collapsing them into
   "data" would offer a reply list that does not exist. */
function exploreStep(prev, m, child, along){
  const node = exploreNodeAt(child);
  const ply = prev.ply + 1;
  const priced = m.v !== undefined;
  return {
    san: m.s,
    fen: node ? node.b : treeApply(prev.fen, m),
    from: m.f, to: m.o,
    num: `${(ply + 1) >> 1}.${prev.next === "w" ? "" : ".."}${m.s}`,
    turn: prev.next,
    next: prev.next === "w" ? "b" : "w",
    check: !!m.k,
    legal: treeLegal(node),
    ply: ply,
    node: node ? child : -1,
    move: m,
    v: node ? node.v : priced ? m.v : along ? along.v : undefined,
    n: node ? node.n : priced ? m.n : along ? along.n : undefined,
    via: node ? "search" : priced ? "move" : along ? "line" : "none",
  };
}

/* Whose move it is in the position on screen. Explore plays both colours: the
   point of it is answering what the opponent did, which means putting their
   move on the board yourself. */
function exploreTurn(){
  const here = currentPly();
  return here && here.next ? here.next : "w";
}

/* Is this step still the line? Not "was every move so far the book move" -- the
   tree is keyed by position, so a transposition back onto the line is back on
   the line, and telling the reader otherwise would be wrong about the one thing
   they came here to check. */
function exploreOnLine(step){
  const at = exploreSpine(currentLine(), step.ply);
  return at >= 0 && at === step.node;
}

function exploreStart(){
  const line = currentLine();
  // Nothing above here is allowed to put the reader in a mode with no data
  // behind it, and this is the one place that would find out. Falling back to
  // Read beats a dead board.
  if(!exploreReady(line)){ state.mode = "read"; render(); return; }
  const ply = state.ply, here = line.plies[ply];
  const at = exploreSpine(line, ply);
  const node = exploreNodeAt(at);
  state.drill.rejected = null;
  state.drill.verdict = ""; state.drill.tone = "";
  state.explore = {
    from: ply,
    at: 0,
    steps: [{
      san: here.san, fen: here.fen, from: here.from, to: here.to,
      num: here.num, turn: here.turn,
      next: ply % 2 === 0 ? "w" : "b",
      check: !!here.check,
      legal: treeLegal(node),
      ply: ply,
      node: node ? at : -1,
      move: null,
      v: node ? node.v : undefined,
      n: node ? node.n : undefined,
      via: node ? "search" : "none",
    }],
  };
  render();
  announce(node
    ? "Explore. Play any move for either side and Stockfish answers it."
    : "Explore. This position is past the end of the engine tree.");
}

function exploreExit(){
  state.explore = null;
  state.exploreAll = false;
  state.selected = null;
  state.drill.rejected = null;
  state.drill.verdict = ""; state.drill.tone = "";
}

/* Playing from a rewound position starts a new branch, which is what every
   analysis board does and the only behaviour that does not silently keep the
   moves you stepped back through. */
function exploreTry(from, to){
  const e = state.explore, here = e.steps[e.at];
  const pair = normaliseMove(here.fen, from, to);
  const node = exploreNodeAt(here.node);
  // Several records share a from/to only on a promotion, and the promoted piece
  // is what tells them apart. The queen is the one a player means.
  const found = node ? node.m.filter(x=>x.f === pair[0] && x.o === pair[1]) : [];
  const m = found.find(x=>!x.q || x.q.toUpperCase() === "Q") || found[0];

  if(!m){
    state.selected = null;
    const name = moveName(here.fen, pair[0], pair[1]);
    state.drill.rejected = {from: pair[0], to: pair[1], kind: node ? "illegal" : "wrong"};
    state.drill.verdict = node
      ? `<b>${name}</b> isn't a legal move in this position.`
      : `<b>${name}</b> is past the end of the tree — these positions were never `
        + `searched, so there is nothing to tell you about it.`;
    state.drill.tone = node ? "bad" : "flat";
    render();
    announce(name + ".");
    return;
  }

  e.steps.length = e.at + 1;
  e.steps.push(exploreStep(here, m, m.c === undefined ? -1 : m.c, null));
  e.at = e.steps.length - 1;
  state.selected = null;
  state.drill.rejected = null;
  state.drill.verdict = ""; state.drill.tone = "";
  render();
  announce(`${m.s}. ${evalText(m.v, m.n)}, `
    + `${SEVERITY[evalSeverity(evalCost(node, m))].label.toLowerCase()}.`);
}

/* Walking the engine's continuation, which is stored as moves rather than as
   text precisely so it can be walked. Playing k plies of it is the same
   operation as playing k moves by hand, so it lands in the same steps.

   Each ply is looked up in the tree first. The continuation's own record is only
   the fallback: where the line runs back through a position that was searched,
   that search is better data than the line carrying it. */
function explorePlayLine(owner, upto){
  const e = state.explore, pv = owner.p;
  e.steps.length = e.at + 1;
  for(let i = 0; i < upto && i < pv.length; i++){
    const prev = e.steps[e.steps.length - 1];
    const node = exploreNodeAt(prev.node);
    const known = node && node.m.find(x=>x.f === pv[i].f && x.o === pv[i].o);
    e.steps.push(exploreStep(prev, known || pv[i],
                             known && known.c !== undefined ? known.c : -1, owner));
  }
  e.at = e.steps.length - 1;
  render();
  announce(`Played ${pv[Math.min(upto, pv.length) - 1].s}.`);
}

/* ---- the panel ---- */

function exploreVerdictHTML(){
  return state.drill.verdict
    ? `<p class="verdict verdict--framed" data-tone="${state.drill.tone || "flat"}">${
        state.drill.verdict}</p>`
    : "";
}

/* The engine's replies to the position on screen: what to play, and what each
   of the others is worth. This is the list the reader actually works from --
   "they played something odd, what do I do about it" is answered here, and the
   card above only says how bad the odd move was. */
function exploreRepliesHTML(node){
  const all = state.exploreAll;
  const shown = all ? node.m : node.m.slice(0, 6);
  const best = node.m.length ? evalScalar(node.m[0]) : 0;
  const sign = node.t === "w" ? 1 : -1;
  return `
        <div class="replies">
          <div class="replies__head">
            <span class="label">${node.t === "w" ? "White" : "Black"} to move
              &mdash; every legal one, best first</span>
            ${node.m.length > 6 ? `<button class="pill" data-act="expall">
              ${all ? "Top six" : `All ${node.m.length}`}</button>` : ""}
          </div>
          <ol class="replies__list">
            ${shown.map((m,i)=>{
              const cost = Math.max(0, Math.round(sign * (best - evalScalar(m))));
              return `
            <li><button class="reply reply--${i === 0 ? "best" : evalSeverity(cost)}"
              data-act="expplay" data-f="${m.f}" data-o="${m.o}"
              title="${i === 0 ? "The engine's first choice"
                    : `Gives away ${(cost / 100).toFixed(2)} against ${node.m[0].s}`}">
              <span class="reply__rank">${i + 1}</span>
              <span class="reply__san">${m.s}</span>
              <span class="reply__eval">${evalText(m.v, m.n)}</span>
            </button></li>`;
            }).join("")}
          </ol>
        </div>`;
}

/* The continuation, as buttons rather than as a sentence. A line you can only
   read is worth less than the same line with the board following it, and these
   are stored as moves, so following it costs nothing. */
function exploreLineHTML(pv){
  return `
        <div class="pv">
          <span class="label">Then</span>
          <div class="pv__moves">
            ${pv.map((m,i)=>`<button class="move" data-act="expline" data-i="${i + 1}"
              title="Play up to here">${m.s}</button>`).join("")}
            <button class="pill" data-act="expline" data-i="${pv.length}">Play it</button>
          </div>
        </div>`;
}

/* The edge of the tree, said plainly and in its own colour, in the two shapes it
   comes in. A number that has quietly stopped meaning what it meant a move ago
   is the single failure that would make this whole panel a liar, so the wording
   changes with the promise and never softens it. */
function exploreEdgeHTML(step){
  if(step.via === "none"){
    return `
        <p class="beyond"><b>Past the end of the tree.</b> Nothing searched this
        position, so there is no score for it and no list of replies. Step back to
        carry on exploring.</p>`;
  }
  return `
        <p class="beyond"><b>The score holds, the alternatives stop.</b> This
        position was priced ${step.via === "line"
          ? "as part of the engine's line rather than searched on its own"
          : "by the search one move back rather than searched on its own"}, so
        there is no list of replies here. Step back for one.</p>`;
}

function exploreCardHTML(){
  const e = state.explore, here = e.steps[e.at];
  const node = exploreNodeAt(here.node);
  const parent = e.at > 0 ? exploreNodeAt(e.steps[e.at - 1].node) : null;

  // No parent search to measure the move against: either this is where the walk
  // began, or it is somewhere down the engine's own line, where the interesting
  // number is what the line is worth rather than what the last move cost.
  if(!here.move || !parent){
    const onLine = exploreOnLine(here);
    return `
      <article class="coach">
        <header class="coach__head">
          <span class="coach__move">${here.num || "Start"}</span>
          <span class="label">${onLine ? "On the line"
            : here.via === "line" ? "On the engine's line"
            : "Play a move for either side"}</span>
        </header>
        <p class="coach__body">${here.via === "line"
          ? `This is where the engine's continuation goes. The score is what that
             whole line is worth, carried along it — step back to the position it
             started from to try something else.`
          : `Whatever lands on the board, the engine has already priced it: what
             the move is worth, what it gave away against the best move here, and
             the line that takes advantage.`}</p>
        ${node ? exploreRepliesHTML(node) : exploreEdgeHTML(here)}
      </article>`;
  }

  const cost = evalCost(parent, here.move);
  const sev = evalSeverity(cost);
  const best = parent.m[0];
  const first = best.s === here.move.s;
  const onLine = exploreOnLine(here);

  return `
      <article class="coach" data-tone="${onLine ? "flat" : sev}">
        <header class="coach__head">
          ${onLine ? `<span class="severity severity--book">
            <b class="severity__mark" aria-hidden="true">≡</b>
            <span class="severity__word">On the line</span></span>` : severityHTML(sev)}
          <span class="coach__move">${here.num}</span>
          <span class="label">depth ${parent.d}</span>
        </header>
        <p class="coach__body">${
          onLine ? `<b>${here.move.s}</b> is the move this variation plays, and the
            engine scores it <b>${evalText(here.move.v, here.move.n)}</b>.`
          : first ? `<b>${here.move.s}</b> is the engine's own first choice here —
            <b>${evalText(here.move.v, here.move.n)}</b>.`
          : cost === 0 ? `<b>${here.move.s}</b> gives away nothing: the engine rates
            it level with <b>${best.s}</b>, at <b>${evalText(here.move.v, here.move.n)}</b>.`
          : `<b>${here.move.s}</b> hands over <b>${(cost / 100).toFixed(2)}</b>
            against <b>${best.s}</b>, the best move in the position. The score goes
            from <b>${evalText(best.v, best.n)}</b> to
            <b>${evalText(here.move.v, here.move.n)}</b>.`}</p>
        ${here.move.p && here.move.p.length ? exploreLineHTML(here.move.p) : ""}
        ${node ? exploreRepliesHTML(node) : exploreEdgeHTML(here)}
      </article>`;
}

function exploreTapeHTML(){
  const e = state.explore;
  return e.steps.map((p,i)=>{
    const num = p.turn === "w" && p.san ? `<span class="scoresheet__no">${(p.ply + 1) >> 1}.</span>` : "";
    const cls = i === e.at ? "move current" : (i < e.at ? "move played" : "move");
    return `${num}<button class="${cls}" data-act="expat" data-i="${i}">${p.san || "start"}</button>`;
  }).join("");
}

function explorePanelHTML(){
  const e = state.explore, here = e.steps[e.at];
  const node = exploreNodeAt(here.node);
  const tree = exploreTree();
  const prev = e.at > 0 ? exploreNodeAt(e.steps[e.at - 1].node) : null;
  return `
      ${evalBarHTML(here, node ? node.d : prev ? prev.d : tree.depth)}
      <div class="walk">
        <span class="label">Your walk${e.steps.length > 1 ? " &mdash; tap to rewind" : ""}</span>
        <div class="scoresheet scoresheet--inline">${exploreTapeHTML()}</div>
      </div>
      ${exploreVerdictHTML()}
      ${exploreCardHTML()}
      <div class="explore-actions">
        <button class="btn" data-act="expreset" ${e.steps.length === 1
          ? "disabled" : ""}>Back to the line</button>
      </div>
      <p class="tree-credit">${tree.engine}, depth ${tree.depth} on the line and
        ${tree.answerDepth} in the positions a deviation reaches, searched
        ${tree.generated}. Every number here came out of that run — none of it is
        computed in your browser, which is what makes it instant, and why the tree
        has an edge.</p>`;
}

/* Offered only where there is a tree to explore, and disabled with the reason
   rather than hidden: a mode that appears on one variation and vanishes on the
   next reads as a bug in the page. */
function exploreSegHTML(line){
  const ready = exploreReady(line);
  return `<button class="seg" data-act="mode" data-v="explore"
    aria-pressed="${state.mode === "explore"}" ${ready ? "" : "disabled"}
    title="${ready
      ? "Leave the line and have Stockfish price whatever gets played"
      : "No engine tree has been generated for this variation yet"}">Explore</button>`;
}

ACTIONS.expplay = t=>exploreTry(t.dataset.f, t.dataset.o);
ACTIONS.expat   = t=>{ state.explore.at = +t.dataset.i; render(); };
ACTIONS.expall  = ()=>{ state.exploreAll = !state.exploreAll; render(); };
ACTIONS.expline = t=>{
  const m = state.explore.steps[state.explore.at].move;
  if(m && m.p) explorePlayLine(m, +t.dataset.i);
};
ACTIONS.expreset = ()=>{ exploreExit(); exploreStart(); };
/* Read mode handing a move it has no notes on straight to the engine. The mode
   switch starts the walk at the ply the reader is already on, so replaying the
   move there puts them where they were trying to get to. */
ACTIONS.expfrom = t=>{
  setMode("explore");
  if(state.explore) exploreTry(t.dataset.f, t.dataset.o);
};
