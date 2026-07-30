/* ---------------- deviations ---------------- */
/* "They played something else" is the most common thing that happens to a
   prepared opening, so it is a first-class move here rather than a failure
   state. Three buckets, and only one of them is a mistake:

     blunder     there is a refutation, and here it is
     inaccuracy  small and lasting, here is what you get
     playable    a real move. Nothing to refute. Develop and carry on.

   Most deviations are the third kind. Tools that answer every one of them with
   a red cross teach a reflex that loses games -- hunting for a refutation that
   was never there. */

const BR_SEV = {
  blunder:    {label:"Blunder",    gist:"loses material or the game"},
  inaccuracy: {label:"Inaccuracy", gist:"playable, but it costs something"},
  playable:   {label:"Playable",   gist:"a real move — nothing to refute"},
};

/* The branch sets are shared between every line that reaches the position, so
   the move THIS line plays has to be dropped: from here it is the main line,
   not a deviation from it. */
function brAt(ply){
  const op = DATA.find(o=>o.id===state.opId);
  if(!op || !op.branchsets) return [];
  const line = op.lines[state.line];
  const here = line && line.plies[ply];
  if(!here || here.bx === undefined) return [];
  const next = line.plies[ply + 1];
  return op.branchsets[here.bx].filter(b=>
    (!next || b.san !== next.san) && tierVisible(b.tier));
}

function brSeq(){
  const list = brAt(state.branch.fromPly);
  const one = list[state.branch.idx];
  return one ? one.plies : [];
}
function brCur(){
  const list = brAt(state.branch.fromPly);
  return list[state.branch.idx] || null;
}

function brEnter(fromPly, idx, origin){
  state.branch = {fromPly, idx, at:0, origin:origin || "read"};
  state.pick = false;
  state.sel = null;
  render();
  const b = brCur();
  if(b) dxSay(`${BR_SEV[b.sev].label}. ${b.san}.`);
}

function brExit(){
  const origin = state.branch && state.branch.origin;
  state.branch = null;
  state.sel = null;
  if(origin === "drill" && state.mode === "drill"){
    state.drill.phase = "ask";
    state.drill.msg = ""; state.drill.tone = "";
  }
  render();
  dxSay("Back to the line.");
}

/* Does a played move match an authored deviation from this position? */
function brMatch(ply, from, to){
  const list = brAt(ply);
  for(let i=0;i<list.length;i++){
    const first = list[i].plies[0];
    if(first && first.from === from && first.to === to) return i;
  }
  return -1;
}

function brPickerHTML(){
  const list = brAt(state.ply);
  const line = DATA.find(o=>o.id===state.opId).lines[state.line];
  const next = line.plies[state.ply + 1];
  return `
      <div class="deviate" id="deviate">
        <p class="devlead">${next
          ? `What did they play instead of <b>${next.num}</b>?`
          : `What did they play here?`}</p>
        ${list.length?`<div class="devchips">
          ${list.map((b,i)=>`<button class="brchip sev-${b.sev}" data-act="branch" data-i="${i}">
            ${b.san} <em>${BR_SEV[b.sev].label}</em></button>`).join("")}
        </div>`:""}
        <p class="develse">${list.length
          ? "…or play their move on the board and I'll tell you what I can."
          : "Play their move on the board and I'll tell you what I can."}</p>
        <button class="devcancel" data-act="devcancel">Cancel <kbd>Esc</kbd></button>
      </div>`;
}

/* A branch's `see` names where the idea is covered in full: an opening, one of
   its lines, one of its model games, or a structure card. It is authored as
   "opening", "opening#slug" or "structure#id", with the slug matched loosely
   against line names and game ids -- content should not have to know the index
   of a line that moves. Lines win over games, so "rubinstein" finds the
   variation and "spielmann-rubinstein" finds the game. */
function brSlug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-"); }

