/* ---------------- pawn structures and model games ---------------- */
/* A structure is not a paragraph belonging to one opening. It is the thing
   several openings arrive at, which is the whole reason studying one pays out in
   the others -- learn the isolani once and it serves the Panov, the Queen's
   Gambit Accepted and the Nimzo Rubinstein too.

   `openings` is derived by the build from the lines that point here. `also_in`
   is authored, and names the openings in this course that reach the same
   structure but do not yet carry a plan card. */

function structureHTML(st){
  if(!st) return primerHTML();
  return `
  <div class="ophead">
    <div class="opkicker">
      <span>Pawn structures</span><span class="sep">/</span><span>${st.taxonomy?"In the literature":"Structure"}</span>
      ${st.tier?`<span class="sep">/</span><span class="lvl">${st.tier}</span>`:""}
    </div>
    <h2 class="opname">${st.name}</h2>
    ${st.taxonomy?`<p class="optag">${st.taxonomy}</p>`:""}
  </div>

  <div class="structpage">
    <div class="structdiag">
      <div class="boardframe">
        <div class="boardwrap">${boardCells(st.board, null, null, null, false)}</div>
      </div>
      <p class="structcap">A representative position. The pieces will differ; the pawns are the point.</p>
    </div>

    <div class="structcards">
      <div class="card">
        <p class="cardhead">♔ White's plans</p>
        <ul>${st.white_plans.map(x=>`<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="card">
        <p class="cardhead">♚ Black's plans</p>
        <ul>${st.black_plans.map(x=>`<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="card">
        <p class="cardhead">Key squares</p>
        <ul>${st.key_squares.map(x=>`<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="card">
        <p class="cardhead">The pawn breaks</p>
        <ul>${st.pawn_breaks.map(x=>`<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="card warn span">
        <p class="cardhead">What goes wrong</p>
        <ul>${st.pitfalls.map(x=>`<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="card span">
        <p class="cardhead">If it reaches an endgame</p>
        <p>${st.endgame_note}</p>
      </div>
    </div>

    <div class="structops">
      <p class="cardhead">Where this comes from</p>
      ${st.openings.length?`<ul class="structreach">${st.openings.map(o=>
        `<li><button data-act="goop" data-id="${o.id}">${o.name}</button>
         <span class="structline">${o.line}</span></li>`).join("")}</ul>`:""}
      ${st.also_in && st.also_in.length?`
        <p class="plansub">Also reached by</p>
        <ul class="structalso">${st.also_in.map(x=>`<li>${x}</li>`).join("")}</ul>`:""}
    </div>
  </div>`;
}

function gameHTML(g){
  if(!g) return primerHTML();
  const seq = curSeq();
  const p = seq[state.ply] || seq[0];
  const op = DATA.find(o=>o.id===g.op);
  const tape = seq.slice(1).map((q,i)=>{
    const idx = i+1;
    const num = q.turn==="w" ? `<span class="mvnum">${Math.ceil(idx/2)}.</span>` : "";
    const cls = idx===state.ply ? "mv on" : (idx<state.ply ? "mv seen" : "mv");
    return `${num}<button class="${cls}" data-ply="${idx}">${q.san}</button>`;
  }).join("");

  return `
  <div class="ophead">
    <div class="opkicker">
      <span>Model game</span>${op?`<span class="sep">/</span><span>${op.name}</span>`:""}
      ${g.tier?`<span class="sep">/</span><span class="lvl">${g.tier}</span>`:""}
    </div>
    <h2 class="opname">${g.name}</h2>
  </div>

  <section class="study gamestudy">
    <div class="boardcol">
      <div class="boardframe">
        <div class="boardwrap">${boardCells(p.fen,p.from,p.to,p.check?(p.turn==="w"?"b":"w"):null,state.flip)}<canvas class="arrows" id="arrowlayer"></canvas></div>
      </div>
      <div class="controls">
        <button class="ctl" id="b-first" ${state.ply===0?"disabled":""} title="Start (Home)">&#8676;</button>
        <button class="ctl wide" id="b-prev" ${state.ply===0?"disabled":""} title="Back (←)">&#8592; Back</button>
        <button class="ctl wide" id="b-next" ${state.ply>=seq.length-1?"disabled":""} title="Forward (→)">Next &#8594;</button>
        <button class="ctl" id="b-last" ${state.ply>=seq.length-1?"disabled":""} title="End (End)">&#8677;</button>
      </div>
      <div class="ctlbar2">
        <button class="ctl${state.timer?" on":""}" id="b-play">${state.timer?"■ Stop":"▶ Play through"}</button>
        <button class="ctl" id="b-flip">⇅ Flip board</button>
        <button class="ctl" id="b-arrows" disabled>↗ Arrows: n/a</button>
      </div>
      <div class="counter">Move ${state.ply} of ${seq.length-1} &nbsp;·&nbsp; ${state.flip?"Black":"White"} at the bottom</div>
      <div class="hint">Use ← and → keys, or click any move in the list.</div>
    </div>

    <div class="studycol">
      <div class="tape" id="tape">${tape}</div>
      <div class="commentary">
        <div class="cmtop">
          <span class="cmmove">${state.ply===0?"Before the game":p.num}</span>
          <span class="cmwho">${state.ply===0?"":(p.turn==="w"?"White to have moved":"Black to have moved")}</span>
        </div>
        <p class="cmtext">${p.note || "&mdash;"}</p>
      </div>
    </div>
  </section>`;
}

ACTIONS.goop = t=>go(t.dataset.id);
ACTIONS.game = t=>{
  state.view = "game";
  state.gameId = t.dataset.id;
  state.ply = 0; state.flip = false;
  state.branch = null; state.pick = false;
  buildRail(); render();
  window.scrollTo({top:0,behavior:"instant"});
};
