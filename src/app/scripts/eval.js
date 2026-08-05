/* ---------------- the engine's score ---------------- */
/* A bar under the board, on every position the course puts there: the line you
   are reading, the deviation you stepped into, the model game you are replaying.
   Not a mode you switch into -- a score you have to go and find is a score you
   check once and then stop checking, and the point of it is the habit.

   Nothing is computed here. `position-evals.py` searched every position this
   opening reaches with Stockfish at one depth, and the build hung the number off
   the ply. One depth everywhere matters more than a deeper number somewhere: two
   positions scored differently cannot be compared, and comparing them is the
   whole reason the bar is on screen for both. */

function evalOf(ply){
  return ply && ply.ev !== undefined ? ply : null;
}

/* Centipawns from White's point of view, which is what the engine reports and
   what every chess interface shows. Which side is winning is a fact about the
   position, not about who is reading it. */
function evalText(ply){
  if(ply.mate !== undefined) return (ply.mate > 0 ? "M" : "−M") + Math.abs(ply.mate);
  return (ply.ev > 0 ? "+" : ply.ev < 0 ? "−" : "") + Math.abs(ply.ev / 100).toFixed(2);
}

/* Where the bar sits. A linear centipawn scale pegs at the first won pawn and
   never moves again, so this is the usual logistic squash: the gap between +0.2
   and +0.8 is visible and the gap between +8 and +12 is not, which is the right
   way round for something read at a glance. */
function evalShare(ply){
  if(ply.mate !== undefined) return ply.mate > 0 ? 100 : 0;
  return 100 / (1 + Math.exp(-0.00368208 * Math.max(-1500, Math.min(1500, ply.ev))));
}

/* The number in words. A learner meeting "+0.42" for the first time cannot tell
   whether that is worth playing for, and a bar with no gloss teaches them
   nothing they did not already know. */
function evalWords(ply){
  if(ply.mate !== undefined){
    return `mate in ${Math.abs(ply.mate)} for ${ply.mate > 0 ? "White" : "Black"}`;
  }
  const cp = Math.abs(ply.ev), who = ply.ev >= 0 ? "White" : "Black";
  if(cp < 30) return "level";
  if(cp < 90) return `${who} a shade better`;
  if(cp < 250) return `${who} clearly better`;
  if(cp < 600) return `${who} winning`;
  return `${who} completely winning`;
}

/* A score as one comparable number, so a mate sorts above every centipawn eval
   rather than beside numbers it has no relation to. */
function evalScalar(ply){
  return ply.mate !== undefined ? Math.sign(ply.mate) * (10000 - Math.abs(ply.mate)) : ply.ev;
}

/* What the move between two positions did to the score, from the point of view
   of whoever played it. Negative means they gave something away.

   Derived rather than stored: it is the difference between two numbers already
   on the page, and a stored copy is how the three of them come to disagree. */
function evalSwing(before, after, mover){
  return Math.round((mover === "w" ? 1 : -1) * (evalScalar(after) - evalScalar(before)));
}

/* The bands the research skill calibrates authored severities on. An engine
   number and a written label disagreeing about what "blunder" means would turn
   both of them into noise. */
function evalSeverity(cost){
  return cost >= 300 ? "blunder" : cost >= 50 ? "inaccuracy" : "playable";
}

/* The position the move on screen was played from.

   A deviation's first move is the case worth having a function for: it was
   played from the line position it branched off, which is in a different array
   from the one being stepped through. */
function evalPrev(plies, at){
  if(at > 0) return plies[at - 1];
  if(state.deviation){
    const line = currentLine();
    return line && line.plies[state.deviation.fromPly];
  }
  return null;
}

function evalBarHTML(ply){
  const p = evalOf(ply);
  if(!p) return "";
  const share = evalShare(p), text = evalText(p), words = evalWords(p);
  return `
      <div class="evalbar" role="img"
        aria-label="Stockfish at depth ${ENGINE.depth} scores this ${text} — ${words}.">
        <span class="evalbar__label label">Stockfish</span>
        <span class="evalbar__track">
          <span class="evalbar__white" style="width:${share.toFixed(1)}%"></span>
        </span>
        <b class="evalbar__score">${text}</b>
      </div>`;
}

/* A move only earns a sentence when it moved the number. Across the Ruy Lopez,
   728 of 818 scored moves swing less than a fifth of a pawn and 27 swing half of
   one or more -- so a row that spoke every time would say "nothing happened"
   about eight hundred times, and a reader who has learnt to skip it is a reader
   who skips the twenty-seven that matter.

   The threshold is the `inaccuracy` floor, so the sentence appears exactly when
   the same bands would give the move a label. The bar under the board carries
   the score for every other move, which is the part that has to be constant. */
const EVAL_WORTH_SAYING = 50;

/* What the move just played was worth, in the row the generated "On the board"
   line already owns -- they answer the same question about the same move from
   two directions.

   Only where both positions are scored. Half a subtraction is not a swing, and
   an opening whose evals have not been generated must read as though this
   feature does not exist rather than as though it is broken. */
function evalMoveHTML(before, after){
  const a = evalOf(before), b = evalOf(after);
  if(!a || !b || !after.turn) return "";
  const swing = evalSwing(a, b, after.turn);
  if(Math.abs(swing) < EVAL_WORTH_SAYING) return "";
  const who = after.turn === "w" ? "White" : "Black";
  return `<div class="tactics evalmove evalmove--${swing < 0 ? evalSeverity(-swing) : "gain"}">
    <span class="label">Stockfish</span>
    <span>${after.san} ${swing < 0 ? "gives up" : "wins back"}
      <b>${Math.abs(swing / 100).toFixed(2)}</b> for ${who} &mdash; the score goes from
      <b>${evalText(a)}</b> to <b>${evalText(b)}</b>.</span>
  </div>`;
}
