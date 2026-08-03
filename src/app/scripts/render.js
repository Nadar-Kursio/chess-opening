/* ---------------- render ---------------- */
/* One full innerHTML rewrite per state change, deliberately: the page is small
   enough that diffing would cost more than it saves. The view is split into
   partials only so each piece is addressable -- render() itself stays a router. */
function render(){
  const el = document.getElementById("content");
  el.innerHTML = viewHTML();
  bindView(el);
  afterRender();
}

function viewHTML(){
  switch(state.view){
    case "primer":    return primerHTML();
    case "progress":  return progressHTML();
    case "structure": return structureHTML(STRUCTURES.find(s=>s.id===state.structId));
    case "game":      return gameHTML(GAMES.find(g=>g.id===state.gameId));
    default:          return openingHTML();
  }
}

/* Every view opens the same way: where this sits in the course, what it is
   called, and one line on why you would read it. */
function pageHeadHTML(meta, title, lede){
  const parts = meta.filter(Boolean).map(x=>`<span>${x}</span>`);
  return `
  <header class="page-head">
    <div class="page-head__meta label label--accent">${parts.join('<span class="sep">/</span>')}</div>
    <h1 class="page-title">${title}</h1>
    ${lede?`<p class="page-lede">${lede}</p>`:""}
  </header>`;
}

function openingHTML(){
  const op = currentOpening();
  const line = op.lines[state.line];
  const sec = SECTIONS.find(s=>s.id===op.section);
  return pageHeadHTML(
      [sec.group, sec.label, `<span class="mono">${op.eco}</span>`, `<span class="mono">${op.level}</span>`],
      op.name, op.tagline)
    + sectionNavHTML(op)
    + studyHTML(op, line, currentPly())
    + strategyHTML(op)
    + pathHTML(op);
}

function sectionNavHTML(op){
  return `
  <nav class="sections" aria-label="Sections of this opening">
    <a href="#moves-${op.id}">The moves</a>
    <a href="#ideas-${op.id}">The ideas</a>
    <a href="#path-${op.id}">Learning path</a>
  </nav>`;
}

function scoresheetHTML(line){
  const hide = state.mode === "drill";
  return line.plies.slice(1).map((q,i)=>{
    const idx = i+1;
    const num = q.turn==="w" ? `<span class="scoresheet__no">${Math.ceil(idx/2)}.</span>` : "";
    // In drill the move list is the answer sheet, so everything ahead is masked.
    if(hide && idx > state.ply) return `${num}<span class="move--masked" aria-hidden="true">••</span>`;
    const cls = idx===state.ply ? "move current" : (idx<state.ply ? "move played" : "move");
    return `${num}<button class="${cls}" data-ply="${idx}">${q.san}</button>`;
  }).join("");
}

/* How the games that reached this line's key position actually finished.
   `at` is a ply and not the whole line, because master practice thins out fast:
   twenty plies in, a variation has a few dozen games and the percentages are
   noise. The number worth showing is the one from the move the variation is
   named for, so the record says which move it counted from -- except in drill,
   where naming a move ahead of the reader is the one thing the scoresheet is
   masked to prevent. */
function recordHTML(line){
  const r = line.record;
  if(!r) return "";
  const share = (who,n)=>`<span class="record__share record__share--${who}"
    style="width:${n}%">${n>=12?n+"%":""}</span>`;
  const games = r.games.toLocaleString();
  const at = state.mode==="drill" ? "" : line.plies[r.at].num;
  return `
      <div class="record">
        <div class="record__bar" role="img" aria-label="Of ${games} master games from this position, White won ${r.white}%, ${r.draw}% were drawn, and Black won ${r.black}%.">
          ${share("white",r.white)}${share("draw",r.draw)}${share("black",r.black)}
        </div>
        <p class="record__caption">${games} master games${at?` after <b>${at}</b>`:""}
          <span class="sep">&middot;</span> White ${r.white}%
          <span class="sep">&middot;</span> Draw ${r.draw}%
          <span class="sep">&middot;</span> Black ${r.black}%</p>
      </div>`;
}

function tacticsLineHTML(tactics){
  return `<div class="tactics"><span class="label">On the board</span>
    <span>${tacticsHTML(tactics)}.</span></div>`;
}

function coachNoteHTML(p){
  return `
      <article class="coach">
        <header class="coach__head">
          <span class="coach__move">${state.ply===0?"Start":p.num}</span>
          <span class="label">${state.ply===0?"Before the first move"
            :(p.turn==="w"?"White to have moved":"Black to have moved")}</span>
        </header>
        <p class="coach__body">${p.note}</p>
        ${state.ply>0 && p.tactics?tacticsLineHTML(p.tactics):""}
      </article>`;
}

