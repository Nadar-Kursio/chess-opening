/* ---------------- notes you write here ---------------- */
/* The second half of the personal-notes channel. `src/content/notes/` is the
   half that lives in the repo; this is the half you write while studying, and
   it is keyed exactly the same way -- by the POSITION on the board, not by the
   line you happened to be looking at. A note therefore follows a transposition
   into another opening and survives a line being renamed or reordered.

   A note written here shadows the file's note for the same position. Nothing in
   a browser can edit a file, so the shipped text is never lost: Delete drops
   your copy and the file's note comes straight back. */

function noteKey(p){ return p ? p.turn + p.fen : ""; }
function noteSaved(p){ return db.notes[noteKey(p)] || null; }
function noteShown(p){ return noteSaved(p) || (p && p.mine) || null; }
function noteIsLocal(p){ return !!noteSaved(p); }
function noteCount(){ return Object.keys(db.notes).length; }

/* The build escapes the file's prose, because a notes file is typed casually and
   a stray `<` should not be the author's problem. What you type here is stored
   raw and escaped at render, so this is the one place the two have to be told
   apart -- everything downstream works in plain text. */
function noteUnescape(s){
  return String(s).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"')
                  .replace(/&#x27;/g,"'").replace(/&amp;/g,"&");
}
function noteText(p){
  const n = noteShown(p);
  if(!n || !n.text) return "";
  return noteIsLocal(p) ? n.text : noteUnescape(n.text);
}

function noteMarkLabels(n){
  return (n.arrows||[]).map(a=>`${a.f}&rarr;${a.t}`)
    .concat((n.spots||[]).map(s=>`&#9675;${s}`));
}

/* ---- the editor ---- */

/* Opening without a render, because a right-drag opens the editor on the way
   past: render() refills #content, which would delete the square the pointer is
   captured on and abandon the drag before it drew anything. */
function noteBegin(){
  const p = currentPly();
  const from = noteShown(p) || {};
  state.note = {
    key: noteKey(p),
    text: noteText(p),
    arrows: (from.arrows||[]).map(a=>({f:a.f, t:a.t})),
    spots: (from.spots||[]).slice(),
    tool: null, from: null, focus: false,
  };
  // You cannot annotate what is hidden, so asking to write a note is also
  // asking to see the layer it goes on.
  state.mine = true;
}

function noteCancel(){ state.note = null; render(); }

/* The write, with no render in it, so the two callers that must not re-enter
   render() can still use it. Returns whether anything was kept. */
function noteStore(){
  const n = state.note;
  const text = n.text.trim();
  const keep = text || n.arrows.length || n.spots.length;
  if(keep){
    const rec = {};
    if(text) rec.text = text;
    if(n.arrows.length) rec.arrows = n.arrows;
    if(n.spots.length) rec.spots = n.spots;
    db.notes[n.key] = rec;
  }else{
    // An empty note is not a note. Saving one is how you delete it.
    delete db.notes[n.key];
  }
  dbFlush();
  return keep;
}

function noteSave(){
  if(!state.note) return;
  const keep = noteStore();
  state.note = null;
  render();
  announce(keep ? "Note saved." : "Note removed.");
}

/* The editor belongs to the position it was opened on, and its key is fixed at
   that moment -- otherwise stepping one move forward mid-sentence would file
   what you typed against a position you never looked at.

   Every way of leaving a position goes through render(): an arrow key, the move
   list, another variation, another opening, entering a deviation. So this runs
   there rather than at eight call sites, one of which would eventually be
   forgotten. What was typed is kept rather than dropped -- navigating away is
   not a decision to throw work out. */
function noteSyncPosition(){
  if(!state.note) return;
  if(state.view === "op" && state.note.key === noteKey(currentPly())) return;
  noteStore();
  state.note = null;
}

/* Drawing the same mark twice takes it away, which is the only undo a drag
   gesture can have that does not need a button. */
function noteAddArrow(from, to){
  const n = state.note;
  if(!n || from === to) return;
  const at = n.arrows.findIndex(a=>a.f===from && a.t===to);
  if(at >= 0) n.arrows.splice(at, 1); else n.arrows.push({f:from, t:to});
}
function noteToggleSpot(sq){
  const n = state.note;
  if(!n) return;
  const at = n.spots.indexOf(sq);
  if(at >= 0) n.spots.splice(at, 1); else n.spots.push(sq);
}

/* Make arrow / Circle square: the same two marks without a drag, for a finger on
   a phone and for anyone who would rather press a button than know a gesture. */
function noteTool(sq){
  const n = state.note;
  if(n.tool === "spot"){ noteToggleSpot(sq); n.tool = null; render(); return; }
  if(!n.from){ n.from = sq; render(); return; }
  const from = n.from;
  n.from = null; n.tool = null;
  noteAddArrow(from, sq);
  render();
}

/* ---- board input ---- */

/* Left-drag draws only while the editor is open, because on this board a
   left-drag already means "play this move" and that has to keep working.
   Right-drag draws at any time and opens the editor on its way -- the gesture
   anyone who has used a chess site already has in their fingers. */
function noteDrawGesture(e){
  if(state.view !== "op" || drillHidesArrows()) return false;
  if(e.button === 2) return true;
  return !!state.note && e.button === 0;
}

document.getElementById("content").addEventListener("pointerdown", e=>{
  if(!noteDrawGesture(e)) return;
  const cell = e.target.closest("[data-sq]");
  if(!cell) return;
  e.preventDefault();
  if(!state.note) noteBegin();
  const sq = cell.dataset.sq;
  if(state.note.tool){ noteTool(sq); return; }   // a two-tap tool never drags
  state.drawing = {from:sq, to:sq, id:e.pointerId};
  try{ cell.setPointerCapture(e.pointerId); }catch(err){}
  drawArrows();
});

/* Canvas only while the drag is live. render() would take the board out from
   under the pointer, and the rubber band is the whole reason to track a move. */
document.addEventListener("pointermove", e=>{
  const d = state.drawing;
  if(!d || d.id !== e.pointerId) return;
  const sq = noteSquareAt(e);
  if(sq && sq !== d.to){ d.to = sq; drawArrows(); }
});

document.addEventListener("pointerup", e=>{
  const d = state.drawing;
  if(!d || d.id !== e.pointerId) return;
  state.drawing = null;
  const to = noteSquareAt(e) || d.from;
  // A press that never left its square is a circle; one that travelled is an arrow.
  if(to === d.from) noteToggleSpot(d.from); else noteAddArrow(d.from, to);
  render();
});

/* A drag the browser takes away -- a phone call, a gesture the OS claims -- must
   not leave a rubber band on the board with nothing holding it. */
document.addEventListener("pointercancel", e=>{
  if(state.drawing && state.drawing.id === e.pointerId){
    state.drawing = null;
    drawArrows();
  }
});

function noteSquareAt(e){
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const cell = el && el.closest && el.closest("[data-sq]");
  return cell ? cell.dataset.sq : null;
}

document.getElementById("content").addEventListener("contextmenu", e=>{
  if(e.target.closest("[data-sq]")) e.preventDefault();
});

/* The textarea is left uncontrolled and read on input: re-rendering the card on
   every keystroke would replace the node being typed into and drop the caret. */
function noteArm(){
  const box = document.getElementById("notetext");
  if(!box || !state.note) return;
  box.oninput = ()=>{ state.note.text = box.value; };
  box.onkeydown = e=>{
    if(e.key === "Escape"){ e.preventDefault(); noteCancel(); return; }
    // A note is prose and wraps, so Enter has to stay Enter.
    if(e.key === "Enter" && (e.metaKey || e.ctrlKey)){ e.preventDefault(); noteSave(); }
  };
  if(state.note.focus){ state.note.focus = false; box.focus(); }
}

/* ---- rendering ---- */

function noteCardHTML(p){
  if(state.view !== "op" || !state.mine || drillHidesArrows()) return "";
  if(state.note) return noteEditorHTML(p);
  const n = noteShown(p);
  if(!n) return `
      <button class="mynote-add" data-act="noteedit">
        <span class="glyph" aria-hidden="true">✎</span>Write a note on this position</button>`;
  const marks = noteMarkLabels(n);
  return `
      <article class="mynote">
        <header class="mynote__head">
          <span class="label">My note</span>
          ${marks.length?`<span class="mynote__marks">${marks.join(" ")}</span>`:""}
          <span class="mynote__where">${noteIsLocal(p)?"saved in this browser":"from the notes file"}</span>
          <button class="mynote__edit" data-act="noteedit">Edit</button>
        </header>
        ${n.text?`<p class="mynote__body">${squaresHTML(esc(noteText(p)))}</p>`:""}
      </article>`;
}

function noteEditorHTML(p){
  const n = state.note;
  const marks = noteMarkLabels(n);
  return `
      <article class="mynote mynote--editing">
        <header class="mynote__head">
          <span class="label">My note</span>
          <span class="mynote__hint">${noteHint(n)}</span>
        </header>
        <textarea class="mynote__text" id="notetext" rows="3" spellcheck="true"
          placeholder="What this move does, in your words."
          aria-label="Your note on this position">${esc(n.text)}</textarea>
        ${marks.length?`<div class="mynote__marklist">
          ${marks.map((m,i)=>`<button class="mynote__mark" data-act="notemark" data-i="${i}"
            aria-label="Remove the mark ${m}">${m} &#10005;</button>`).join("")}
        </div>`:""}
        <div class="mynote__tools">
          <button class="btn${n.tool==="arrow"?" on":""}" aria-pressed="${n.tool==="arrow"}"
            data-act="notetool" data-v="arrow">Make arrow</button>
          <button class="btn${n.tool==="spot"?" on":""}" aria-pressed="${n.tool==="spot"}"
            data-act="notetool" data-v="spot">Circle square</button>
        </div>
        <div class="coach__actions">
          <button class="btn btn--primary" data-act="notesave">Save</button>
          <button class="btn" data-act="notecancel">Cancel</button>
          ${noteIsLocal(p)?`<button class="btn" data-act="notedelete">Delete</button>`:""}
        </div>
      </article>`;
}

function noteHint(n){
  if(n.from) return "Now tap the square it points at.";
  if(n.tool === "arrow") return "Tap the square the arrow starts from.";
  if(n.tool === "spot") return "Tap a square to circle it.";
  return "Drag on the board to draw an arrow, or tap a square to circle it.";
}

/* ---- moving a note into the repo ---- */

/* What you wrote here, in the format src/content/notes/ reads, so a note that
   has earned its keep can be moved into the repo and reviewed like anything
   else. Emitted per line, because the file format is a move order and a bare
   position has none.

   Twice deduplicated, and the two are different jobs. WITHIN an opening, a note
   is written once and skipped in every later line that passes through the same
   position -- the file would otherwise be rejected outright, since the build
   refuses two notes on one position. ACROSS openings it is deliberately
   repeated: a notes file is read per opening, so the Italian's copy is not one
   the Ruy Lopez can see. */
function noteSourceText(){
  const files = [];
  DATA.forEach(op=>{
    const written = {};
    const blocks = [];
    op.lines.forEach(line=>{
      const fresh = i=>{
        const p = line.plies[i];
        return i > 0 && noteSaved(p) && !written[noteKey(p)];
      };
      let last = 0;
      line.plies.forEach((p, i)=>{ if(fresh(i)) last = i; });
      if(!last) return;              // every note here is already in an earlier block
      const parts = [];
      for(let i = 1; i <= last; i++){
        const p = line.plies[i];
        if(p.turn === "w") parts.push(`${Math.ceil(i/2)}.`);
        parts.push(p.san);
        if(!fresh(i)) continue;
        written[noteKey(p)] = true;
        const n = noteSaved(p);
        // Brackets are the format's own punctuation, so text carrying one would
        // close the note early and swallow the rest of the block.
        if(n.text) parts.push(`(${n.text.replace(/[()\[\]]/g, "").replace(/\s+/g, " ").trim()})`);
        const marks = (n.arrows||[]).map(a=>`${a.f}-${a.t}`).concat((n.spots||[]).map(s=>`!${s}`));
        if(marks.length) parts.push(`[${marks.join(", ")}]`);
      }
      blocks.push(`${line.name}:\n   ${parts.join(" ")}`);
    });
    if(blocks.length) files.push(`# src/content/notes/${op.id}.txt\n\n${blocks.join("\n\n")}`);
  });
  return files.join("\n\n\n");
}

ACTIONS.noteedit   = ()=>{ noteBegin(); state.note.focus = true; render(); };
ACTIONS.notecancel = ()=>noteCancel();
ACTIONS.notesave   = ()=>noteSave();
ACTIONS.notedelete = ()=>{
  delete db.notes[state.note.key];
  state.note = null;
  dbFlush();
  render();
  announce("Your note here is gone.");
};
ACTIONS.notetool = t=>{
  const want = t.dataset.v;
  state.note.tool = state.note.tool === want ? null : want;
  state.note.from = null;
  render();
};
ACTIONS.notemark = t=>{
  const n = state.note, i = +t.dataset.i;
  if(i < n.arrows.length) n.arrows.splice(i, 1);
  else n.spots.splice(i - n.arrows.length, 1);
  render();
};
