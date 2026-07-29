// Render the built page in jsdom and open everything the new content added:
// every deviation panel, every plan card, every model game, every structure.
//
//   npm i jsdom            # once, anywhere on the box
//   node .claude/skills/opening-research/scripts/smoke.js [opening-id …]
//
// This exists because the build concatenates the scripts without parsing them:
// a data shape the renderer chokes on ships a dead page and the build still
// reports success. Exits non-zero on a console error, an empty panel, a tape
// that does not match its ply count, or a line that ends without a plan card.
//
// The page's scripts share one top-level scope, so their `const`s live in the
// global lexical environment -- reachable through window.eval, not as window
// properties. Everything below goes through ev() for that reason.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// The repo ships no package.json on purpose -- the page has to keep working from
// a file:// URL with no build step -- so jsdom is looked up globally rather than
// installed here.
function loadJsdom() {
  try {
    return require("jsdom");
  } catch {
    try {
      return require(path.join(execSync("npm root -g").toString().trim(), "jsdom"));
    } catch {
      console.error("jsdom is not installed. Run:  npm i -g jsdom");
      process.exit(2);
    }
  }
}
const { JSDOM, VirtualConsole } = loadJsdom();

const ROOT = execSync("git rev-parse --show-toplevel", { cwd: __dirname }).toString().trim();
const PAGE = path.join(ROOT, "docs", "chess-opening-course.html");
const only = process.argv.slice(2);

const errors = [];
const vc = new VirtualConsole();
// scrollTo is unimplemented in jsdom and the app calls it on every navigation.
vc.on("jsdomError", e => { if (!/scrollTo/.test(e.message)) errors.push("jsdomError: " + e.message); });
vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));
vc.on("warn", (...a) => errors.push("console.warn: " + a.join(" ")));

const dom = new JSDOM(fs.readFileSync(PAGE, "utf8"),
                      { runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc });
const ev = src => dom.window.eval(src);

// Wait for the page's own boot rather than guessing at a delay -- a fixed
// timeout turns a slow box into a ReferenceError stack trace instead of a report.
function whenReady(run, tries = 200) {
  let ready = false;
  try { ready = ev("typeof DATA !== 'undefined' && document.getElementById('rail') !== null"); } catch { /* still booting */ }
  if (ready) return run();
  if (!tries) { console.error("page never finished booting"); process.exit(2); }
  setTimeout(() => whenReady(run, tries - 1), 25);
}

whenReady(() => {
  const report = [];
  const must = (name, cond, extra) =>
    report.push(`${cond ? "ok  " : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

  const ids = only.length ? only : ev("DATA.map(o=>o.id)");
  must("page loaded", ev("DATA.length") > 0, `${ev("DATA.length")} openings, ` +
       `${ev("GAMES.length")} games, ${ev("STRUCTURES.length")} structures`);

  for (const id of ids) {
    if (!ev(`DATA.some(o=>o.id==="${id}")`)) { must(id, false, "no such opening"); continue; }
    const devs = ev(`(DATA.find(o=>o.id==="${id}").branchsets||[]).reduce((n,s)=>n+s.length,0)`);
    const sets = ev(`(DATA.find(o=>o.id==="${id}").branchsets||[]).length`);
    const level = ev(`DX_LEVELS[opLevel(DATA.find(o=>o.id==="${id}"))].tag`);

    ev(`go("${id}")`);
    const nlines = ev(`DATA.find(o=>o.id==="${id}").lines.length`);
    let panels = 0, cards = 0;
    for (let i = 0; i < nlines; i++) {
      const nplies = ev(`DATA.find(o=>o.id==="${id}").lines[${i}].plies.length`);
      for (let ply = 0; ply < nplies; ply++) {
        ev(`state.line=${i}; state.ply=${ply}; render();`);
        for (let idx = 0, n = ev(`brAt(${ply}).length`); idx < n; idx++) {
          ev(`brEnter(${ply}, ${idx}, "read")`);
          const why = ev(`(document.querySelector(".branch .brwhy")||{}).textContent||""`);
          const tape = ev(`document.querySelectorAll(".brtape .mv").length`);
          const plies = ev(`brCur().plies.length`);
          const where = `${id} line ${i} ply ${ply} branch ${ev(`brCur().san`)}`;
          if (!why.trim()) errors.push(`${where}: empty explanation`);
          // A one-move branch renders no tape by design; anything longer must
          // render every ply of it.
          if (plies > 1 && tape !== plies) errors.push(`${where}: tape shows ${tape} of ${plies} plies`);
          panels++;
          ev(`brExit()`);
        }
      }
      // Every line ends with a card; only an authored `plan` renders the
      // non-generic one, so assert on that or the check passes for free.
      ev(`state.ply=${nplies - 1}; render();`);
      const authored = ev(`DATA.find(o=>o.id==="${id}").lines[${i}].plan !== undefined`);
      const rendered = ev(`document.querySelector(".plan:not(.generic) .planpoint")!==null`);
      if (authored && !rendered) errors.push(`${id} line ${i}: authored plan did not render`);
      if (rendered) cards++;

      // The drill is the reason `drill: True` ships a legal-move list per ply;
      // nothing else in the page reads it, so nothing else would catch a line
      // whose blob is missing or out of step with its position.
      if (ev(`DATA.find(o=>o.id==="${id}").lines[${i}].plies.some(p=>p.legal)`)) {
        ev(`state.line=${i}; dxSetMode("drill"); dxStart();`);
        if (!ev(`document.querySelector(".dxask, .dxbar")!==null`))
          errors.push(`${id} line ${i}: drill mode rendered no drill panel`);
        // mvIsLegal takes the ply RECORD, not its index -- the position's own
        // `legal` blob is what it reads.
        const [from, to] = JSON.parse(ev(`JSON.stringify([dxAnswer().from, dxAnswer().to])`));
        if (!ev(`mvIsLegal(curSeq()[state.ply], "${from}", "${to}")`))
          errors.push(`${id} line ${i}: the line's own next move reads as illegal in the drill`);
        if (ev(`mvIsLegal(curSeq()[state.ply], "a1", "a8")`))
          errors.push(`${id} line ${i}: the legal-move list accepts an impossible move`);
        ev(`dxSetMode("read")`);
      }
    }
    must(id, true, `${level}, ${sets} branch positions / ${devs} deviations, ` +
         `${panels} panels opened, ${cards}/${nlines} authored plan cards`);
  }

  for (const gid of ev("GAMES.map(g=>g.id)")) {
    ev(`go("game:${gid}")`);
    const n = ev(`GAMES.find(g=>g.id==="${gid}").plies.length`);
    for (let ply = 0; ply < n; ply++) ev(`state.ply=${ply}; render();`);
    must(`game ${gid}`, ev(`document.querySelector(".study")!==null`), `${n - 1} plies replayed`);
  }

  for (const sid of ev("STRUCTURES.map(s=>s.id)")) {
    ev(`go("structure:${sid}"); render();`);
    const reached = ev(`(STRUCTURES.find(s=>s.id==="${sid}").openings||[]).map(o=>o.id+" / "+o.line).join("; ")`);
    must(`structure ${sid}`,
         ev(`document.body.innerHTML.indexOf(STRUCTURES.find(s=>s.id==="${sid}").name)>-1`),
         reached || "reference only — no plan card points here yet");
  }

  console.log(report.join("\n"));
  console.log(errors.length ? "\nERRORS:\n" + errors.join("\n") : "\nno console errors");
  process.exit(errors.length || report.some(r => r.startsWith("FAIL")) ? 1 : 0);
});
