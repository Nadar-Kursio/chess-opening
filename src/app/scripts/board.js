/* ---------------- board ---------------- */
/* Pure HTML/CSS: an 8x8 grid of divs inside a square wrapper.
   Rows and columns are both 1fr of a definite-height square box, so every
   square is mathematically equal. No SVG, no aspect-ratio, no container queries. */
function boardHTML(fen, from, to, checkSide, flipped){
  let out = "";
  const order = [];
  for(let i=0;i<64;i++) order.push(i);
  if(flipped) order.reverse();

  order.forEach((i, pos)=>{
    const file = i%8, rank = 7-((i/8)|0);
    const name = FILES[file] + (rank+1);
    const light = (file+rank)%2===1;
    const cls = ["sq", light ? "light" : "dark"];
    if(name===from || name===to) cls.push("played");
    const ch = fen[i];
    let piece = "";
    if(ch!=="."){
      const isWhite = ch===ch.toUpperCase();
      if(checkSide && ch.toLowerCase()==="k" && (isWhite?"w":"b")===checkSide) cls.push("in-check");
      piece = `<span class="piece ${isWhite?"white":"black"}${name===to?" arriving":""}">${PIECE_GLYPH[ch.toLowerCase()]}</span>`;
    }
    const col = pos%8, row = (pos/8)|0;
    // Labels always show the square's TRUE file/rank; flipping changes position, not identity.
    let coords = "";
    if(row===7) coords += `<span class="coord coord--file">${FILES[file]}</span>`;
    if(col===0) coords += `<span class="coord coord--rank">${rank+1}</span>`;
    out += `<div class="${cls.join(" ")}" data-sq="${name}">${coords}${piece}</div>`;
  });
  return `<div class="board" id="board">${out}</div>`;
}

/* The board, its transport and its display tools -- everything that belongs to
   the board column, in the order it is read: position, then where you are in the
   line, then how the board is shown.

   Shared by the opening view and the model-game view, which differ only in what
   they can offer: a game ships no arrows and has no drill to lock stepping. */
function boardColumnHTML(opts){
  const ply = opts.ply;
  const atStart = opts.index === 0;
  const atEnd = opts.index >= opts.total;
  const showArrows = state.arrows && opts.arrows && !drillHidesArrows();
  return `
    <div class="study__board">
      <div class="board-frame">
        <div class="board-square">${boardHTML(ply.fen, ply.from, ply.to,
          ply.check?(ply.turn==="w"?"b":"w"):null, state.flipped)}<canvas class="arrows" id="arrowlayer"></canvas></div>
      </div>

      <div class="transport">
        <button class="btn btn--icon" id="b-first" ${atStart?"disabled":""}
          aria-label="Back to the start" title="Start (Home)">&#8676;</button>
        <button class="btn btn--icon" id="b-prev" ${atStart?"disabled":""}
          aria-label="Back one move" title="Back (←)">&#8592;</button>
        <span class="transport__readout">${opts.readout}</span>
        <button class="btn btn--icon" id="b-next" ${atEnd||opts.locked?"disabled":""}
          aria-label="Forward one move" title="Forward (→)">&#8594;</button>
        <button class="btn btn--icon" id="b-last" ${atEnd||opts.locked?"disabled":""}
          aria-label="Jump to the end" title="End (End)">&#8677;</button>
      </div>

      <div class="board-tools">
        <button class="btn${state.autoplay?" on":""}" id="b-play" ${opts.canPlay?"":"disabled"}>
          <span class="glyph" aria-hidden="true">${state.autoplay?"■":"▶"}</span>${state.autoplay?"Stop":"Play"}</button>
        <button class="btn" id="b-flip"
          aria-label="Flip the board to put ${state.flipped?"White":"Black"} at the bottom"
          title="Flip the board to put ${state.flipped?"White":"Black"} at the bottom">
          <span class="glyph" aria-hidden="true">⇅</span>Flip</button>
        <button class="btn${state.arrows&&opts.arrows?" on":""}" id="b-arrows"
          aria-pressed="${!!(state.arrows&&opts.arrows)}"
          ${opts.arrows&&!drillHidesArrows()?"":"disabled"}
          title="${opts.arrows?"What the move attacks, defends and controls, drawn on the board"
                              :"This view draws no arrows"}">
          <span class="glyph" aria-hidden="true">↗</span>Arrows</button>
      </div>

      ${showArrows?`<div class="legend">
        <span><i class="move"></i>the move</span>
        <span><i class="attack"></i>attacks</span>
        <span><i class="check"></i>check</span>
        <span><i class="defend"></i>defends</span>
        <span><i class="control"></i>controls a key square</span>
      </div>`:""}

      ${opts.hint?`<p class="board-hint">${opts.hint}</p>`:""}
    </div>`;
}

/* Size the pieces to the actual rendered square, so they always fit at any board
   size. Runs after every render and on window resize -- pure JS, works in every
   browser. Every board on the page, not just the study board: a page may carry a
   second diagram alongside it. */
function sizePieces(){
  document.querySelectorAll(".board").forEach(b=>{
    const square = b.clientWidth / 8;
    if(square > 0){
      b.style.fontSize = (square * 0.74) + "px";
      b.querySelectorAll(".coord").forEach(c=>{ c.style.fontSize = Math.max(7, square*0.16) + "px"; });
    }
  });
}
window.addEventListener("resize", sizePieces);
