/* ---------------- the primer, and the course's front page ---------------- */
/* Static prose, authored as HTML in primer.html and inlined into a <template>.
   The hero above it is the one place the course introduces itself -- every other
   view opens with its own name instead, which is what keeps the board near the
   top of a phone screen. */

/* Derived, never written down: the counts drifted badly once, claiming
   12/36/721 against a real 13/59/1359, and cannot drift again. */
function courseStats(){
  const lines = DATA.reduce((n,o)=>n+o.lines.length, 0);
  const moves = DATA.reduce((n,o)=>n+o.lines.reduce((m,l)=>m+l.plies.length-1, 0), 0);
  return [
    {n:DATA.length, word:"openings"},
    {n:lines, word:"annotated lines"},
    {n:moves, word:"explained moves"},
  ];
}

function heroHTML(){
  return `
  <header class="hero">
    <ul class="hero__stats">
      ${courseStats().map(s=>`<li class="hero__stat">
        <span class="hero__num">${s.n.toLocaleString("en")}</span>
        <span class="label">${s.word}</span></li>`).join("")}
    </ul>
    <h1 class="hero__title">The opening, <em>explained move by move</em></h1>
    <p class="hero__lede">Every move on this page comes with a reason. Step through a line,
      read why the move was played, then answer it back on the board — and when your opponent
      plays something else, the course answers <em>that</em> move too.</p>
  </header>`;
}

function primerHTML(){
  return heroHTML() + document.getElementById("primer").innerHTML;
}
