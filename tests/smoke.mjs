/* Load the built page in jsdom, drive every view, and fail on anything thrown.
 *
 * This is the guard the build cannot be: build.py concatenates the scripts
 * without parsing them, so a syntax error -- or a function renamed in one file
 * and not another -- ships a dead page and the build still reports success.
 *
 *   node tests/smoke.mjs docs/chess-opening-course.html
 *
 * Driven by tests/test_smoke.py, which skips when node or jsdom is missing.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const file = process.argv[2];
if (!file) { console.error("usage: node tests/smoke.mjs <built page.html>"); process.exit(2); }

const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require("jsdom");

const problems = [];
const fail = m => problems.push(m);

const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", e => {
  const m = e.stack || e.message;
  // jsdom has no layout engine, so it implements neither scrolling nor canvas.
  if (/Not implemented: Window's scroll/.test(m)) return;
  fail("threw: " + m);
});
virtualConsole.on("error", (...a) => fail("console.error: " + a.join(" ")));

const dom = new JSDOM(readFileSync(file, "utf8"), {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole,
  url: "https://chesslab.dev/",
});
const { window } = dom;
const doc = window.document;

// The app only ever draws to the canvas; it never reads a pixel back.
const noop = () => {};
window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => noop });

const $ = s => doc.querySelector(s);
const $$ = s => [...doc.querySelectorAll(s)];
const click = el => el && el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const key = (k, target) => (target || doc).dispatchEvent(
  new window.KeyboardEvent("keydown", { key: k, bubbles: true }));
// Top-level const/let in a classic script are lexical globals, not window props.
const app = expr => window.eval(expr);

const step = (label, fn) => {
  try { fn(); } catch (e) { fail(`${label}: ${e.stack || e.message}`); }
};
const want = (label, cond) => { if (!cond) fail(`${label}: expected, not found`); };

/* A view that renders "undefined", "NaN" or "[object Object]" is a broken
   template that still produces valid HTML, so nothing else here would catch it. */
const LEAKS = /\bundefined\b|\bNaN\b|\[object Object\]/;
const checkLeaks = where => {
  const html = $("#content").innerHTML;
  if (!html.length) fail(`${where}: rendered nothing`);
  const hit = html.match(LEAKS);
  if (hit) fail(`${where}: leaked ${hit[0]} into the page`);
};

await new Promise(r => setTimeout(r, 100));

const report = {};

step("shell", () => {
  report.title = doc.title;
  want("app bar", $(".appbar"));
  want("nav", $("#nav .nav__item"));
  want("openings are grouped by family", $("#nav .nav__moves"));
  want("live region", $("#announce"));
  want("theme toggle", $("#themetoggle"));
  // A phone hides .pill__word, so whatever is left has to still say something.
  want("the progress chip survives losing its word", $("#progresschip .glyph"));
  want("the theme toggle survives losing its word", $("#themetoggle .glyph"));
  want("hero on the front page", $(".hero__title"));
  checkLeaks("primer");
});

step("nav: every destination renders", () => {
  const targets = $$("#nav [data-go]").map(b => b.dataset.go);
  report.destinations = targets.length;
  for (const t of targets) { app("go")(t); checkLeaks(`view ${t}`); }
});

step("nav: filter", () => {
  const filter = $("#navfilter");
  filter.value = "sicil";
  filter.dispatchEvent(new window.Event("input", { bubbles: true }));
  const shown = $$("#nav [data-go]").filter(b => !b.hidden);
  want("filter narrows the list", shown.length && shown.length < report.destinations);
  filter.value = "zzzz";
  filter.dispatchEvent(new window.Event("input", { bubbles: true }));
  want("filter says when nothing matches", $(".nav__empty"));
  filter.value = "";
  filter.dispatchEvent(new window.Event("input", { bubbles: true }));
  want("filter restores the list", $$("#nav [data-go]").filter(b => !b.hidden).length === report.destinations);
});

step("nav: drawer", () => {
  click($("#navtoggle"));
  want("drawer opens", $("#nav").classList.contains("open"));
  want("toggle reports open", $("#navtoggle").getAttribute("aria-expanded") === "true");
  want("scrim shows", !$("#scrim").hidden);
  // Tab out of the last control and focus has to come back, not land behind the scrim.
  const items = app("navFocusables")();
  items[items.length - 1].focus();
  key("Tab");
  want("Tab wraps inside the open drawer", $("#nav").contains(doc.activeElement));
  key("Escape");
  want("Escape closes the drawer", !$("#nav").classList.contains("open"));
  want("closing returns focus to the button", doc.activeElement === $("#navtoggle"));
});

const opening = app("DATA[0].id");

step("read: stepping and the transport", () => {
  app("go")(opening);
  want("board", $("#board .sq"));
  want("scoresheet", $("#tape .move"));
  want("coach card", $(".coach__body"));
  want("mode switch", $('[data-act="mode"][data-v="drill"]'));
  key("ArrowRight"); key("ArrowRight");
  want("stepping marks the current move", $("#tape .move.current"));
  report.plies = $$("#tape [data-ply]").length;
  key("ArrowLeft"); key("End");
  want("the end of a line hands over a plan", $(".plan"));
  key("Home");
  click($("#b-flip")); click($("#b-arrows")); click($("#b-arrows")); click($("#b-flip"));
  click($("#b-last")); click($("#b-first")); click($("#b-next")); click($("#b-prev"));
  checkLeaks("read mode");
});

step("read: variations", () => {
  const tabs = $$(".variation");
  want("more than one variation", tabs.length > 1);
  click(tabs[1]);
  want("the chosen variation is marked", $(`.variation[aria-pressed="true"]`));
  click(tabs[0]);
});

