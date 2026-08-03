/* ---------------- deviations ---------------- */
/* "They played something else" is the most common thing that happens to a
   prepared opening, so it is a first-class move here rather than a failure
   state. Three buckets, and only one of them is a mistake:

     blunder     there is a refutation, and here it is
     inaccuracy  small and lasting, here is what you get
     playable    a real move. Nothing to refute. Develop and carry on.

   Most deviations are the third kind. Tools that answer every one of them with
   a red cross teach a reflex that loses games -- hunting for a refutation that
   was never there.

   `mark` is the notation a player already reads. It is shown beside the word,
   never instead of it: the colour and the glyph are both shorthand, and the word
   is what makes the severity legible to someone who has neither. */
const SEVERITY = {
  blunder:    {label:"Blunder",    mark:"??", gist:"loses material or the game"},
  inaccuracy: {label:"Inaccuracy", mark:"?!", gist:"playable, but it costs something"},
  playable:   {label:"Playable",   mark:"=",  gist:"a real move — nothing to refute"},
};

function severityHTML(sev){
  const s = SEVERITY[sev];
  return `<span class="severity severity--${sev}">
    <b class="severity__mark" aria-hidden="true">${s.mark}</b>
    <span class="severity__word">${s.label}</span></span>`;
}

/* The deviation sets are shared between every line that reaches the position, so
   the move THIS line plays has to be dropped: from here it is the main line,
   not a deviation from it. */
function devAt(ply){
  const op = currentOpening();
  if(!op || !op.branchsets) return [];
  const line = op.lines[state.line];
  const here = line && line.plies[ply];
  if(!here || here.bx === undefined) return [];
  const next = line.plies[ply + 1];
  return op.branchsets[here.bx].filter(b=>
    (!next || b.san !== next.san) && tierVisible(b.tier));
}

function devPlies(){
  const list = devAt(state.deviation.fromPly);
  const one = list[state.deviation.idx];
  return one ? one.plies : [];
}
function devCurrent(){
  const list = devAt(state.deviation.fromPly);
  return list[state.deviation.idx] || null;
}

function devEnter(fromPly, idx, origin){
  state.deviation = {fromPly, idx, at:0, origin:origin || "read"};
  state.picking = false;
  state.selected = null;
  render();
  const d = devCurrent();
  if(d) announce(`${SEVERITY[d.sev].label}. ${d.san}.`);
}

function devExit(){
  const origin = state.deviation && state.deviation.origin;
  state.deviation = null;
  state.selected = null;
  if(origin === "drill" && state.mode === "drill"){
    state.drill.phase = "ask";
    state.drill.verdict = ""; state.drill.tone = "";
  }
  render();
  announce("Back to the line.");
}

/* Does a played move match an authored deviation from this position? */
function devMatch(ply, from, to){
  const list = devAt(ply);
  for(let i=0;i<list.length;i++){
    const first = list[i].plies[0];
    if(first && first.from === from && first.to === to) return i;
  }
  return -1;
}

function devPickerHTML(){
  const list = devAt(state.ply);
  const line = currentLine();
  const next = line.plies[state.ply + 1];
  return `
      <div class="deviation-picker" id="deviation-picker">
        <p class="deviation-picker__lead">${next
          ? `What did they play instead of <b>${next.num}</b>?`
          : `What did they play here?`}</p>
        ${list.length?`<div class="candidates">
          ${list.map((b,i)=>`<button class="candidate candidate--${b.sev}" data-act="deviation" data-i="${i}">
            ${b.san} ${severityHTML(b.sev)}</button>`).join("")}
        </div>`:""}
        <p class="deviation-picker__else">${list.length
          ? "…or play their move on the board and I'll tell you what I can."
          : "Play their move on the board and I'll tell you what I can."}</p>
        <button class="deviation-picker__cancel" data-act="devcancel">Cancel <kbd>Esc</kbd></button>
      </div>`;
}

