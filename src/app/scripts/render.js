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
    default:          return opHTML();
  }
}

function opHTML(){
  const op = DATA.find(o=>o.id===state.opId);
  const line = op.lines[state.line];
  return opHeadHTML(op) + jumpHTML(op) + studyHTML(op, line, curPly())
       + theoryHTML(op) + pathHTML(op);
}

function opHeadHTML(op){
  const sec = SECTIONS.find(s=>s.id===op.section);
  return `
  <div class="ophead">
    <div class="opkicker">
      <span>${sec.group}</span><span class="sep">/</span><span>${sec.label}</span>
      <span class="sep">/</span><span class="lvl">${op.eco}</span>
      <span class="sep">/</span><span class="lvl">${op.level}</span>
    </div>
    <h2 class="opname">${op.name}</h2>
    <p class="optag">${op.tagline}</p>
  </div>
`;
}

function jumpHTML(op){
  return `
  <nav class="jump">
    <a href="#study-${op.id}">Play through the moves</a>
    <a href="#theory-${op.id}">Strategy</a>
    <a href="#path-${op.id}">Learning path</a>
  </nav>
`;
}

function tapeHTML(line){
  const hide = state.mode === "drill";
  return line.plies.slice(1).map((q,i)=>{
    const idx = i+1;
    const num = q.turn==="w" ? `<span class="mvnum">${Math.ceil(idx/2)}.</span>` : "";
    // In drill the move list is the answer sheet, so everything ahead is masked.
    if(hide && idx > state.ply) return `${num}<span class="mv mask" aria-hidden="true">••</span>`;
    const cls = idx===state.ply ? "mv on" : (idx<state.ply ? "mv seen" : "mv");
    return `${num}<button class="${cls}" data-ply="${idx}">${q.san}</button>`;
  }).join("");
}

function commentaryHTML(p){
  return `
      <div class="commentary">
        <div class="cmtop">
          <span class="cmmove">${state.ply===0?"Start":p.num}</span>
          <span class="cmwho">${state.ply===0?"Before the first move":(p.turn==="w"?"White to have moved":"Black to have moved")}</span>
        </div>
        <p class="cmtext">${p.note}</p>
        ${state.ply>0 && p.tactics?`<div class="tactics"><span class="lbl">On the board</span><span class="body">${tacticsHTML(p.tactics)}.</span></div>`:""}
      </div>`;
}

function studyHTML(op, line, p){
  const inBranch = !!state.branch;
  const seq = curSeq(), idx = curIdx();
  const atEnd = idx >= seq.length-1;
  const atStart = idx === 0;
  const locked = dxAsking();     // stepping forward in drill would reveal the answer
  const showArrows = state.arrows && !dxHideArrows();
  return `
  <section class="study" id="study-${op.id}">
    ${dxBarHTML(line)}
    <div class="boardcol">
      <div class="boardframe">
        <div class="boardwrap">${boardCells(p.fen,p.from,p.to,p.check?(p.turn==="w"?"b":"w"):null,state.flip)}<canvas class="arrows" id="arrowlayer"></canvas></div>
      </div>
      <div class="controls">
        <button class="ctl" id="b-first" ${atStart?"disabled":""} title="Start (Home)">&#8676;</button>
        <button class="ctl wide" id="b-prev" ${atStart?"disabled":""} title="Back (\u2190)">&#8592; Back</button>
        <button class="ctl wide" id="b-next" ${atEnd||locked?"disabled":""} title="Forward (\u2192)">Next &#8594;</button>
        <button class="ctl" id="b-last" ${atEnd||locked?"disabled":""} title="End (End)">&#8677;</button>
      </div>
      <div class="ctlbar2">
        <button class="ctl${state.timer?" on":""}" id="b-play" ${state.mode==="drill"?"disabled":""}>${state.timer?"\u25A0 Stop":"\u25B6 Play through"}</button>
        <button class="ctl" id="b-flip">\u21C5 Flip board</button>
        <button class="ctl${state.arrows?" on":""}" id="b-arrows" ${dxHideArrows()?"disabled":""}>\u2197 Arrows: ${state.arrows?"On":"Off"}</button>
      </div>
      ${showArrows?`<div class="legend">
        <span><i class="mv"></i>the move</span>
        <span><i class="atk"></i>attacks</span>
        <span><i class="chk"></i>check</span>
        <span><i class="def"></i>defends</span>
        <span><i class="ctrl"></i>controls a key square</span>
      </div>`:""}
      <div class="counter">${inBranch
        ? `Deviation &mdash; move ${idx+1} of ${seq.length}`
        : `Move ${state.ply} of ${line.plies.length-1}`} &nbsp;\u00B7&nbsp; ${state.flip?"Black":"White"} at the bottom</div>
      <div class="hint">${state.mode==="drill"
        ? "Click a piece then its square, or drag it. <b>H</b> hint &middot; <b>S</b> show &middot; <b>M</b> back to reading."
        : "Use \u2190 and \u2192 keys, or click any move in the list."}</div>
    </div>

    <div class="studycol">
      <div class="vartabs">
        ${op.lines.map((l,i)=>`<button class="vartab${i===state.line?" on":""}" data-line="${i}">${l.name}</button>`).join("")}
      </div>
      <p class="varnote">${line.note}</p>
      <div class="tape${inBranch?" brmuted":""}" id="tape">${tapeHTML(line)}</div>
      ${state.pick ? brPickerHTML() : ""}
      ${inBranch ? brPanelHTML()
        : state.mode==="drill" ? dxPanelHTML(line) : commentaryHTML(p)}
      ${planHTML(op, line)}
    </div>
  </section>
`;
}

