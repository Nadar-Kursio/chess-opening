/* ---------------- data and state ---------------- */
const DATA = __DATA__;

const SECTIONS = __SECTIONS__;
const STRUCTURES = __STRUCTURES__;
const GAMES = __GAMES__;
const TREES = __EXPLORE__;

const PIECE_GLYPH = {k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"};
const FILES = "abcdefgh";

const state = {
  view:"primer",   // "primer" | "op" | "progress" | "structure" | "game"
  opId:null, line:0, ply:0,
  flipped:false,
  autoplay:null,   // setInterval handle while a line is playing itself
  arrows:true,     // the engine's arrows for the move just played
  mine:true,       // the marks written beside your own notes -- a separate
                   // switch, so you can look at your idea without the other five

  mode:"read",     // "read" | "drill" | "explore"
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

  /* Explore mode's board, as a line of its own: `steps` is ply-shaped, so the
     board, the transport and the scoresheet render it with no code of their
     own, and `at` is the cursor into it. Session-only -- an engine tree is
     reference material and a walk through it is not progress. */
  explore:null,    // {steps:[ply…], at, from}
  exploreAll:false,// the reply list showing every legal move rather than the top six

  structId:null,   // view === "structure"
  gameId:null,     // view === "game"; a game reuses state.ply, so the transport works unchanged

  /* Writing your own note on the position on screen. `note` is the open editor,
     holding a working copy so Cancel costs nothing; `drawing` is a live drag on
     the board. Both are session-only -- what is kept lives in db.notes. */
  note:null,       // {key, text, arrows, spots, tool, from, focus}
  drawing:null,    // {from, to, id} while a mark is being dragged out

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
  if(state.explore) return state.explore.steps;
  if(state.deviation) return devPlies();
  if(state.view==="game"){
    const g = GAMES.find(x=>x.id===state.gameId);
    return g ? g.plies : [];
  }
  const line = currentLine();
  return line ? line.plies : [];
}
function currentIndex(){
  if(state.explore) return state.explore.at;
  return state.deviation ? state.deviation.at : state.ply;
}
function currentPly(){ const plies = currentPlies(); return plies[currentIndex()] || plies[0]; }

/* The write half of currentIndex. Three cursors now answer to the transport, the
   move list and the arrow keys, and each of those knowing which one is live is
   three copies of the same conditional going stale at different rates. */
function setIndex(n){
  if(state.explore) state.explore.at = n;
  else if(state.deviation) state.deviation.at = n;
  else state.ply = n;
}

function currentOpening(){ return DATA.find(o=>o.id===state.opId) || null; }
function currentLine(){ const op = currentOpening(); return op ? op.lines[state.line] : null; }

/* Interpolating content into a template string is how every view here is built,
   so the one place a stray < could break the page gets a helper rather than a
   rule nobody remembers. */
function esc(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