function studyHTML(op, line, p){
  const inDeviation = !!state.deviation;
  const plies = currentPlies(), idx = currentIndex();
  const locked = drillAsking();     // stepping forward in drill would reveal the answer

  return `
  <section class="study" id="moves-${op.id}">
    ${modeBarHTML(line)}

    ${boardColumnHTML({
      ply:p, index:idx, total:plies.length-1, locked, arrows:true,
      canPlay:state.mode!=="drill" && !inDeviation,
      readout: inDeviation
        ? `Deviation &mdash; <b>${idx+1}</b> of ${plies.length}`
        : `Move <b>${state.ply}</b> of ${line.plies.length-1}`,
      hint: state.mode==="drill"
        ? "Tap a piece then its square, or drag it. <b>H</b> hint · <b>S</b> show · <b>M</b> read"
        : "Play a move on the board and I'll answer it. <b>←</b> <b>→</b> to step."
    })}

    <div class="study__notes">
      <div class="variations" role="group" aria-label="Variations of ${op.name}">
        ${op.lines.map((l,i)=>`<button class="variation"
          aria-pressed="${i===state.line}" data-line="${i}">${l.name}</button>`).join("")}
      </div>
      <p class="variation__note">${line.note}</p>
      ${recordHTML(line)}
      <div class="scoresheet scroller${inDeviation?" scoresheet--muted":""}" id="tape">${scoresheetHTML(line)}</div>
      ${state.picking ? devPickerHTML() : ""}
      ${inDeviation ? devPanelHTML()
        : state.mode==="drill" ? drillPanelHTML(line)
        : `${state.drill.verdict && state.drill.verdictPly === state.ply
              ? `<p class="verdict verdict--framed" data-tone="${state.drill.tone||"flat"}">${state.drill.verdict}</p>` : ""}
           ${coachNoteHTML(p)}`}
      ${planHTML(op, line)}
    </div>
  </section>`;
}

function strategyHTML(op){
  const t = op.theory;
  return `
  <div class="strategy" id="ideas-${op.id}">
    <div class="card card--wide">
      <p class="card__head label label--accent">The idea in one paragraph</p>
      <p>${t.big_idea}</p>
    </div>
    <div class="card card--wide">
      <p class="card__head label label--accent">The pawn structure</p>
      <p>${t.structure}</p>
    </div>
    <div class="card">
      <p class="card__head label label--accent">♔ White's plans</p>
      <ul>${t.white_plans.map(x=>`<li>${x}</li>`).join("")}</ul>
    </div>
    <div class="card">
      <p class="card__head label label--accent">♚ Black's plans</p>
      <ul>${t.black_plans.map(x=>`<li>${x}</li>`).join("")}</ul>
    </div>
    <div class="card card--warn card--wide">
      <p class="card__head label label--danger">Traps and things that lose games</p>
      <ul>${t.traps.map(x=>`<li>${x}</li>`).join("")}</ul>
    </div>
    <div class="strategy__who"><p>${t.who}</p></div>
  </div>`;
}

function pathHTML(op){
  const pr = op.progression;
  const shown = pr.stages.filter(st=>tierVisible(st.tier));
  const hidden = pr.stages.length - shown.length;
  return `
  <section class="path" id="path-${op.id}">
    <p class="label label--accent">Your learning path &mdash; ${op.name}</p>
    <p class="path__arc">${pr.arc}</p>
    <ol class="stages">
      ${shown.map(st=>`
        <li>
          <div class="stage__top"><span class="stage__name">${st.tier}</span>
            <span class="label">${st.when}</span></div>
          <p class="stage__goal"><b>Goal.</b> ${st.goal}</p>
          <ul class="stage__learn">${st.learn.map(x=>`<li>${x}</li>`).join("")}</ul>
          <div class="stage__fact"><span class="label">Drill</span><span>${st.drill}</span></div>
          <div class="stage__fact stage__fact--warn"><span class="label">Common mistake</span><span>${st.mistake}</span></div>
          <div class="stage__fact stage__fact--ok"><span class="label">Move on when</span><span>${st.ready}</span></div>
        </li>`).join("")}
    </ol>
    ${hidden?`<p class="hidden-note">${hidden} later stage${hidden===1?"":"s"} hidden &mdash;
      raise <b>How deep to go</b> above ${state.tier} to see ${hidden===1?"it":"them"}.</p>`:""}
    <div class="path__foot">
      <div class="card"><p class="card__head label label--accent">Whose games to study</p><p>${pr.study}</p></div>
      <div class="card"><p class="card__head label label--accent">What to learn after this</p><p>${pr.next}</p></div>
    </div>
  </section>`;
}

