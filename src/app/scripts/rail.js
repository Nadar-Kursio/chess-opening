/* ---------------- sidebar ---------------- */
function buildRail(){
  const rail = document.getElementById("rail");
  const sel  = document.getElementById("mobsel");
  let html = "", opts = "";

  html += `<div class="railgroup">
    <div class="railhead"><span class="glyph">\u2637</span> Start here</div>
    <button class="railitem${state.view==="primer"?" on":""}" data-go="primer">
      How openings actually work<span class="eco">Principles &middot; glossary</span></button>
  </div>`;
  opts += `<option value="primer"${state.view==="primer"?" selected":""}>How openings actually work</option>`;

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

  rail.innerHTML = html;
  sel.innerHTML = opts;
  rail.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
  sel.onchange = ()=>go(sel.value);
}

function go(id){
  stopPlay();
  if(id==="primer"){ state.view="primer"; }
  else { state.view="op"; state.opId=id; state.line=0; state.ply=0;
         state.flip = DATA.find(o=>o.id===id).orientation==="black"; }
  buildRail(); render();
  window.scrollTo({top:0,behavior:"instant"});
}
