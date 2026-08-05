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
  // The drawer is narrow-screen only, so autofocusing a text field here opens the
  // keyboard over it and, on iOS, zooms the page and never zooms back.
  want("focus enters the drawer", $("#nav").contains(doc.activeElement));
  want("opening the drawer does not focus a text field",
       !/^(INPUT|TEXTAREA)$/.test(doc.activeElement.tagName));
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
  want("the line you are on says what it is", $(`.variation[aria-pressed="true"] .variation__note`));
  want("and every row says how long it runs", /\d+ moves/.test($(".variation__meta")?.textContent || ""));
  click(tabs[1]);
  want("the chosen variation is marked", $(`.variation[aria-pressed="true"]`));

  // The list collapses to the chosen line on a phone. jsdom has no media
  // queries, so what is checked here is the state the CSS hangs off.
  click($("#varstoggle"));
  want("the toggle opens the list", $(".variations--open"));
  want("and says so", $("#varstoggle").getAttribute("aria-expanded") === "true");
  click($("#varstoggle"));
  want("and closes it again", !$(".variations--open"));
  click(tabs[0]);
  checkLeaks("variations");
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

step("your own notes", () => {
  // Not every opening has a notes file, so find one that does rather than assume.
  const found = app(`(function(){
    for(const o of DATA) for(let i=0;i<o.lines.length;i++){
      const at = o.lines[i].plies.findIndex(p=>p.mine);
      if(at > 0) return {op:o.id, line:i, ply:at};
    }
    return null;
  })()`);
  report.noteAt = found;
  want("some opening ships personal notes", found);
  if (!found) return;
  app("go")(found.op);
  app("state").line = found.line;
  app("state").ply = found.ply;
  app("render")();
  want("the note card renders", $(".mynote__body"));
  want("and says whose it is", /my note/i.test($(".mynote .label")?.textContent || ""));
  want("the legend names your marks", $(".legend i.mine"));
  // The marks are on a canvas, so the card spelling them out is the only way
  // they are readable at all without one.
  want("marks are spelled out, not only drawn",
       !app("currentPly().mine.arrows") || $(".mynote__marks"));
  click($("#b-mine"));
  want("one switch hides the note and its marks",
       !app("state.mine") && !$(".mynote") && !$(".legend i.mine"));
  click($("#b-mine"));
  want("and brings both back", app("state.mine") && $(".mynote"));
  checkLeaks("my note");
});

/* Drawing is pointer work, and jsdom has neither layout nor a PointerEvent, so
   the drop square is read through elementFromPoint -- stubbed here with the
   square the test nominates. What that proves is the state machine, not that a
   real finger lands where it looks like it does. */
let dropTarget = null;
const square = name => $(`[data-sq="${name}"]`);
const pointer = (type, button, id, kind, x = 0, y = 0) => {
  const e = new window.MouseEvent(type, { bubbles: true, button, cancelable: true, clientX: x, clientY: y });
  Object.defineProperty(e, "pointerId", { value: id });
  Object.defineProperty(e, "pointerType", { value: kind });
  return e;
};
const press = (name, button = 0, id = 1, kind = "mouse") =>
  square(name).dispatchEvent(pointer("pointerdown", button, id, kind));
const move = (id, x, y) => doc.dispatchEvent(pointer("pointermove", 0, id, "touch", x, y));
const release = (name, id = 1) => {
  dropTarget = square(name);
  doc.dispatchEvent(pointer("pointerup", 0, id, "touch"));
};

