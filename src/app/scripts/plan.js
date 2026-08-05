/* ---------------- the end of a line ---------------- */
/* "I reached the end of my preparation and had no idea what to do" is the second
   most common complaint about opening study, and the course used to end a line
   with nothing but the last move. Every line now finishes with a card.

   Two versions. `planCardHTML` is what an author wrote; `planEndHTML` is derived
   from data every opening already has, so a line with no authored plan still
   ends with something useful rather than silence. */

function planStructure(id){ return STRUCTURES.find(s=>s.id===id) || null; }

function planCardHTML(op, line){
  const plan = line.plan;
  const st = plan.structure ? planStructure(plan.structure) : null;
  return `
      <div class="plan">
        <p class="label label--accent">You're on your own from here</p>
        <p class="plan__point">${plan.point}</p>
        ${st?`<button class="structure-link" data-act="structure" data-id="${st.id}">
          <span class="label">The structure you reached</span>
          <span class="structure-link__name">${st.name}</span>
        </button>`:""}
        ${plan.next && plan.next.length?`
        <p class="label plan__sub">What usually happens next</p>
        <ul class="plan__next">${plan.next.map(x=>`<li>${x}</li>`).join("")}</ul>`:""}
        ${plan.endgame?`<p class="plan__endgame"><b>If it simplifies.</b> ${plan.endgame}</p>`:""}
      </div>`;
}

/* No authoring at all: the plans are the ones the opening already states, and
   naming them here is the difference between a line that stops and a line that
   hands over. */
function planEndHTML(op, line){
  const mine = lineSide(op, line) === "black" ? op.theory.black_plans : op.theory.white_plans;
  return `
      <div class="plan plan--generic">
        <p class="label">You're on your own from here</p>
        <p class="plan__point">${line.name} ends here. There is no move ${
          Math.ceil(line.plies.length/2)+1} written down &mdash; from this position you are
          playing on the ideas, not the moves.</p>
        <p class="label plan__sub">What you are trying to do in this opening</p>
        <ul class="plan__next">${mine.slice(0,3).map(x=>`<li>${x}</li>`).join("")}</ul>
        <p class="plan__endgame"><b>The structure.</b> ${op.theory.structure}</p>
      </div>`;
}

function planFor(op, line){
  return line.plan ? planCardHTML(op, line) : planEndHTML(op, line);
}

function planHTML(op, line){
  if(state.deviation || state.mode === "drill") return "";
  if(currentIndex() < currentPlies().length - 1) return "";
  return planFor(op, line);
}

ACTIONS.structure = t=>{
  state.view = "structure";
  state.structId = t.dataset.id;
  state.deviation = null; state.picking = false;
  buildNav(); render();
  window.scrollTo({top:0,behavior:"instant"});
};
