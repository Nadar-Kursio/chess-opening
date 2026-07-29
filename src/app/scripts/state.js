const DATA = __DATA__;

const GLYPH = {k:"\u265A",q:"\u265B",r:"\u265C",b:"\u265D",n:"\u265E",p:"\u265F"};
const FILES = "abcdefgh";

const SECTIONS = __SECTIONS__;
const STRUCTURES = __STRUCTURES__;
const GAMES = __GAMES__;

/* The same four words the learning path already uses, in the order they build on
   each other. Content carries one; the selector shows everything up to it. */
const TIERS = ["Foundation", "Structure", "Plans", "Mastery"];

const state = {
  view:"primer", opId:null, line:0, ply:0, flip:false, timer:null,
  arrows:true, tier:"Mastery",

  mode:"read",   // "read" | "drill"
  sel:null,      // square the learner has picked up, e.g. "f1"
  drag:null,     // {from, id} while a pointer drag is live
  pick:false,    // the deviation picker is open

  /* Stepping through a deviation. The ONLY second cursor: state.ply keeps
     meaning what it has always meant and is not touched while this is set, so
     leaving a branch is `state.branch = null` and you are exactly where you
     were. Indices, not a resolved array, so it cannot go stale. */
  branch:null,   // {fromPly, idx, at, origin}

  structId:null, // view === "structure"
  gameId:null,   // view === "game"; a game reuses state.ply, so the transport works unchanged

  /* Session-only, except `both`, which is a preference and is restored from the
     store. `bad` is the last rejected attempt, kept so the board can show you
     what you just tried -- the move was never played, so nothing else records it. */
  drill:{phase:"ask", hint:0, tries:0, seen:{}, streak:0, cursor:"e4", msg:"", tone:"",
         both:false, bad:null}
};

/* Handlers for every control that declares data-act, dispatched by the one
   delegated listener render.js installs on #content. It is declared here, with
   the other shared names, because the scripts share a single scope: a file
   concatenated before render.js could not otherwise register into it. */
const ACTIONS = {};

/* Every read of the position on screen goes through these three. Today they only
   ever resolve the current line, but they are the seam a second sequence plugs
   into -- a deviation you are stepping through, a model game -- without any of
   their callers learning about it. */
function curSeq(){
  if(state.branch) return brSeq();
  if(state.view==="game"){
    const g = GAMES.find(x=>x.id===state.gameId);
    return g ? g.plies : [];
  }
  const op = DATA.find(o=>o.id===state.opId);
  const line = op && op.lines[state.line];
  return line ? line.plies : [];
}
function curIdx(){ return state.branch ? state.branch.at : state.ply; }
function curPly(){ const seq = curSeq(); return seq[curIdx()] || seq[0]; }