/* A deviation's `see` names where the idea is covered in full: an opening, one of
   its lines, one of its model games, or a structure card. It is authored as
   "opening", "opening#slug" or "structure#id", with the slug matched loosely
   against line names and game ids -- content should not have to know the index
   of a line that moves. Lines win over games, so "rubinstein" finds the
   variation and "spielmann-rubinstein" finds the game. */
function devSlug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-"); }

function devTarget(see){
  if(!see) return null;
  const [opId, slug] = String(see).split("#");
  if(opId === "structure"){
    const s = STRUCTURES.find(x=>x.id === slug);
    return s ? {label:s.name, lead:"The structure card", go:`structure:${s.id}`, line:-1} : null;
  }
  const op = DATA.find(o=>o.id === opId);
  if(!op) return null;
  if(slug){
    const i = op.lines.findIndex(l=>devSlug(l.name).indexOf(slug) >= 0);
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

function devJumpHTML(d){
  const t = devTarget(d.see);
  return t ? `
        <button class="jump-card" data-act="see" data-go="${t.go}" data-line="${t.line}">
          <span class="jump-card__lead label">${t.lead}</span>
          <span class="jump-card__name">${t.label}</span>
        </button>` : "";
}

function devScoresheetHTML(d){
  return d.plies.map((p,i)=>{
    const num = p.turn==="w" ? `<span class="scoresheet__no">${Math.ceil((i+1)/2)}.</span>` : "";
    const cls = i===state.deviation.at ? "move current" : (i<state.deviation.at ? "move played" : "move");
    return `${num}<button class="${cls}" data-act="devat" data-i="${i}">${p.san}</button>`;
  }).join("");
}

function devPanelHTML(){
  const d = devCurrent();
  if(!d) return "";
  const at = state.deviation.at;
  const p = d.plies[at];
  const last = at >= d.plies.length - 1;
  return `
      <article class="coach" data-tone="${d.sev}">
        <header class="coach__head">
          ${severityHTML(d.sev)}
          <span class="coach__move">${d.plies[0].num}</span>
          ${d.name?`<span class="coach__name">${d.name}</span>`:""}
          <button class="coach__close" data-act="devexit" aria-label="Back to the line"
            title="Back to the line (Esc)">&#10005;</button>
        </header>
        <p class="coach__body">${d.why}</p>
        ${devJumpHTML(d)}
        ${d.plies.length>1?`
        <div class="scoresheet scoresheet--inline">${devScoresheetHTML(d)}</div>
        <header class="coach__head coach__head--plain">
          <span class="coach__move">${p.num}</span>
          <span class="label">${p.turn==="w"?"White to have moved":"Black to have moved"}</span>
        </header>
        ${p.tactics?tacticsLineHTML(p.tactics):""}
        <div class="coach__actions">
          <button class="btn" data-act="devprev" ${at===0?"disabled":""}>&#8592; Back</button>
          <button class="btn" data-act="devnext" ${last?"disabled":""}>Next &#8594;</button>
          <button class="btn btn--primary" data-act="devexit">Return to the line</button>
        </div>`:`
        <div class="coach__actions">
          <button class="btn btn--primary" data-act="devexit">Return to the line</button>
        </div>`}
      </article>`;
}

ACTIONS.deviate = ()=>{
  if(state.deviation) return;
  state.picking = !state.picking;
  state.selected = null;
  render();
};
ACTIONS.devcancel = ()=>{ state.picking = false; render(); };
ACTIONS.deviation = t=>devEnter(state.ply, +t.dataset.i, state.mode === "drill" ? "drill" : "read");
ACTIONS.devexit = ()=>devExit();
ACTIONS.devprev = ()=>step(-1);
ACTIONS.devnext = ()=>step(1);
ACTIONS.devat   = t=>{ state.deviation.at = +t.dataset.i; render(); };
ACTIONS.see     = t=>{
  const line = +t.dataset.line;
  go(t.dataset.go);              // clears the deviation and resets to ply 0 for us
  if(line >= 0){ state.line = line; render(); }
};
