/* ---------------- the app bar ---------------- */
/* Lives outside #content so render() never redraws it, and so it survives on
   narrow screens where the nav is a drawer.

   It carries what is true everywhere: where you are, how you are doing, and how
   the page looks. What you are being TAUGHT is chosen in the nav, next to the
   list it filters. */

/* The one-line answer to "what am I looking at", shown beside the wordmark and
   used as the drawer's heading on a phone. */
function whereAmI(){
  switch(state.view){
    case "primer":   return "How openings work";
    case "progress": return "Your progress";
    case "structure": {
      const s = STRUCTURES.find(x=>x.id===state.structId);
      return s ? s.name : "Pawn structure";
    }
    case "game": {
      const g = GAMES.find(x=>x.id===state.gameId);
      return g ? g.name : "Model game";
    }
    default: {
      const op = currentOpening();
      return op ? op.name : "The course";
    }
  }
}

function buildAppbar(){
  document.getElementById("appbar-actions").innerHTML = `
    <button class="pill" id="progresschip"></button>
    <button class="pill" id="themetoggle"></button>`;

  document.getElementById("progresschip").onclick = ()=>go("progress");

  // Nothing to re-render: the themes differ only in the custom properties the
  // stylesheet already reads, so setting the attribute repaints the whole page.
  document.getElementById("themetoggle").onclick = ()=>{
    const next = themeName() === "light" ? "dark" : "light";
    themeSet(next);
    dbTheme(next);
    syncAppbar();
    announce(`${next === "light" ? "Light" : "Dark"} theme.`);
  };

  document.getElementById("brand").onclick = e=>{ e.preventDefault(); go("primer"); };
  syncAppbar();
}

function syncAppbar(){
  const where = document.getElementById("appbar-where");
  if(where) where.textContent = whereAmI();

  const chip = document.getElementById("progresschip");
  if(chip){
    chip.innerHTML = progressChipHTML();
    chip.setAttribute("aria-label", "Your progress");
  }

  // The button names the theme it switches TO, so its label and its accessible
  // name say the same thing and neither has to be read as a state.
  const toggle = document.getElementById("themetoggle");
  if(toggle){
    const to = themeName() === "light" ? "dark" : "light";
    // Until a choice is stored the page is following the system, and only the
    // tooltip can say so -- the label has to keep naming the destination.
    const how = (db.ui || {}).theme ? "" : ", which is currently following your system";
    toggle.innerHTML = `<span class="glyph" aria-hidden="true">${to === "light" ? "☀" : "☾"}</span>${to}`;
    toggle.setAttribute("aria-label", `Switch to the ${to} theme`);
    toggle.title = `Switch to the ${to} theme${how}`;
  }
}

function drilledCount(){ return Object.keys(db.lines).length; }

function progressChipHTML(){
  const n = drilledCount();
  if(!n) return `Progress`;
  return `<b>${n}</b> drilled` +
         (db.streak.best ? ` <span class="sep">·</span> best <b>${db.streak.best}</b>` : "");
}

/* Announce to assistive tech. Also the single place that guarantees every piece
   of feedback has a non-visual form -- reduced-motion users lose the animations,
   never the message. */
function announce(msg){
  const el = document.getElementById("announce");
  if(!el) return;
  el.textContent = "";
  setTimeout(()=>{ el.textContent = msg; }, 30);
}