function bindView(el){
  if(state.view!=="op" && state.view!=="game") return;
  const jump = n=>{ if(state.deviation) state.deviation.at=n; else state.ply=n; render(); };
  document.getElementById("b-first").onclick = ()=>{stopAutoplay();jump(0)};
  document.getElementById("b-prev").onclick  = ()=>{stopAutoplay();step(-1)};
  document.getElementById("b-next").onclick  = ()=>{stopAutoplay();step(1)};
  document.getElementById("b-last").onclick  = ()=>{stopAutoplay();jump(currentPlies().length-1)};
  document.getElementById("b-flip").onclick  = ()=>{state.flipped=!state.flipped;render()};
  document.getElementById("b-arrows").onclick = ()=>{state.arrows=!state.arrows;render()};
  document.getElementById("b-play").onclick  = toggleAutoplay;
  el.querySelectorAll("[data-line]").forEach(b=>b.onclick=()=>{
    stopAutoplay(); state.deviation=null; state.picking=false;
    state.line=+b.dataset.line; state.ply=0;
    if(state.mode==="drill") drillStart(); else render();
  });
  el.querySelectorAll("[data-ply]").forEach(b=>b.onclick=()=>{
    stopAutoplay(); state.deviation=null; state.picking=false;
    state.ply=+b.dataset.ply; render();
  });
}

/* Keep the current move visible inside the scoresheet, and nowhere else.
   scrollIntoView cannot do this: it scrolls every scrollable ancestor up to and
   including the document, which on a phone -- where the scoresheet sits under a
   pinned board -- drags the board off the screen on every move.

   Both axes, because the sheet wraps into rows on a wide screen and scrolls
   sideways as one ribbon on a narrow one. */
function scrollScoresheetToCurrent(){
  const sheet = document.getElementById("tape");
  const current = sheet && sheet.querySelector(".move.current");
  if(!current) return;
  const box = sheet.getBoundingClientRect(), move = current.getBoundingClientRect();
  if(move.top < box.top)            sheet.scrollTop -= (box.top - move.top);
  else if(move.bottom > box.bottom) sheet.scrollTop += (move.bottom - box.bottom);
  if(sheet.scrollWidth > sheet.clientWidth){
    sheet.scrollLeft += (move.left + move.width/2) - (box.left + box.width/2);
  }
}

function afterRender(){
  sizePieces();
  drawArrows();
  drillArm();
  scrollScoresheetToCurrent();
  syncAppbar();
  dbRemember();   // debounced, so stepping a line with the arrow keys costs one write
}

function step(d){
  const plies = currentPlies();
  const n = currentIndex() + d;
  if(n<0 || n>plies.length-1) return false;
  if(state.deviation) state.deviation.at = n; else state.ply = n;
  render(); return true;
}
function toggleAutoplay(){
  if(state.autoplay){ stopAutoplay(); render(); return; }
  state.autoplay = setInterval(()=>{ if(!step(1)) { stopAutoplay(); render(); } }, 1500);
  render();
}
function stopAutoplay(){
  if(state.autoplay){ clearInterval(state.autoplay); state.autoplay=null; }
  if(drillTimer){ clearTimeout(drillTimer); drillTimer=null; }
}

/* One delegated listener on #content. render() refills that node but never
   replaces it, so a control declared with data-act stays wired through every
   rewrite and costs no rebinding line. */
document.getElementById("content").addEventListener("click", e=>{
  const hit = e.target.closest("[data-act]");
  if(!hit) return;
  const fn = ACTIONS[hit.dataset.act];
  if(!fn) return;
  e.preventDefault();
  fn(hit, e);
});

document.addEventListener("keydown",e=>{
  if(drillKey(e)){ e.preventDefault(); return; }
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if(state.view!=="op" && state.view!=="game") return;
  const jump = n=>{ if(state.deviation) state.deviation.at=n; else state.ply=n; render(); };
  if(e.key==="ArrowRight"){ stopAutoplay(); step(1); e.preventDefault(); }
  if(e.key==="ArrowLeft"){ stopAutoplay(); step(-1); e.preventDefault(); }
  if(e.key==="Home"){ stopAutoplay(); jump(0); e.preventDefault(); }
  if(e.key==="End"){ stopAutoplay(); jump(currentPlies().length-1); e.preventDefault(); }
});
