/* ---------------- persistence ---------------- */
/* One key -- DB_KEY, declared by theme.js, which has to read this payload from
   <head> long before this file runs -- with the version inside the payload
   rather than in the key name, so a migration can read what the old build wrote
   instead of orphaning it.

   Storage may simply not exist: opening the built file from a file:// URL throws
   in some browsers on the localStorage PROPERTY, not just on write, so the probe
   has to wrap the access itself. When it fails everything below still works --
   it just lives for the session, and the progress view says so. */
const DB_VERSION = 1;

let dbMem = null;      // session-lifetime fallback when storage is unavailable
let dbFrozen = false;  // payload came from a newer build: read it, never overwrite
let dbTimer = null;

const dbOK = (function(){
  try{
    window.localStorage.setItem("__probe", "1");
    window.localStorage.removeItem("__probe");
    return true;
  }catch(e){ return false; }
})();

function dbDefaults(){
  return {
    v: DB_VERSION,
    ui: {arrows:true, mine:true},
    last: {view:"primer", opId:null, line:0, ply:0},
    streak: {cur:0, best:0, day:""},
    lines: {},
    // Keyed by position, like the notes files the build reads, so a note follows
    // a transposition instead of belonging to one line of one opening.
    notes: {}
  };
}

function dbMigrate(saved){
  const out = dbDefaults();
  if(!saved || typeof saved !== "object") return out;
  if((saved.v|0) > DB_VERSION) dbFrozen = true;
  ["ui","last","streak"].forEach(k=>{
    if(saved[k] && typeof saved[k]==="object") Object.assign(out[k], saved[k]);
  });
  if(saved.lines && typeof saved.lines==="object") out.lines = saved.lines;
  if(saved.notes && typeof saved.notes==="object") out.notes = saved.notes;
  out.v = DB_VERSION;
  return out;
}

const db = (function(){
  let raw = null;
  try{ raw = dbOK ? window.localStorage.getItem(DB_KEY) : null; }catch(e){}
  if(!raw) return dbDefaults();
  try{ return dbMigrate(JSON.parse(raw)); }catch(e){ return dbDefaults(); }
})();

/* Debounced: stepping through a line with the arrow keys would otherwise write
   on every keypress. Flushed hard on the two events that mean "the page may be
   about to go away". */
function dbSave(){
  if(dbFrozen) return;
  if(dbTimer) clearTimeout(dbTimer);
  dbTimer = setTimeout(dbFlush, 400);
}
function dbFlush(){
  if(dbTimer){ clearTimeout(dbTimer); dbTimer = null; }
  if(dbFrozen) return;
  const raw = JSON.stringify(db);
  if(dbOK){ try{ window.localStorage.setItem(DB_KEY, raw); }catch(e){ dbMem = raw; } }
  else dbMem = raw;
}
window.addEventListener("visibilitychange", ()=>{ if(document.hidden) dbFlush(); });
window.addEventListener("pagehide", dbFlush);

function dbRemember(){
  db.last = {view:state.view, opId:state.opId, line:state.line, ply:state.ply};
  db.ui.arrows = state.arrows;
  db.ui.mine = state.mine;
  dbSave();
}

/* Written only when the learner picks a theme, which is why dbDefaults() has no
   theme in it. Absent means "follow the system", and a default written here
   would quietly end that the first time anything else was saved. The live value
   is the attribute on <html>, not a field here: theme.js already set it. */
function dbTheme(name){
  db.ui.theme = name;
  dbSave();
}

/* Restoring is the one place a stored value reaches straight into an array
   index, so every field is clamped against the catalogue as it exists NOW --
   an opening that was removed, or a line that got shorter, must not throw. */
function dbRestore(){
  const ui = db.ui || {};
  if(typeof ui.arrows === "boolean") state.arrows = ui.arrows;
  if(typeof ui.mine === "boolean") state.mine = ui.mine;
  if(typeof ui.bothSides === "boolean") state.drill.bothSides = ui.bothSides;

  const last = db.last || {};
  const op = DATA.find(o=>o.id===last.opId);
  if(last.view !== "op" || !op) return;
  state.view = "op";
  state.opId = op.id;
  state.line = Math.min(Math.max(0, last.line|0), op.lines.length - 1);
  state.ply  = Math.min(Math.max(0, last.ply|0), op.lines[state.line].plies.length - 1);
  state.flipped = op.orientation === "black";
}

function dbLineKey(opId, line){ return opId + "/" + line; }
function dbProgress(opId, line){ return db.lines[dbLineKey(opId, line)] || null; }

function dbExport(){ return JSON.stringify(db, null, 2); }

function dbImport(text){
  let parsed;
  try{ parsed = JSON.parse(text); }
  catch(e){ return "That is not valid JSON."; }
  if(!parsed || typeof parsed !== "object") return "That file does not look like a progress export.";
  const fresh = dbMigrate(parsed);
  dbFrozen = false;
  Object.keys(db).forEach(k=>{ delete db[k]; });
  Object.assign(db, fresh);
  dbFlush();
  return null;
}

function dbReset(){
  Object.keys(db).forEach(k=>{ delete db[k]; });
  Object.assign(db, dbDefaults());
  dbFrozen = false;
  dbFlush();
}
