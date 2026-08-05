/* ---------------- your progress ---------------- */
/* Everything here is local to this browser, which is the first thing the page
   says rather than something you find out by losing it. */

function progressHTML(){
  const rows = Object.keys(db.lines).sort().map(key=>{
    const [opId, li] = key.split("/");
    const op = DATA.find(o=>o.id===opId);
    if(!op || !op.lines[li]) return "";     // catalogue moved under an old record
    const r = db.lines[key];
    const pct = r.asked ? Math.round(100 * r.right / r.asked) : 0;
    return `<li>
      <span class="drilled__name">${op.name} <em>${op.lines[li].name}</em></span>
      <span class="drilled__score">${r.right}/${r.asked} first try &middot; ${pct}%</span>
      <button class="btn" data-act="openline" data-op="${opId}" data-line="${li}">Open</button>
    </li>`;
  }).join("");

  return pageHeadHTML(["Start here", "Your progress"], "Your progress",
                      "What you have drilled, and how it went.") + `

  <div class="progress">
    ${dbOK?"":`<p class="notice">This browser isn't saving progress — the page was
      opened from a file and storage is blocked. Your session still counts; use Export
      below to keep it.</p>`}
    ${dbFrozen?`<p class="notice">This progress was written by a newer version of the
      course, so it is being read but not overwritten.</p>`:""}

    <div class="card">
      <p class="card__head label label--accent">Lines drilled</p>
      ${rows ? `<ul class="drilled">${rows}</ul>` : `<p>Nothing yet. Open any opening and
        switch the study panel to Drill.</p>`}
    </div>

    <div class="card">
      <p class="card__head label label--accent">Notes you have written</p>
      <p>${noteCount()
        ? `${noteCount()} position${noteCount()===1?"":"s"} annotated in this browser.
           They ride along with the export below — and a note worth keeping belongs
           in <span class="mono">src/content/notes/</span>, which is what the button writes.`
        : `None yet. Open any opening, right-drag on the board or press
           <b>Write a note on this position</b>, and it is saved here.`}</p>
      <div class="transfer">
        <button class="btn" data-act="notesource" ${noteCount()?"":"disabled"}>Copy as a notes file</button>
      </div>
    </div>

    <div class="card">
      <p class="card__head label label--accent">Keep or move your progress</p>
      <p>Progress lives in this browser only. Export it to keep a copy, or to carry it
        to another machine.</p>
      <div class="transfer">
        <button class="btn" data-act="export">Export</button>
        <button class="btn" data-act="import">Import</button>
        <button class="btn" data-act="reset">Reset…</button>
      </div>
      <textarea class="transfer__box" id="transferbox" spellcheck="false"
        placeholder="Exported progress appears here. Paste a previous export and press Import."></textarea>
      <p class="transfer__msg" id="transfermsg"></p>
    </div>
  </div>`;
}

ACTIONS.openline = t=>{
  state.view = "op"; state.opId = t.dataset.op;
  const op = currentOpening();
  state.line = Math.min(+t.dataset.line, op.lines.length-1);
  state.ply = 0;
  state.flipped = currentSide() === "black";
  buildNav(); render(); window.scrollTo({top:0,behavior:"instant"});
};
ACTIONS.notesource = ()=>{
  document.getElementById("transferbox").value = noteSourceText();
  document.getElementById("transfermsg").textContent =
    "In the box below, in the format src/content/notes/ reads. One file per opening.";
};
ACTIONS.export = ()=>{
  document.getElementById("transferbox").value = dbExport();
  document.getElementById("transfermsg").textContent = "Copied into the box below — select it all and copy.";
};
ACTIONS.import = ()=>{
  const err = dbImport(document.getElementById("transferbox").value);
  const msg = document.getElementById("transfermsg");
  if(err){ msg.textContent = err; return; }
  // The import replaced the whole store, theme included.
  themeSet(themeResolve(db.ui.theme));
  syncAppbar();
  msg.textContent = "Imported.";
  announce("Progress imported.");
};
ACTIONS.reset = t=>{
  // Two-step rather than a confirm() dialog, which some embedded viewers suppress.
  if(t.dataset.armed !== "1"){
    t.dataset.armed = "1";
    t.textContent = "Really reset?";
    return;
  }
  dbReset();
  // A reset drops the stored choice, so the page goes back to following the
  // system rather than sitting on a theme nothing records any more.
  themeSet(themeResolve(db.ui.theme));
  syncAppbar();
  render();
  announce("Progress reset.");
};
