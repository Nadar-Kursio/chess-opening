/* ---------------- the course nav ---------------- */
/* One nav, built once, presented two ways: a rail beside the content on a wide
   screen, the same markup sliding in over it on a narrow one. Deliberately not a
   second, cut-down nav for phones -- anything built here has to reach both, and
   a <select> cannot hold a filter, a badge or a heading that says anything.

   Nothing in it is hidden behind a setting: the whole catalogue is listed, and
   the filter narrows it by name when the list is longer than the screen. */

function navItemHTML(id, label, meta, current, extra){
  return `<button class="nav__item" data-go="${id}" data-name="${esc(label)}"
    ${current?'aria-current="page"':""}${extra && extra.title?` title="${esc(extra.title)}"`:""}>
    <span class="nav__row">${label}${extra && extra.tag ? extra.tag : ""}</span>
    ${meta?`<span class="nav__meta">${meta}</span>`:""}
  </button>`;
}

/* A family's name, and under it the move order that defines it -- which is what
   identifies a family in the literature, and more use than a piece glyph. */
function navGroupHTML(name, sub, body){
  return `<div class="nav__group">
    <div class="nav__head">
      <span class="label">${name}</span>
      ${sub?`<span class="nav__moves">${sub}</span>`:""}
    </div>
    ${body}
  </div>`;
}

function buildNav(){
  let html = `
    <button class="nav__close" data-nav="close">Close<span aria-hidden="true">✕</span></button>
    <div class="nav__tools">
      <input class="field" id="navfilter" type="search" autocomplete="off"
        placeholder="Filter the course…" aria-label="Filter the course"
        value="${esc(state.navQuery)}">
    </div>`;

  html += navGroupHTML("Start here", "",
      navItemHTML("primer", "How openings work", "Principles &middot; glossary", state.view==="primer")
    + navItemHTML("progress", "Your progress", "Scores &middot; export", state.view==="progress"));

  SECTIONS.forEach(sec=>{
    const body = DATA.filter(o=>o.section===sec.id).map(o=>{
      // The badge marks an opening that cannot yet answer a wrong move. Once
      // every opening is Coached it says the same thing thirteen times, which is
      // no longer information -- so it only shows when it means something.
      const lv = openingFeedbackLevel(o);
      const tag = lv < 2
        ? `<b class="nav__feedback nav__feedback--${lv}">${FEEDBACK_LEVELS[lv].tag}</b>` : "";
      return navItemHTML(o.id, o.name, o.eco, state.view==="op" && state.opId===o.id,
                         {tag, title:openingFeedbackTitle(o)});
    }).join("");
    if(body) html += navGroupHTML(sec.group, sec.label, body);
  });

  // Both groups vanish entirely when their data is empty, so the nav is
  // unchanged until an opening actually ships structures or games.
  if(STRUCTURES.length){
    html += navGroupHTML("Pawn structures", "shared between openings", STRUCTURES.map(s=>
      navItemHTML("structure:"+s.id, s.name, "",
                  state.view==="structure" && state.structId===s.id)).join(""));
  }
  if(GAMES.length){
    html += navGroupHTML("Model games", "annotated in full", GAMES.map(g=>
      navItemHTML("game:"+g.id, g.name, "",
                  state.view==="game" && state.gameId===g.id)).join(""));
  }

  const nav = document.getElementById("nav");
  nav.innerHTML = html;
  nav.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
  nav.querySelector('[data-nav="close"]').onclick = closeNav;

  const filter = document.getElementById("navfilter");
  filter.oninput = ()=>{ state.navQuery = filter.value; applyNavFilter(); };
  applyNavFilter();
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
  // A family with nothing left in it goes with its heading.
  nav.querySelectorAll(".nav__group").forEach(group=>{
    group.hidden = !group.querySelector("[data-go]:not([hidden])");
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
