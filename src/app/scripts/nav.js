/* ---------------- the course nav ---------------- */
/* One nav, built once, presented two ways: a rail beside the content on a wide
   screen, the same markup sliding in over it on a narrow one. Deliberately not a
   second, cut-down nav for phones -- anything built here has to reach both, and
   a <select> cannot hold a filter, a tier or a badge.

   The tier picker lives at the top of it because it changes what this list
   contains -- raise it and structures, games and deeper lines appear below. */

function tierNote(){
  const structures = STRUCTURES.filter(s=>!tierVisible(s.tier)).length;
  const games = GAMES.filter(g=>!tierVisible(g.tier)).length;
  const hidden = structures + games;
  if(!hidden) return "Everything in the course is showing.";
  const parts = [];
  if(structures) parts.push(`${structures} structure${structures===1?"":"s"}`);
  if(games) parts.push(`${games} model game${games===1?"":"s"}`);
  return `${parts.join(" and ")} still to come, plus the deeper lines.`;
}

function tierPickerHTML(){
  const at = tierRank(state.tier);
  return `
    <div class="tiers" role="radiogroup" aria-label="How deep to go">
      <div class="tiers__head">
        <span class="label">How deep to go</span>
        <span class="tiers__value">${state.tier}</span>
      </div>
      <div class="tiers__track">
        ${TIERS.map((t,i)=>`<button class="tiers__step${i<=at?" reached":""}"
          role="radio" aria-checked="${t===state.tier}" aria-label="${t}"
          title="${t}" data-tier="${t}">${i+1}</button>`).join("")}
      </div>
      <p class="tiers__note">${tierNote()}</p>
    </div>`;
}

function navItemHTML(id, label, meta, current, extra){
  return `<button class="nav__item" data-go="${id}" data-name="${esc(label)}"
    ${current?'aria-current="page"':""}${extra && extra.title?` title="${esc(extra.title)}"`:""}>
    <span class="nav__row">${label}${extra && extra.tag ? extra.tag : ""}</span>
    ${meta?`<span class="nav__meta">${meta}</span>`:""}
  </button>`;
}

function navGroupHTML(glyph, name, body){
  return `<div class="nav__group">
    <div class="nav__head"><span class="glyph" aria-hidden="true">${glyph}</span>
      <span class="label">${name}</span></div>
    ${body}
  </div>`;
}

function buildNav(){
  let html = `
    <button class="nav__close" data-nav="close">Close<span aria-hidden="true">✕</span></button>
    <div class="nav__tools">
      ${tierPickerHTML()}
      <input class="field" id="navfilter" type="search" autocomplete="off"
        placeholder="Filter the course…" aria-label="Filter the course"
        value="${esc(state.navQuery)}">
    </div>`;

  html += navGroupHTML("☰", "Start here",
      navItemHTML("primer", "How openings work", "Principles &middot; glossary", state.view==="primer")
    + navItemHTML("progress", "Your progress", "Scores &middot; export", state.view==="progress"));

  let lastGroup = "", body = "", glyph = "", groupName = "";
  const flush = ()=>{ if(groupName) html += navGroupHTML(glyph, groupName, body); };

  SECTIONS.forEach((sec, si)=>{
    if(sec.group !== lastGroup){
      flush();
      body = ""; glyph = sec.glyph; groupName = sec.group; lastGroup = sec.group;
    }
    body += `<div class="nav__sub">${sec.label}</div>`;
    DATA.filter(o=>o.section===sec.id).forEach(o=>{
      // The badge marks an opening that cannot yet answer a wrong move. Once
      // every opening is Coached it says the same thing thirteen times, which is
      // no longer information -- so it only shows when it means something.
      const lv = openingFeedbackLevel(o);
      const tag = lv < 2
        ? `<b class="nav__feedback nav__feedback--${lv}">${FEEDBACK_LEVELS[lv].tag}</b>` : "";
      body += navItemHTML(o.id, o.name, o.eco, state.view==="op" && state.opId===o.id,
                          {tag, title:openingFeedbackTitle(o)});
    });
    const next = SECTIONS[si+1];
    if(!next || next.group !== sec.group){ flush(); groupName = ""; }
  });

  // Both groups vanish entirely when their data is empty, so the nav is
  // unchanged until an opening actually ships structures or games.
  const structures = STRUCTURES.filter(s=>tierVisible(s.tier));
  if(structures.length){
    html += navGroupHTML("⬒", "Pawn structures", structures.map(s=>
      navItemHTML("structure:"+s.id, s.name, "",
                  state.view==="structure" && state.structId===s.id)).join(""));
  }
  const games = GAMES.filter(g=>tierVisible(g.tier));
  if(games.length){
    html += navGroupHTML("♟", "Model games", games.map(g=>
      navItemHTML("game:"+g.id, g.name, "",
                  state.view==="game" && state.gameId===g.id)).join(""));
  }

  const nav = document.getElementById("nav");
  nav.innerHTML = html;
  nav.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
  nav.querySelectorAll("[data-tier]").forEach(b=>b.onclick=()=>setTier(b.dataset.tier));
  nav.querySelector('[data-nav="close"]').onclick = closeNav;

  const filter = document.getElementById("navfilter");
  filter.oninput = ()=>{ state.navQuery = filter.value; applyNavFilter(); };
  applyNavFilter();

  // Left/right walk the tier picker, the way a radio group is expected to behave.
  nav.querySelector(".tiers__track").addEventListener("keydown", e=>{
    const keys = {ArrowLeft:-1, ArrowRight:1};
    if(!(e.key in keys)) return;
    const i = TIERS.indexOf(state.tier);
    const next = TIERS[Math.min(TIERS.length-1, Math.max(0, i + keys[e.key]))];
    e.preventDefault();
    if(next === state.tier) return;
    setTier(next);
    const step = document.querySelector(`[data-tier="${next}"]`);
    if(step) step.focus();
  });
}

