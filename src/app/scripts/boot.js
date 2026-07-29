/* ---------------- boot ---------------- */
/* The masthead counts are derived, not written down: they drifted badly once,
   claiming 12/36/721 against a real 13/59/1359, and cannot drift again. */
function mastheadText(){
  const lines = DATA.reduce((n,o)=>n+o.lines.length, 0);
  const moves = DATA.reduce((n,o)=>n+o.lines.reduce((m,l)=>m+l.plies.length-1, 0), 0);
  const count = (n,word)=>`${n.toLocaleString("en")} ${word}${n===1?"":"s"}`;
  return ["Interactive course",
          count(DATA.length,"opening"),
          count(lines,"annotated line"),
          count(moves,"move")].join(" · ");
}

document.getElementById("eyebrow").textContent = mastheadText();
dbRestore();
buildChrome();
buildRail();
render();