function brSee(see){
  if(!see) return null;
  const [opId, slug] = String(see).split("#");
  if(opId === "structure"){
    const s = STRUCTURES.find(x=>x.id === slug);
    return s ? {label:s.name, lead:"The structure card", go:`structure:${s.id}`, line:-1} : null;
  }
  const op = DATA.find(o=>o.id === opId);
  if(!op) return null;
  if(slug){
    const i = op.lines.findIndex(l=>brSlug(l.name).indexOf(slug) >= 0);
    if(i >= 0) return {label:op.lines[i].name, lead:`In ${op.name}`, go:op.id, line:i};
    const g = GAMES.find(x=>x.op === opId && x.id.indexOf(slug) >= 0);
    if(g) return {label:g.name, lead:"The model game", go:`game:${g.id}`, line:-1};
    // Deliberately not falling back to the opening: a slug that matches nothing
    // is a typo or a line that has been renamed, and silently landing the reader
    // somewhere plausible is how that goes unnoticed.
    return null;
  }
  return {label:op.name, lead:"The opening", go:op.id, line:-1};
}

function brSeeHTML(b){
  const t = brSee(b.see);
  return t ? `
        <button class="brsee" data-act="see" data-go="${t.go}" data-line="${t.line}">
          <span class="brseelbl">${t.lead}</span>
          <span class="brseename">${t.label}</span>
        </button>` : "";
}

function brTapeHTML(b){
  return b.plies.map((p,i)=>{
    const num = p.turn==="w" ? `<span class="mvnum">${Math.ceil((i+1)/2)}.</span>` : "";
    const cls = i===state.branch.at ? "mv on" : (i<state.branch.at ? "mv seen" : "mv");
    return `${num}<button class="${cls}" data-act="brat" data-i="${i}">${p.san}</button>`;
  }).join("");
}

function brPanelHTML(){
  const b = brCur();
  if(!b) return "";
  const sev = BR_SEV[b.sev];
  const at = state.branch.at;
  const p = b.plies[at];
  const last = at >= b.plies.length - 1;
  return `
      <div class="branch sev-${b.sev}">
        <div class="brtop">
          <span class="brsev">${sev.label}</span>
          <span class="brmove">${b.plies[0].num}</span>
          ${b.name?`<span class="brname">${b.name}</span>`:""}
          <button class="brclose" data-act="brexit" title="Back to the line (Esc)">&#10005;</button>
        </div>
        <p class="brwhy">${b.why}</p>
        ${brSeeHTML(b)}
        ${b.plies.length>1?`
        <div class="brtape">${brTapeHTML(b)}</div>
        <div class="cmtop">
          <span class="cmmove">${p.num}</span>
          <span class="cmwho">${p.turn==="w"?"White to have moved":"Black to have moved"}</span>
        </div>
        ${p.tactics?`<div class="tactics"><span class="lbl">On the board</span><span class="body">${tacticsHTML(p.tactics)}.</span></div>`:""}
        <div class="brnav">
          <button class="ctl" data-act="brprev" ${at===0?"disabled":""}>&#8592; Back</button>
          <button class="ctl" data-act="brnext" ${last?"disabled":""}>Next &#8594;</button>
          <button class="ctl brret" data-act="brexit">Return to the line</button>
        </div>`:`
        <div class="brnav">
          <button class="ctl brret" data-act="brexit">Return to the line</button>
        </div>`}
      </div>`;
}

ACTIONS.deviate = ()=>{
  if(state.branch) return;
  state.pick = !state.pick;
  state.sel = null;
  render();
};
ACTIONS.devcancel = ()=>{ state.pick = false; render(); };
ACTIONS.branch = t=>brEnter(state.ply, +t.dataset.i, state.mode === "drill" ? "drill" : "read");
ACTIONS.brexit = ()=>brExit();
ACTIONS.brprev = ()=>step(-1);
ACTIONS.brnext = ()=>step(1);
ACTIONS.brat   = t=>{ state.branch.at = +t.dataset.i; render(); };
ACTIONS.see    = t=>{
  const line = +t.dataset.line;
  go(t.dataset.go);              // clears the branch and resets to ply 0 for us
  if(line >= 0){ state.line = line; render(); }
};