/* Filtering hides rather than rebuilds: rebuilding would replace the input the
   learner is typing into and take the caret with it. */
function applyNavFilter(){
  const q = state.navQuery.trim().toLowerCase();
  const nav = document.getElementById("nav");
  let shown = 0;
  nav.querySelectorAll("[data-go]").forEach(item=>{
    const hit = !q || item.dataset.name.toLowerCase().indexOf(q) >= 0;
    item.hidden = !hit;
    if(hit) shown += 1;
  });
  // A group whose every item is filtered out, and its subheadings, go with them.
  nav.querySelectorAll(".nav__group").forEach(group=>{
    group.hidden = !group.querySelector("[data-go]:not([hidden])");
  });
  nav.querySelectorAll(".nav__sub").forEach(sub=>{
    let next = sub.nextElementSibling, any = false;
    while(next && next.classList.contains("nav__item")){
      if(!next.hidden){ any = true; break; }
      next = next.nextElementSibling;
    }
    sub.hidden = !!q && !any;
  });

  const old = nav.querySelector(".nav__empty");
  if(old) old.remove();
  if(q && !shown){
    nav.querySelector(".nav__tools")
       .insertAdjacentHTML("afterend", `<p class="nav__empty">Nothing matches “${esc(q)}”.</p>`);
  }
}

/* ---------------- the drawer ---------------- */
/* Only on a narrow screen -- the rail is always open on a wide one -- but the
   handlers are unconditional, because the button that calls them is what is
   hidden by the media query. */
function openNav(){
  state.navOpen = true;
  syncNav();
  const filter = document.getElementById("navfilter");
  if(filter) filter.focus();
}
function closeNav(){
  if(!state.navOpen) return;
  state.navOpen = false;
  syncNav();
  const toggle = document.getElementById("navtoggle");
  if(toggle) toggle.focus();
}
function syncNav(){
  const nav = document.getElementById("nav");
  const scrim = document.getElementById("scrim");
  const toggle = document.getElementById("navtoggle");
  nav.classList.toggle("open", state.navOpen);
  toggle.setAttribute("aria-expanded", state.navOpen ? "true" : "false");
  scrim.hidden = !state.navOpen;
  // Two frames apart so the scrim has a painted opacity:0 to transition from.
  if(state.navOpen) requestAnimationFrame(()=>scrim.classList.add("open"));
  else scrim.classList.remove("open");
}

/* The drawer covers the page, so Tab must not walk out of it into the content
   the scrim is over -- a keyboard user would be typing into something they
   cannot see. Filtered on the `hidden` the filter sets rather than on measured
   visibility, because the two agree here and only one of them needs layout. */
function navFocusables(){
  return [...document.getElementById("nav").querySelectorAll("button, input")]
    .filter(el=>!el.disabled && !el.closest("[hidden]"));
}

function trapNavFocus(e){
  if(!state.navOpen || e.key !== "Tab") return;
  const items = navFocusables();
  if(!items.length) return;
  const nav = document.getElementById("nav");
  const first = items[0], last = items[items.length - 1];
  const on = document.activeElement;
  const outside = !nav.contains(on);
  if(e.shiftKey ? (outside || on === first) : (outside || on === last)){
    (e.shiftKey ? last : first).focus();
    e.preventDefault();
  }
}

function bindShell(){
  document.getElementById("navtoggle").onclick = ()=>{
    if(state.navOpen) closeNav(); else openNav();
  };
  document.getElementById("scrim").onclick = closeNav;
  document.addEventListener("keydown", e=>{
    if(e.key === "Escape" && state.navOpen){ closeNav(); e.preventDefault(); return; }
    trapNavFocus(e);
  });
}

function go(id){
  stopAutoplay();
  state.deviation = null;
  state.picking = false;
  state.selected = null;
  if(id==="primer" || id==="progress"){ state.view=id; }
  else if(id.indexOf("structure:")===0){ state.view="structure"; state.structId=id.slice(10); }
  else if(id.indexOf("game:")===0){
    state.view="game"; state.gameId=id.slice(5); state.ply=0; state.flipped=false;
  }
  else {
    state.view="op"; state.opId=id; state.line=0; state.ply=0;
    state.flipped = DATA.find(o=>o.id===id).orientation==="black";
    // State only: this function renders once, at the end, and a drill that
    // rendered here too would draw the view half-built.
    if(state.mode === "drill") drillReset();
  }
  closeNav();
  dbRemember();
  buildNav();
  render();
  window.scrollTo({top:0,behavior:"instant"});
}