step("writing a note here", () => {
  doc.elementFromPoint = () => dropTarget;
  // A position with no note of its own, so the entry point has to be offered.
  app("go")(app("DATA[0].id"));
  app("state").line = 0; app("state").ply = 4; app("render")();
  want("an empty position offers a way in", $(".mynote-add"));
  click($(".mynote-add"));
  want("the editor opens", $(".mynote--editing") && $("#notetext"));
  // Drawing is the right button only. An open text box is no reason for the
  // board to stop answering the moves you play on it.
  want("the board still takes moves", app("boardLive")());
  want("a left press is not a drawing gesture", !app("noteDrawGesture({button:0})"));
  want("a right press is", app("noteDrawGesture({button:2})"));

  const box = $("#notetext");
  box.value = "The bishop eyes f7.";
  box.dispatchEvent(new window.Event("input", { bubbles: true }));
  want("typing reaches the working copy", app("state.note.text") === "The bishop eyes f7.");

  // Two-tap: the button anyone can find, and the only one a phone has.
  // The exception, and the only one a phone has: arming a tool buys a plain tap
  // its new meaning, and the board stops taking moves for exactly those taps.
  click($('[data-act="notetool"][data-v="arrow"]'));
  want("the tool arms", app("state.note.tool") === "arrow");
  want("an armed tool makes a left press a drawing gesture", app("noteDrawGesture({button:0})"));
  want("and the board stands down while it is armed", !app("boardLive")());
  press("c4");
  want("the first tap is the tail", app("state.note.from") === "c4");
  press("f7");
  want("the second tap makes the arrow", app("state.note.arrows.length") === 1);
  click($('[data-act="notetool"][data-v="spot"]'));
  press("f7");
  want("circle square marks it", app("state.note.spots[0]") === "f7");

  // Right-drag: the gesture, which must not disturb the move the board plays.
  press("d1", 2, 7); release("h5", 7);
  want("a right-drag draws an arrow", app("state.note.arrows.length") === 2);
  want("every mark is listed as its own undo", $$(".mynote__mark").length === 3);
  click($$(".mynote__mark")[0]);
  want("clicking a mark removes it", $$(".mynote__mark").length === 2);

  click($('[data-act="notesave"]'));
  want("saving closes the editor", !app("state.note") && !$(".mynote--editing"));
  want("and the note is kept", $(".mynote__body"));
  want("which says it is local", /this browser/.test($(".mynote__where")?.textContent || ""));
  checkLeaks("wrote a note");

  // Keyed by position: leaving and coming back is the only test that matters.
  const key = app("noteKey(currentPly())");
  app("state").ply = 0; app("render")();
  want("the note does not follow you to another position", !$(".mynote"));
  app("state").ply = 4; app("render")();
  want("and is there on the way back", $(".mynote__body"));
  want("it is stored against the position", app(`!!db.notes[${JSON.stringify(key)}]`));
});

step("a note here shadows the file, and never destroys it", () => {
  const found = report.noteAt;
  if (!found) return;
  app("go")(found.op);
  app("state").line = found.line; app("state").ply = found.ply; app("render")();
  const shipped = $(".mynote__body").textContent;
  want("the file's note is what shows first", /notes file/.test($(".mynote__where").textContent));
  click($(".mynote__edit"));
  want("editing seeds from what was on screen", app("state.note.text").length > 0);
  $("#notetext").value = "Mine now.";
  $("#notetext").dispatchEvent(new window.Event("input", { bubbles: true }));
  click($('[data-act="notesave"]'));
  want("yours wins", $(".mynote__body").textContent === "Mine now.");
  click($(".mynote__edit"));
  click($('[data-act="notedelete"]'));
  want("deleting yours brings the file's back", $(".mynote__body").textContent === shipped);
  want("and says so", /notes file/.test($(".mynote__where").textContent));

  click($(".mynote__edit"));
  key("Escape", $("#notetext"));
  want("Escape leaves the editor", !app("state.note"));
  checkLeaks("shadowed note");
});

/* A finger has no right button, so holding still on a square is what replaces
   it. The timer is not waited on -- the test fires it -- because what is worth
   proving is that the hold arms, that travel disarms it, and that firing it
   takes the pointer away from the board rather than leaving both in charge. */
step("holding a square draws, on a device with no right button", () => {
  doc.elementFromPoint = () => dropTarget;
  app("go")(app("DATA[0].id"));
  app("state").line = 0; app("state").ply = 2; app("render")();
  app("state").note = null;

  press("f1", 0, 3, "touch");
  want("a touch press arms a hold", app("!!noteHold"));
  want("a mouse press does not", (() => { press("f1", 0, 4, "mouse"); return !app("noteHold"); })());

  press("f1", 0, 5, "touch");
  move(5, 40, 40);
  want("travelling disarms it — that is a piece being dragged", !app("noteHold"));

  press("f1", 0, 6, "touch");
  want("the board had the pointer first", app("!!state.selected || !!state.drag"));
  app("noteHoldFire")();
  want("the hold takes it", app("state.drawing?.from") === "f1");
  want("and the board lets go", !app("state.selected") && !app("state.drag"));
  want("the editor came with it", app("!!state.note"));
  release("c4", 6);
  want("dragging to another square makes the arrow",
       app("state.note.arrows.length") === 1 && app("state.note.arrows[0].t") === "c4");

  // Hold and let go without travelling: the touch equivalent of a right-click.
  press("d2", 0, 7, "touch");
  app("noteHoldFire")();
  release("d2", 7);
  want("holding in place circles the square", app("state.note.spots[0]") === "d2");
  click($('[data-act="notecancel"]'));
  checkLeaks("held to draw");
});

