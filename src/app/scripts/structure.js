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
  return pageHeadHTML(
      ["Pawn structures", st.taxonomy ? "In the literature" : "Structure"],
      st.name, st.taxonomy || "") + `

  <div class="structure">
    <div class="structure__diagram">
      <div class="board-frame">
        <div class="board-square">${boardHTML(st.board, null, null, null, false)}</div>
      </div>
      <p class="structure__caption">A representative position. The pieces will differ; the pawns are the point.</p>
    </div>

    <div class="structure__cards">
      <div class="card">
        <p class="card__head label label--accent">♔ White's plans</p>
        <ul>${st.white_plans.map(x=>`<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="card">
        <p class="card__head label label--accent">♚ Black's plans</p>
        <ul>${st.black_plans.map(x=>`<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="card">
        <p class="card__head label label--accent">Key squares</p>
        <ul>${st.key_squares.map(x=>`<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="card">
        <p class="card__head label label--accent">The pawn breaks</p>
        <ul>${st.pawn_breaks.map(x=>`<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="card card--warn card--wide">
        <p class="card__head label label--danger">What goes wrong</p>
        <ul>${st.pitfalls.map(x=>`<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="card card--wide">
        <p class="card__head label label--accent">If it reaches an endgame</p>
        <p>${st.endgame_note}</p>
      </div>
    </div>

    <div class="structure__sources">
      <p class="label label--accent">Where this comes from</p>
      ${st.openings.length?`<ul class="structure__reach">${st.openings.map(o=>
        `<li><button data-act="opening" data-id="${o.id}">${o.name}</button>
         <span class="structure__line">${o.line}</span></li>`).join("")}</ul>`:""}
      ${st.also_in && st.also_in.length?`
        <p class="label plan__sub">Also reached by</p>
        <ul class="structure__also">${st.also_in.map(x=>`<li>${x}</li>`).join("")}</ul>`:""}
    </div>
  </div>`;
}

function gameHTML(g){
  if(!g) return primerHTML();
  const plies = currentPlies();
  const p = plies[state.ply] || plies[0];
  const op = DATA.find(o=>o.id===g.op);

  const tape = plies.slice(1).map((q,i)=>{
    const idx = i+1;
    const num = q.turn==="w" ? `<span class="scoresheet__no">${Math.ceil(idx/2)}.</span>` : "";
    const cls = idx===state.ply ? "move current" : (idx<state.ply ? "move played" : "move");
    return `${num}<button class="${cls}" data-ply="${idx}">${q.san}</button>`;
  }).join("");

  return pageHeadHTML(
      ["Model game", op ? op.name : ""],
      g.name, "") + `

  <section class="study">
    ${boardColumnHTML({
      ply:p, index:state.ply, total:plies.length-1, locked:false, arrows:false, canPlay:true,
      readout:`Move <b>${state.ply}</b> of ${plies.length-1}`,
      hint:"Use ← and → keys, or pick any move in the list."
    })}
    <div class="study__notes">
      <div class="scoresheet scroller" id="tape">${tape}</div>
      <article class="coach">
        <header class="coach__head">
          <span class="coach__move">${state.ply===0?"Before the game":p.num}</span>
          <span class="label">${state.ply===0?"":(p.turn==="w"?"White to have moved":"Black to have moved")}</span>
        </header>
        <p class="coach__body">${p.note || "&mdash;"}</p>
      </article>
    </div>
  </section>`;
}

ACTIONS.opening = t=>go(t.dataset.id);
ACTIONS.game = t=>{
  state.view = "game";
  state.gameId = t.dataset.id;
  state.ply = 0; state.flipped = false;
  state.deviation = null; state.picking = false;
  buildNav(); render();
  window.scrollTo({top:0,behavior:"instant"});
};
