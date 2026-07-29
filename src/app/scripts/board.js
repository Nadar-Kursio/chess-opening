/* ---------------- board ---------------- */
/* Pure HTML/CSS: an 8x8 grid of divs inside a square wrapper.
   Rows and columns are both 1fr of a definite-height square box, so every
   square is mathematically equal. No SVG, no aspect-ratio, no container queries. */
function boardCells(fen, from, to, checkSide, flip){
  let out = "";
  const order = [];
  for(let i=0;i<64;i++) order.push(i);
  if(flip) order.reverse();

  order.forEach((i, pos)=>{
    const file = i%8, rank = 7-((i/8)|0);
    const name = FILES[file] + (rank+1);
    const light = (file+rank)%2===1;
    const cls = ["sq", light ? "l" : "d"];
    if(name===from || name===to) cls.push("hl");
    const ch = fen[i];
    let extra = "";
    if(ch!=="."){
      const isW = ch===ch.toUpperCase();
      if(checkSide && ch.toLowerCase()==="k" && (isW?"w":"b")===checkSide) cls.push("chk");
      extra = `<span class="pc ${isW?"wp":"bp"}${name===to?" moved":""}">${GLYPH[ch.toLowerCase()]}</span>`;
    }
    const col = pos%8, row = (pos/8)|0;
    // Labels always show the square's TRUE file/rank; flipping changes position, not identity.
    let co = "";
    if(row===7) co += `<span class="coord f">${FILES[file]}</span>`;
    if(col===0) co += `<span class="coord r">${rank+1}</span>`;
    out += `<div class="${cls.join(" ")}" data-sq="${name}">${co}${extra}</div>`;
  });
  return `<div class="board" id="board">${out}</div>`;
}

/* Size the pieces to the actual rendered square, so they always fit at any board size.
   Runs after every render and on window resize -- pure JS, works in every browser.
   Every board on the page, not just the study board: a page may carry a second
   diagram alongside it. */
function sizeBoard(){
  document.querySelectorAll(".board").forEach(b=>{
    const sq = b.clientWidth / 8;
    if(sq > 0){
      b.style.fontSize = (sq * 0.74) + "px";
      b.querySelectorAll(".coord").forEach(c=>{ c.style.fontSize = Math.max(7, sq*0.16) + "px"; });
    }
  });
}
window.addEventListener("resize", sizeBoard);
