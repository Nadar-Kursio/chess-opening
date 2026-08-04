/* ---------------- data and state ---------------- */
const DATA = __DATA__;

const SECTIONS = __SECTIONS__;
const STRUCTURES = __STRUCTURES__;
const GAMES = __GAMES__;

const PIECE_GLYPH = {k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"};
const FILES = "abcdefgh";

const state = {
  view:"primer",   // "primer" | "op" | "progress" | "structure" | "game"
  opId:null, line:0, ply:0,
  flipped:false,
  autoplay:null,   // setInterval handle while a line is playing itself
  arrows:true,

  mode:"read",     // "read" | "drill"
  selected:null,   // square the learner has picked up, e.g. "f1"
  drag:null,       // {from, id} while a pointer drag is live
  picking:false,   // the deviation picker is open
  navOpen:false,   // the drawer, on a narrow screen
  navQuery:"",     // what is typed into the nav's filter

  /* Stepping through a deviation. The ONLY second cursor: state.ply keeps
     meaning what it has always meant and is not touched while this is set, so
     leaving a deviation is `state.deviation = null` and you are exactly where
     you were. Indices, not a resolved array, so it cannot go stale. */
  deviation:null,  // {fromPly, idx, at, origin}

  structId:null,   // view === "structure"
  gameId:null,     // view === "game"; a game reuses state.ply, so the transport works unchanged

  /* Session-only, except `bothSides`, which is a preference and is restored from
     the store. `rejected` is the last refused attempt, kept so the board can show
     what was tried -- the move was never played, so nothing else records it. */
  drill:{phase:"ask", hint:0, tries:0, seen:{}, streak:0, cursor:"e4",
         verdict:"", tone:"", verdictPly:0, bothSides:false, rejected:null}
};

/* Handlers for every control that declares data-act, dispatched by the one
   delegated listener render.js installs on #content. Declared here, with the
   other shared names, because the scripts share a single scope: a file
   concatenated before render.js could not otherwise register into it. */
const ACTIONS = {};

/* Every read of the position on screen goes through these three, so a second
   sequence -- a deviation being stepped through, a model game -- plugs in here
   without any of their callers learning about it. */
function currentPlies(){
  if(state.deviation) return devPlies();
  if(state.view==="game"){
    const g = GAMES.find(x=>x.id===state.gameId);
    return g ? g.plies : [];
  }
  const line = currentLine();
  return line ? line.plies : [];
}
function currentIndex(){ return state.deviation ? state.deviation.at : state.ply; }
function currentPly(){ const plies = currentPlies(); return plies[currentIndex()] || plies[0]; }

function currentOpening(){ return DATA.find(o=>o.id===state.opId) || null; }
function currentLine(){ const op = currentOpening(); return op ? op.lines[state.line] : null; }

/* Interpolating content into a template string is how every view here is built,
   so the one place a stray < could break the page gets a helper rather than a
   rule nobody remembers. */
function esc(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