step("with Notes switched off, neither gesture draws", () => {
  app("go")(app("DATA[0].id"));
  app("state").line = 0; app("state").ply = 2; app("state").note = null;
  app("state").mine = true; app("render")();
  want("the way in is offered while the layer is on", $(".mynote-add"));

  click($("#b-mine"));
  want("the layer is off", !app("state.mine"));
  want("and there is no way in", !$(".mynote-add") && !$(".mynote"));
  want("a right press draws nothing", !app("noteDrawGesture({button:2})"));
  press("f1", 0, 9, "touch");
  want("a hold does not even arm", !app("noteHold"));
  press("f1", 2, 10);
  want("and a right-drag starts nothing", !app("state.drawing"));

  click($("#b-mine"));
  want("switching it back on restores both", app("state.mine") && $(".mynote-add")
       && app("noteDrawGesture({button:2})"));
  checkLeaks("notes off");
});

step("switching the layer off closes an open editor without losing it", () => {
  app("go")(app("DATA[0].id"));
  app("state").line = 0; app("state").ply = 3; app("state").mine = true; app("render")();
  click($(".mynote-add") || $(".mynote__edit"));
  const here = app("noteKey(currentPly())");
  $("#notetext").value = "Typed, then hidden.";
  $("#notetext").dispatchEvent(new window.Event("input", { bubbles: true }));
  click($("#b-mine"));
  want("the editor does not outlive the layer", !app("state.note"));
  want("but what was typed is kept",
       app(`db.notes[${JSON.stringify(here)}]?.text`) === "Typed, then hidden.");
  click($("#b-mine"));
  want("and comes back with the layer", $(".mynote__body")?.textContent === "Typed, then hidden.");
  checkLeaks("layer off with editor open");
});

step("an open note follows its own position, not the cursor", () => {
  app("go")(app("DATA[0].id"));
  app("state").line = 0; app("state").ply = 6; app("render")();
  const here = app("noteKey(currentPly())");
  click($(".mynote-add") || $(".mynote__edit"));
  $("#notetext").value = "Filed against move six.";
  $("#notetext").dispatchEvent(new window.Event("input", { bubbles: true }));
  // Stepping away mid-sentence must not file what was typed on the next move,
  // and must not throw it away either.
  app("step")(1);
  want("stepping closes the editor", !app("state.note"));
  want("what was typed is kept, on the position it was written for",
       app(`db.notes[${JSON.stringify(here)}]?.text`) === "Filed against move six.");
  want("and the position stepped onto is untouched", app("!db.notes[noteKey(currentPly())]"));
  app("state").ply = 6; app("render")();
  want("it reads back", $(".mynote__body")?.textContent === "Filed against move six.");
  checkLeaks("note kept across a step");
});

step("notes come back out in the format the build reads", () => {
  app("go")("progress");
  click($('[data-act="notesource"]'));
  const text = $("#transferbox").value;
  want("there is something to promote", text.length > 20);
  want("it names the file each block belongs in", /# src\/content\/notes\/\w+\.txt/.test(text));
  want("blocks are titled the way the parser needs", /^\S.*:$/m.test(text));
  // The build refuses two notes on one position, so a duplicated block would be
  // rejected outright by the file it was written for.
  const perFile = text.split(/^# src\/content\/notes\//m).slice(1);
  for (const file of perFile) {
    const notes = file.match(/\([^)]*\)/g) || [];
    want("no note is written twice in one file", notes.length === new Set(notes).size);
  }
  checkLeaks("notes as source");
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
