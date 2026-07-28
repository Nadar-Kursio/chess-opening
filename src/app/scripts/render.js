/* ---------------- render ---------------- */
function render(){
  const el = document.getElementById("content");
  if(state.view==="primer"){ el.innerHTML = primerHTML(); return; }

  const op = DATA.find(o=>o.id===state.opId);
  const line = op.lines[state.line];
  const p = line.plies[state.ply];
  const sec = SECTIONS.find(s=>s.id===op.section);
  const t = op.theory;
  const pr = op.progression;

  const tape = line.plies.slice(1).map((q,i)=>{
    const idx = i+1;
    const num = q.turn==="w" ? `<span class="mvnum">${Math.ceil(idx/2)}.</span>` : "";
    const cls = idx===state.ply ? "mv on" : (idx<state.ply ? "mv seen" : "mv");
    return `${num}<button class="${cls}" data-ply="${idx}">${q.san}</button>`;
  }).join("");

  el.innerHTML = `
  <div class="ophead">
    <div class="opkicker">
      <span>${sec.group}</span><span class="sep">/</span><span>${sec.label}</span>
      <span class="sep">/</span><span class="lvl">${op.eco}</span>
      <span class="sep">/</span><span class="lvl">${op.level}</span>
    </div>
    <h2 class="opname">${op.name}</h2>
    <p class="optag">${op.tagline}</p>
  </div>

  <nav class="jump">
    <a href="#study-${op.id}">Play through the moves</a>
    <a href="#theory-${op.id}">Strategy</a>
    <a href="#path-${op.id}">Learning path</a>
  </nav>

  <section class="study" id="study-${op.id}">
    <div class="boardcol">
      <div class="boardframe">
        <div class="boardwrap">${boardCells(p.fen,p.from,p.to,p.check?(p.turn==="w"?"b":"w"):null,state.flip)}<canvas class="arrows" id="arrowlayer"></canvas></div>
      </div>
      <div class="controls">
        <button class="ctl" id="b-first" ${state.ply===0?"disabled":""} title="Start (Home)">&#8676;</button>
        <button class="ctl wide" id="b-prev" ${state.ply===0?"disabled":""} title="Back (\u2190)">&#8592; Back</button>
        <button class="ctl wide" id="b-next" ${state.ply>=line.plies.length-1?"disabled":""} title="Forward (\u2192)">Next &#8594;</button>
        <button class="ctl" id="b-last" ${state.ply>=line.plies.length-1?"disabled":""} title="End (End)">&#8677;</button>
      </div>
      <div class="ctlbar2">
        <button class="ctl${state.timer?" on":""}" id="b-play">${state.timer?"\u25A0 Stop":"\u25B6 Play through"}</button>
        <button class="ctl" id="b-flip">\u21C5 Flip board</button>
        <button class="ctl${state.arrows?" on":""}" id="b-arrows">\u2197 Arrows: ${state.arrows?"On":"Off"}</button>
      </div>
      ${state.arrows?`<div class="legend">
        <span><i class="mv"></i>the move</span>
        <span><i class="atk"></i>attacks</span>
        <span><i class="chk"></i>check</span>
        <span><i class="def"></i>defends</span>
        <span><i class="ctrl"></i>controls a key square</span>
      </div>`:""}
      <div class="counter">Move ${state.ply} of ${line.plies.length-1} &nbsp;\u00B7&nbsp; ${state.flip?"Black":"White"} at the bottom</div>
      <div class="hint">Use \u2190 and \u2192 keys, or click any move in the list.</div>
    </div>

    <div class="studycol">
      <div class="vartabs">
        ${op.lines.map((l,i)=>`<button class="vartab${i===state.line?" on":""}" data-line="${i}">${l.name}</button>`).join("")}
      </div>
      <p class="varnote">${line.note}</p>
      <div class="tape" id="tape">${tape}</div>
      <div class="commentary">
        <div class="cmtop">
          <span class="cmmove">${state.ply===0?"Start":p.num}</span>
          <span class="cmwho">${state.ply===0?"Before the first move":(p.turn==="w"?"White to have moved":"Black to have moved")}</span>
        </div>
        <p class="cmtext">${p.note}</p>
        ${state.ply>0 && p.tactics?`<div class="tactics"><span class="lbl">On the board</span><span class="body">${tacticsHTML(p.tactics)}.</span></div>`:""}
      </div>
    </div>
  </section>

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

  <section class="prog" id="path-${op.id}">
    <p class="cardhead">Your learning path &mdash; ${op.name}</p>
    <p class="progarc">${pr.arc}</p>
    <ol class="steps">
      ${pr.stages.map(st=>`
        <li>
          <div class="steptop"><span class="tier">${st.tier}</span><span class="when">${st.when}</span></div>
          <p class="goal"><b>Goal.</b> ${st.goal}</p>
          <ul class="learn">${st.learn.map(x=>`<li>${x}</li>`).join("")}</ul>
          <div class="micro"><b>Drill</b><span>${st.drill}</span></div>
          <div class="micro warn"><b>Common mistake</b><span>${st.mistake}</span></div>
          <div class="micro ok"><b>Move on when</b><span>${st.ready}</span></div>
        </li>`).join("")}
    </ol>
    <div class="progfoot">
      <div class="card"><p class="cardhead">Whose games to study</p><p>${pr.study}</p></div>
      <div class="card"><p class="cardhead">What to learn after this</p><p>${pr.next}</p></div>
    </div>
  </section>`;

  document.getElementById("b-first").onclick = ()=>{stopPlay();state.ply=0;render()};
  document.getElementById("b-prev").onclick  = ()=>{stopPlay();step(-1)};
  document.getElementById("b-next").onclick  = ()=>{stopPlay();step(1)};
  document.getElementById("b-last").onclick  = ()=>{stopPlay();state.ply=line.plies.length-1;render()};
  document.getElementById("b-flip").onclick  = ()=>{state.flip=!state.flip;render()};
  document.getElementById("b-arrows").onclick = ()=>{state.arrows=!state.arrows;render()};
  document.getElementById("b-play").onclick  = togglePlay;
  el.querySelectorAll("[data-line]").forEach(b=>b.onclick=()=>{
    stopPlay(); state.line=+b.dataset.line; state.ply=0; render();
  });
  el.querySelectorAll("[data-ply]").forEach(b=>b.onclick=()=>{
    stopPlay(); state.ply=+b.dataset.ply; render();
  });
  sizeBoard();
  drawArrows();
  const on = document.querySelector(".mv.on");
  if(on && on.scrollIntoView) on.scrollIntoView({block:"nearest"});
}

function step(d){
  const line = DATA.find(o=>o.id===state.opId).lines[state.line];
  const n = state.ply + d;
  if(n<0 || n>line.plies.length-1) return false;
  state.ply = n; render(); return true;
}
function togglePlay(){
  if(state.timer){ stopPlay(); render(); return; }
  state.timer = setInterval(()=>{ if(!step(1)) { stopPlay(); render(); } }, 1500);
  render();
}
function stopPlay(){ if(state.timer){ clearInterval(state.timer); state.timer=null; } }

document.addEventListener("keydown",e=>{
  if(state.view!=="op") return;
  if(e.key==="ArrowRight"){ stopPlay(); step(1); e.preventDefault(); }
  if(e.key==="ArrowLeft"){ stopPlay(); step(-1); e.preventDefault(); }
  if(e.key==="Home"){ stopPlay(); state.ply=0; render(); e.preventDefault(); }
  if(e.key==="End"){ stopPlay(); const l=DATA.find(o=>o.id===state.opId).lines[state.line];
                     state.ply=l.plies.length-1; render(); e.preventDefault(); }
});
