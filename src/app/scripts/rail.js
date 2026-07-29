/* ---------------- sidebar ---------------- */
function buildRail(){
  const rail = document.getElementById("rail");
  const sel  = document.getElementById("mobsel");
  let html = "", opts = "";

  html += `<div class="railgroup">
    <div class="railhead"><span class="glyph">\u2637</span> Start here</div>
    <button class="railitem${state.view==="primer"?" on":""}" data-go="primer">
      How openings actually work<span class="eco">Principles &middot; glossary</span></button>
    <button class="railitem${state.view==="progress"?" on":""}" data-go="progress">
      Your progress<span class="eco">Scores &middot; export</span></button>
  </div>`;
  opts += `<option value="primer"${state.view==="primer"?" selected":""}>How openings actually work</option>`;
  opts += `<option value="progress"${state.view==="progress"?" selected":""}>Your progress</option>`;

  let lastGroup = "";
  SECTIONS.forEach(sec=>{
    const ops = DATA.filter(o=>o.section===sec.id);
    if(sec.group!==lastGroup){
      html += `<div class="railgroup"><div class="railhead"><span class="glyph">${sec.glyph}</span> ${sec.group}</div>`;
      opts += `<optgroup label="${sec.group}">`;
      lastGroup = sec.group;
    }
    html += `<div class="railsub">${sec.label}</div>`;
    ops.forEach(o=>{
      const on = state.view==="op" && state.opId===o.id;
      html += `<button class="railitem${on?" on":""}" data-go="${o.id}">${o.name}<span class="eco">${o.eco}</span></button>`;
      opts += `<option value="${o.id}"${on?" selected":""}>${sec.label} — ${o.name}</option>`;
    });
    const nextGroup = SECTIONS[SECTIONS.indexOf(sec)+1];
    if(!nextGroup || nextGroup.group!==sec.group){ html += `</div>`; opts += `</optgroup>`; }
  });

  // Both groups vanish entirely when their data is empty, so the rail is
  // unchanged until an opening actually ships structures or games.
  if(STRUCTURES.length){
    html += `<div class="railgroup"><div class="railhead"><span class="glyph">⬒</span> Pawn structures</div>`;
    opts += `<optgroup label="Pawn structures">`;
    STRUCTURES.filter(s=>tierVisible(s.tier)).forEach(s=>{
      const on = state.view==="structure" && state.structId===s.id;
      html += `<button class="railitem${on?" on":""}" data-go="structure:${s.id}">${s.name}</button>`;
      opts += `<option value="structure:${s.id}"${on?" selected":""}>${s.name}</option>`;
    });
    html += `</div>`; opts += `</optgroup>`;
  }
  if(GAMES.length){
    html += `<div class="railgroup"><div class="railhead"><span class="glyph">♟</span> Model games</div>`;
    opts += `<optgroup label="Model games">`;
    GAMES.filter(g=>tierVisible(g.tier)).forEach(g=>{
      const on = state.view==="game" && state.gameId===g.id;
      html += `<button class="railitem${on?" on":""}" data-go="game:${g.id}">${g.name}</button>`;
      opts += `<option value="game:${g.id}"${on?" selected":""}>${g.name}</option>`;
    });
    html += `</div>`; opts += `</optgroup>`;
  }

  rail.innerHTML = html;
  sel.innerHTML = opts;
  rail.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
  sel.onchange = ()=>go(sel.value);
}

function go(id){
  stopPlay();
  state.branch = null;
  state.pick = false;
  state.sel = null;
  if(id==="primer" || id==="progress"){ state.view=id; }
  else if(id.indexOf("structure:")===0){ state.view="structure"; state.structId=id.slice(10); }
  else if(id.indexOf("game:")===0){
    state.view="game"; state.gameId=id.slice(5); state.ply=0; state.flip=false;
  }
  else { state.view="op"; state.opId=id; state.line=0; state.ply=0;
         state.flip = DATA.find(o=>o.id===id).orientation==="black"; }
  dbRemember();
  buildRail(); render();
  window.scrollTo({top:0,behavior:"instant"});
}
