/* ---------------- chrome: the tier selector and the progress chip ---------------- */
/* Lives outside #content so render() never redraws it, and so it survives on
   narrow screens where the rail is display:none. */

/* Untiered content ranks 0 and is therefore always visible. That is what lets an
   opening carry no tier at all and lose nothing. */
function tierRank(t){
  if(!t) return 0;
  const i = TIERS.findIndex(x=>x.toLowerCase()===String(t).toLowerCase());
  return i < 0 ? 0 : i;
}
function tierVisible(t){ return tierRank(t) <= tierRank(state.tier); }

function buildChrome(){
  const el = document.getElementById("chrome");
  el.innerHTML = `
    <div class="tierbar" role="radiogroup" aria-label="Show content up to">
      <span class="tierlbl">Show</span>
      ${TIERS.map((t,i)=>`<button class="tierseg" data-tier="${t}" role="radio"
        aria-checked="false">${i?"+ ":""}${t}</button>`).join("")}
    </div>
    <button class="chip" id="progchip"></button>`;

  el.querySelectorAll("[data-tier]").forEach(b=>b.onclick=()=>{
    state.tier = b.dataset.tier;
    dbRemember();
    syncChrome();
    render();
    dxSay(`Showing content up to ${state.tier}.`);
  });
  document.getElementById("progchip").onclick = ()=>go("progress");

  // Left/right walk the group, the way a radio group is expected to behave.
  el.querySelector(".tierbar").addEventListener("keydown", e=>{
    const keys = {ArrowLeft:-1, ArrowRight:1};
    if(!(e.key in keys)) return;
    const i = TIERS.indexOf(state.tier);
    const next = TIERS[Math.min(TIERS.length-1, Math.max(0, i + keys[e.key]))];
    if(next === state.tier) return;
    state.tier = next; dbRemember(); syncChrome(); render();
    el.querySelector(`[data-tier="${next}"]`).focus();
    e.preventDefault();
  });

  syncChrome();
}

function syncChrome(){
  document.querySelectorAll("[data-tier]").forEach(b=>{
    const on = b.dataset.tier === state.tier;
    b.classList.toggle("on", on);
    b.setAttribute("aria-checked", on ? "true" : "false");
  });
  const chip = document.getElementById("progchip");
  if(chip) chip.innerHTML = progressChipHTML();
}

function drilledCount(){ return Object.keys(db.lines).length; }

function progressChipHTML(){
  const n = drilledCount();
  if(!n) return `Your progress`;
  return `<b>${n}</b> line${n===1?"":"s"} drilled` +
         (db.streak.best ? ` <span class="sep">·</span> best streak <b>${db.streak.best}</b>` : "");
}

/* Announce to assistive tech. Also the single place that guarantees every piece
   of feedback has a non-visual form -- reduced-motion users lose the animations,
   never the message. */
function dxSay(msg){
  const el = document.getElementById("dxlive");
  if(!el) return;
  el.textContent = "";
  setTimeout(()=>{ el.textContent = msg; }, 30);
}

function progressHTML(){
  const rows = Object.keys(db.lines).sort().map(key=>{
    const [opId, li] = key.split("/");
    const op = DATA.find(o=>o.id===opId);
    if(!op || !op.lines[li]) return "";     // catalogue moved under an old record
    const r = db.lines[key];
    const pct = r.asked ? Math.round(100 * r.right / r.asked) : 0;
    return `<li>
      <span class="pgname">${op.name} <em>${op.lines[li].name}</em></span>
      <span class="pgscore">${r.right}/${r.asked} first try &middot; ${pct}%</span>
      <button class="ctl" data-act="gotoline" data-op="${opId}" data-line="${li}">Open</button>
    </li>`;
  }).join("");

  return `
  <div class="ophead">
    <div class="opkicker"><span>Start here</span><span class="sep">/</span><span>Your progress</span></div>
    <h2 class="opname">Your progress</h2>
    <p class="optag">What you have drilled, and how it went.</p>
  </div>

  <div class="progpage">
    ${dbOK?"":`<p class="warn-note">This browser isn't saving progress — the page was
      opened from a file and storage is blocked. Your session still counts; use Export
      below to keep it.</p>`}
    ${dbFrozen?`<p class="warn-note">This progress was written by a newer version of the
      course, so it is being read but not overwritten.</p>`:""}

    <div class="card">
      <p class="cardhead">Lines drilled</p>
      ${rows ? `<ul class="pglist">${rows}</ul>` : `<p>Nothing yet. Open any opening and
        switch the study panel to Drill.</p>`}
    </div>

    <div class="card">
      <p class="cardhead">Keep or move your progress</p>
      <p>Progress lives in this browser only. Export it to keep a copy, or to carry it
        to another machine.</p>
      <div class="pgacts">
        <button class="ctl" data-act="export">Export</button>
        <button class="ctl" data-act="import">Import</button>
        <button class="ctl" data-act="reset">Reset…</button>
      </div>
      <textarea class="pgbox" id="pgbox" spellcheck="false"
        placeholder="Exported progress appears here. Paste a previous export and press Import."></textarea>
      <p class="pgmsg" id="pgmsg"></p>
    </div>
  </div>`;
}

ACTIONS.gotoline = t=>{
  state.view = "op"; state.opId = t.dataset.op;
  const op = DATA.find(o=>o.id===state.opId);
  state.line = Math.min(+t.dataset.line, op.lines.length-1);
  state.ply = 0;
  state.flip = op.orientation === "black";
  buildRail(); render(); window.scrollTo({top:0,behavior:"instant"});
};
ACTIONS.export = ()=>{
  document.getElementById("pgbox").value = dbExport();
  document.getElementById("pgmsg").textContent = "Copied into the box below — select it all and copy.";
};
ACTIONS.import = ()=>{
  const err = dbImport(document.getElementById("pgbox").value);
  const msg = document.getElementById("pgmsg");
  if(err){ msg.textContent = err; return; }
  syncChrome();
  msg.textContent = "Imported.";
  dxSay("Progress imported.");
};
ACTIONS.reset = (t)=>{
  // Two-step rather than a confirm() dialog, which some embedded viewers suppress.
  if(t.dataset.armed !== "1"){
    t.dataset.armed = "1";
    t.textContent = "Really reset?";
    return;
  }
  dbReset();
  syncChrome();
  render();
  dxSay("Progress reset.");
};