function theoryHTML(op){
  const t = op.theory;
  return `
  <div class="theory" id="theory-${op.id}">
    <div class="card span">
      <p class="cardhead">The idea in one paragraph</p>
      <p>${t.big_idea}</p>
    </div>
    <div class="card span">
      <p class="cardhead">The pawn structure</p>
      <p>${t.structure}</p>
    </div>
    <div class="card">
      <p class="cardhead">\u2654 White's plans</p>
      <ul>${t.white_plans.map(x=>`<li>${x}</li>`).join("")}</ul>
    </div>
    <div class="card">
      <p class="cardhead">\u265A Black's plans</p>
      <ul>${t.black_plans.map(x=>`<li>${x}</li>`).join("")}</ul>
    </div>
    <div class="card warn span">
      <p class="cardhead">Traps and things that lose games</p>
      <ul>${t.traps.map(x=>`<li>${x}</li>`).join("")}</ul>
    </div>
    <div class="who"><p>${t.who}</p></div>
  </div>
`;
}

function pathHTML(op){
  const pr = op.progression;
  const shown = pr.stages.filter(st=>tierVisible(st.tier));
  const hidden = pr.stages.length - shown.length;
  return `
  <section class="prog" id="path-${op.id}">
    <p class="cardhead">Your learning path &mdash; ${op.name}</p>
    <p class="progarc">${pr.arc}</p>
    <ol class="steps">
      ${shown.map(st=>`
        <li>
          <div class="steptop"><span class="tier">${st.tier}</span><span class="when">${st.when}</span></div>
          <p class="goal"><b>Goal.</b> ${st.goal}</p>
          <ul class="learn">${st.learn.map(x=>`<li>${x}</li>`).join("")}</ul>
          <div class="micro"><b>Drill</b><span>${st.drill}</span></div>
          <div class="micro warn"><b>Common mistake</b><span>${st.mistake}</span></div>
          <div class="micro ok"><b>Move on when</b><span>${st.ready}</span></div>
        </li>`).join("")}
    </ol>
    ${hidden?`<p class="tiermore">${hidden} later stage${hidden===1?"":"s"} hidden &mdash;
      raise <b>Show</b> above ${state.tier} to see ${hidden===1?"it":"them"}.</p>`:""}
    <div class="progfoot">
      <div class="card"><p class="cardhead">Whose games to study</p><p>${pr.study}</p></div>
      <div class="card"><p class="cardhead">What to learn after this</p><p>${pr.next}</p></div>
    </div>
  </section>
`;
}

function bindView(el){
  if(state.view!=="op" && state.view!=="game") return;
  const jump = n=>{ if(state.branch) state.branch.at=n; else state.ply=n; render(); };
  document.getElementById("b-first").onclick = ()=>{stopPlay();jump(0)};
  document.getElementById("b-prev").onclick  = ()=>{stopPlay();step(-1)};
  document.getElementById("b-next").onclick  = ()=>{stopPlay();step(1)};
  document.getElementById("b-last").onclick  = ()=>{stopPlay();jump(curSeq().length-1)};
  document.getElementById("b-flip").onclick  = ()=>{state.flip=!state.flip;render()};
  document.getElementById("b-arrows").onclick = ()=>{state.arrows=!state.arrows;render()};
  document.getElementById("b-play").onclick  = togglePlay;
  el.querySelectorAll("[data-line]").forEach(b=>b.onclick=()=>{
    stopPlay(); state.branch=null; state.pick=false;
    state.line=+b.dataset.line; state.ply=0;
    if(state.mode==="drill") dxStart(); else render();
  });
  el.querySelectorAll("[data-ply]").forEach(b=>b.onclick=()=>{
    stopPlay(); state.branch=null; state.pick=false;
    state.ply=+b.dataset.ply; render();
  });
}

function afterRender(){
  sizeBoard();
  drawArrows();
  dxArm();
  const on = document.querySelector(".mv.on");
  if(on && on.scrollIntoView) on.scrollIntoView({block:"nearest"});
  dbRemember();   // debounced, so stepping a line with the arrow keys costs one write
}

function step(d){
  const seq = curSeq();
  const n = curIdx() + d;
  if(n<0 || n>seq.length-1) return false;
  if(state.branch) state.branch.at = n; else state.ply = n;
  render(); return true;
}
function togglePlay(){
  if(state.timer){ stopPlay(); render(); return; }
  state.timer = setInterval(()=>{ if(!step(1)) { stopPlay(); render(); } }, 1500);
  render();
}
function stopPlay(){
  if(state.timer){ clearInterval(state.timer); state.timer=null; }
  if(dxTimer){ clearTimeout(dxTimer); dxTimer=null; }
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
  if(dxKey(e)){ e.preventDefault(); return; }
  if(state.view!=="op" && state.view!=="game") return;
  const jump = n=>{ if(state.branch) state.branch.at=n; else state.ply=n; render(); };
  if(e.key==="ArrowRight"){ stopPlay(); step(1); e.preventDefault(); }
  if(e.key==="ArrowLeft"){ stopPlay(); step(-1); e.preventDefault(); }
  if(e.key==="Home"){ stopPlay(); jump(0); e.preventDefault(); }
  if(e.key==="End"){ stopPlay(); jump(curSeq().length-1); e.preventDefault(); }
});