step("read: the win bar", () => {
  // Not every line carries a record, so find one that does rather than assume.
  const found = app(`DATA.flatMap(o=>o.lines.map((l,i)=>({op:o.id,line:i,rec:!!l.record})))
                        .find(x=>x.rec)`);
  report.recordAt = found || null;
  want("some line ships a record", found);
  if (!found) return;
  app("go")(found.op);
  app("state").line = found.line;
  app("render")();
  want("the win bar draws", $(".record__bar .record__share--white"));
  want("and says what it counted", $(".record__caption"));
  // In drill the caption must not name the move the scoresheet is masking.
  click($('[data-act="mode"][data-v="drill"]'));
  want("drill hides the move the record counted from",
       !/after/.test($(".record__caption")?.textContent || ""));
  click($('[data-act="mode"][data-v="read"]'));
  checkLeaks("win bar");
});

step("read: playing a move on the board", () => {
  app("go")(opening);
  const next = app("currentPlies()[1]");
  app("readModeTry")(next.from, next.to);
  want("the line follows a move it plays", app("state.ply") === 1);
  // A move nothing has notes on still gets an answer rather than silence.
  app("readModeTry")("a2", "a3");
  want("an off-book move is answered", $(".verdict"));
  checkLeaks("read: answered a move");
});

step("drill: a full line", () => {
  app("go")(opening);
  click($('[data-act="mode"][data-v="drill"]'));
  want("drill panel", $(".coach__progress"));
  want("the answer sheet is masked", $(".move--masked"));
  key("h"); want("hint ladder", $(".coach__hints"));
  key("h"); key("s");                       // second rung, then show me
  let guard = 0;
  while (app("state.drill.phase") !== "done" && guard++ < 80) { key("Enter"); key("s"); }
  want("the line completes", app("state.drill.phase") === "done");
  want("a finished drill hands over a plan", $(".plan"));
  checkLeaks("drill: done");
  click($('[data-act="restart"]'));
  click($('[data-act="bothsides"]'));
  want("both sides asks for every move",
       app("drillAskedCount(currentLine())") === app("currentPlies().length - 1"));
  click($('[data-act="bothsides"]'));
  click($('[data-act="mode"][data-v="read"]'));
});

step("drill: a wrong move is answered, not just refused", () => {
  app("go")(opening);
  click($('[data-act="mode"][data-v="drill"]'));
  app("drillTry")("a2", "a3");
  want("a legal off-book move gets a verdict", $(".verdict") || $(".coach"));
  app("drillTry")("a1", "h8");
  checkLeaks("drill: refused a move");
  click($('[data-act="mode"][data-v="read"]'));
});

step("deviations", () => {
  // Find an opening and ply that actually ships deviations, rather than assuming.
  let found = null;
  for (const id of app("DATA.map(o=>o.id)")) {
    app("go")(id);
    for (let ply = 0; ply < 8 && !found; ply++) {
      app("state").ply = ply;
      if (app("devAt")(ply).length) found = { id, ply };
    }
    if (found) break;
  }
  report.deviationAt = found;
  want("some opening ships deviations", found);
  if (!found) return;
  app("go")(found.id);
  app("state").ply = found.ply;
  app("render")();
  key("d");
  want("the picker opens", $(".deviation-picker"));
  want("candidates carry a severity word", $(".severity__word"));
  click($('[data-act="deviation"]'));
  want("the deviation is answered", $('.coach[data-tone]'));
  checkLeaks("deviation");
  key("ArrowRight"); key("Escape");
  want("Escape returns to the line", !app("state.deviation"));
});

step("structures, games, progress", () => {
  if (app("STRUCTURES.length")) {
    app("go")("structure:" + app("STRUCTURES[0].id"));
    want("structure diagram", $(".structure__diagram .board"));
    checkLeaks("structure");
  }
  if (app("GAMES.length")) {
    app("go")("game:" + app("GAMES[0].id"));
    want("game board", $("#board"));
    key("ArrowRight"); key("ArrowRight");
    checkLeaks("game");
  }
  app("go")("progress");
  click($('[data-act="export"]'));
  want("export fills the box", $("#transferbox").value.length > 10);
  click($('[data-act="import"]'));
  want("import reports back", $("#transfermsg").textContent.length);
  checkLeaks("progress");
});

step("theme", () => {
  const before = doc.documentElement.getAttribute("data-theme");
  click($("#themetoggle"));
  want("the theme changes", doc.documentElement.getAttribute("data-theme") !== before);
  click($("#themetoggle"));
  want("and changes back", doc.documentElement.getAttribute("data-theme") === before);
});

step("nothing is hidden behind a setting", () => {
  // Every structure, game and opening in the data is reachable from the nav.
  const listed = new Set($$("#nav [data-go]").map(b => b.dataset.go));
  for (const id of app("DATA.map(o=>o.id)")) want(`${id} is listed`, listed.has(id));
  for (const id of app("STRUCTURES.map(s=>s.id)")) want(`structure ${id} is listed`, listed.has("structure:" + id));
  for (const id of app("GAMES.map(g=>g.id)")) want(`game ${id} is listed`, listed.has("game:" + id));
  // …and every stage of a learning path is on the page, not just the early ones.
  app("go")(opening);
  const stages = app("currentOpening().progression.stages.length");
  want("every learning-path stage renders", $$(".stages > li").length === stages);
});

await new Promise(r => setTimeout(r, 100));

console.log(JSON.stringify(report, null, 2));
if (problems.length) {
  console.error("\n" + problems.length + " problem(s):");
  for (const p of problems.slice(0, 30)) console.error("  - " + p);
  process.exit(1);
}
console.log("\nOK — every view renders and nothing threw.");
