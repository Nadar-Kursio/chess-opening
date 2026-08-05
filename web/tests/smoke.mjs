/* The artifact smoke: drives the exported site the way a learner uses it.
   Run after `npm run build`:  node tests/smoke.mjs
   Fails on any console error (hydration mismatches included), any leaked
   "undefined"/"NaN", and any behaviour below. The step list is ported from the
   old tests/smoke.mjs, scoped to what this app ships so far. */

import { readdirSync, statSync } from "fs";
import { join } from "path";
import { OUT, checkLeaks, fire, loadPage, tick, until } from "./harness.mjs";

const steps = [];
function step(name, fn) { steps.push({ name, fn }); }
function ok(cond, what) { if (!cond) throw new Error(`expected ${what}`); }

function routes() {
  const found = [];
  const walk = (dir, rel) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path, rel ? `${rel}/${name}` : name);
      else if (name === "index.html") found.push(rel);
    }
  };
  walk(OUT, "");
  return found.sort();
}

const lab = (window) => window.__lab;
const act = async (window, fn) => { fn(lab(window).actions); await tick(window, 40); };

/* ---------------- every page ---------------- */

step("every exported page hydrates clean and leaks nothing", async () => {
  const all = routes();
  ok(all.length >= 20, `at least 20 pages in out/ (got ${all.length})`);
  for (const route of all) {
    const island = route.startsWith("openings/") && route !== "openings";
    const { window, document } = await loadPage(route, { expectIsland: island });
    checkLeaks(document, route);
    window.close();
  }
});

/* ---------------- the shell ---------------- */

step("shell: brand, nav groups, traps section, theme toggle", async () => {
  const { window, document } = await loadPage("");
  ok(document.querySelector(".appbar__name")?.textContent === "Opening Lab", "the wordmark");
  const groups = [...document.querySelectorAll(".nav__group .label")].map((el) => el.textContent);
  ok(groups.includes("Open Games"), "the Open Games family in the nav");
  ok(groups.includes("Opening Traps"), "the traps section in the nav");
  const items = [...document.querySelectorAll(".nav__item")].map((a) => a.textContent || "");
  ok(items.some((t) => t.includes("Ruy Lopez")), "the Ruy Lopez in the nav");
  ok(items.some((t) => t.includes("Scholar's Mate")), "the Scholar's Mate in the nav");
  ok(items.some((t) => t.includes("Fried Liver Attack")), "the Fried Liver in the nav");

  const html = document.documentElement;
  const toggle = document.getElementById("themetoggle");
  const before = html.getAttribute("data-theme");
  toggle.click();
  await tick(window, 30);
  ok(html.getAttribute("data-theme") !== before, "the theme to flip");
  await until(() => {
    const saved = JSON.parse(window.localStorage.getItem("chesslab") || "null");
    return saved?.ui?.theme === html.getAttribute("data-theme");
  }, "the choice to be stored (saves are debounced)", window);
  toggle.click();
  await tick(window, 30);
  ok(html.getAttribute("data-theme") === before, "the theme to flip back");
  window.close();
});

step("shell: the nav filter narrows and recovers", async () => {
  const { window, document } = await loadPage("");
  const filter = document.getElementById("navfilter");
  const set = (v) => {
    const proto = Object.getPrototypeOf(filter);
    Object.getOwnPropertyDescriptor(proto, "value").set.call(filter, v);
    fire(window, filter, "input");
  };
  set("fried");
  await tick(window, 40);
  const visible = [...document.querySelectorAll(".nav__item")].map((a) => a.textContent || "");
  ok(visible.some((t) => t.includes("Fried Liver")), "the Fried Liver to survive the filter");
  ok(!visible.some((t) => t.includes("Ruy Lopez")), "the Ruy Lopez to be filtered out");
  set("zzzz");
  await tick(window, 40);
  ok(document.querySelector(".nav__empty"), "the empty-state message");
  set("");
  await tick(window, 40);
  ok(
    [...document.querySelectorAll(".nav__item")].some((a) => (a.textContent || "").includes("Ruy Lopez")),
    "the list to come back"
  );
  window.close();
});

/* ---------------- read mode ---------------- */

step("read: the board, stepping, the coach card and the plan", async () => {
  const { window, document } = await loadPage("openings/ruylopez", { expectIsland: true });
  ok(document.querySelectorAll("#board [data-sq]").length === 64, "64 squares");
  ok(document.querySelectorAll("#board .piece").length === 32, "32 pieces at the start");
  ok(document.querySelector(".coach__move")?.textContent === "Start", "the start card");

  document.getElementById("b-next").click();
  await tick(window, 40);
  ok(lab(window).state.ply === 1, "the cursor at move 1");
  ok(document.querySelector(".coach__move")?.textContent === "1.e4", "the coach card on 1.e4");
  ok(document.querySelector("#tape .move.current")?.textContent === "e4", "the tape's current move");

  await act(window, (a) => a.toEnd());
  ok(document.querySelector(".plan"), "the plan card at the end of the line");
  document.getElementById("b-first").click();
  await tick(window, 40);
  ok(lab(window).state.ply === 0, "back at the start");

  const record = document.querySelector(".record__caption");
  ok(record && /master games/.test(record.textContent), "the win bar caption");
  checkLeaks(document, "openings/ruylopez");
  window.close();
});

step("read: the engine's score, on every ply of the line", async () => {
  const { window, document } = await loadPage("openings/ruylopez", { expectIsland: true });
  const score = () => document.querySelector(".evalbar__score")?.textContent || "";
  const SCORE = /^[+−]\d+\.\d\d$|^0\.00$|^−?M\d+$/;
  ok(SCORE.test(score()), `a well-formed score (got "${score()}")`);
  const total = lab(window).plies.length - 1;
  for (let i = 0; i < total; i++) {
    await act(window, (a) => a.step(1));
    ok(document.querySelector(".evalbar"), `an eval bar at ply ${i + 1}`);
    ok(SCORE.test(score()), `a well-formed score at ply ${i + 1} (got "${score()}")`);
  }
  window.close();
});

step("read: variations are links, and a trap line names its chair", async () => {
  const { window, document } = await loadPage("openings/ruylopez", { expectIsland: true });
  const rows = [...document.querySelectorAll(".variation")];
  ok(rows.length === 7, `7 variation rows (got ${rows.length})`);
  ok(rows[0].getAttribute("aria-pressed") === "true", "the current row marked");
  ok(rows[1].getAttribute("href") === "/openings/ruylopez/exchange/", "a slug URL on the second row");
  window.close();

  const trap = await loadPage("openings/scholarsmate", { expectIsland: true });
  const chips = [...trap.document.querySelectorAll(".variation__side")].map((el) => el.textContent);
  ok(chips.includes("as Black"), "the chair chip on a Black-played trap line");
  trap.window.close();
});

step("read: an off-book move is answered, an illegal one is refused", async () => {
  const { window, document } = await loadPage("openings/ruylopez", { expectIsland: true });
  await act(window, (a) => a.boardMove("g1", "h3")); // legal, off-book
  const verdict = document.querySelector(".verdict");
  ok(verdict && /Nh3/.test(verdict.textContent), "the off-book verdict to name the move");
  ok(/This line plays/.test(verdict.textContent), "the verdict to name the line's move");
  await act(window, (a) => a.boardMove("a1", "a5")); // illegal
  const refused = document.querySelector(".verdict");
  ok(refused && /isn't a legal move/.test(refused.textContent), "the illegal move to be refused");
  checkLeaks(document, "read verdicts");
  window.close();
});

/* ---------------- drill ---------------- */

step("drill: a full line, scored and finished", async () => {
  const { window, document } = await loadPage("openings/ruylopez", { expectIsland: true });
  await act(window, (a) => a.setMode("drill"));
  ok(lab(window).state.drill.phase === "ask", "the drill asking");
  ok(document.querySelector(".coach__prompt"), "the prompt");
  ok(document.querySelector("#tape .move--masked"), "the tape masked ahead of the cursor");

  for (let guard = 0; guard < 80; guard++) {
    const s = lab(window).state;
    if (s.drill.phase === "done") break;
    if (s.drill.phase === "ask") {
      const answer = lab(window).plies[s.ply + 1];
      await act(window, (a) => a.boardMove(answer.from, answer.to));
    } else {
      await act(window, (a) => a.cont());
    }
  }
  ok(lab(window).state.drill.phase === "done", "the line to finish");
  ok(/Line complete/.test(document.querySelector(".coach__turn")?.textContent || ""), "the completion header");
  ok(document.querySelector(".plan"), "the plan card after the drill");
  await until(() => {
    const saved = JSON.parse(window.localStorage.getItem("chesslab") || "null");
    return saved?.lines?.["ruylopez/chigorin"]?.done;
  }, "the score to be saved under ruylopez/chigorin", window);
  window.close();
});

step("drill: a wrong move is answered, an illegal one refused, a hint helps", async () => {
  const { window, document } = await loadPage("openings/ruylopez", { expectIsland: true });
  await act(window, (a) => a.setMode("drill"));
  await act(window, (a) => a.boardMove("a2", "a3")); // legal, not the move (no branch for 1.a3)
  ok(lab(window).state.drill.phase === "wrong", "the wrong phase");
  ok(/isn't the move|is legal/.test(document.querySelector(".verdict")?.textContent || ""),
    "the wrong-move verdict");
  await act(window, (a) => a.boardMove("e1", "e5")); // illegal
  ok(/isn't a legal move/.test(document.querySelector(".verdict")?.textContent || ""),
    "the illegal-move verdict");
  await act(window, (a) => a.hint());
  ok(document.querySelector(".coach__hints li"), "the first hint rung");
  await act(window, (a) => a.show());
  ok(lab(window).state.drill.phase === "reveal", "show-me revealing the move");
  window.close();
});

step("drill: a trap line played as Black asks for Black's moves", async () => {
  const { window, document } = await loadPage("openings/scholarsmate/defusing", { expectIsland: true });
  ok(lab(window).state.flipped === true, "the board turned around for a Black line");
  ok(document.querySelector("#board [data-sq]")?.dataset.sq === "h1", "h1 drawn first when flipped");
  await act(window, (a) => a.setMode("drill"));
  const s = lab(window).state;
  const answer = lab(window).plies[s.ply + 1];
  ok(answer.turn === "b", "the first question to be a Black move");
  ok(/Black/.test(document.querySelector(".coach__turn")?.textContent || ""), "the prompt names Black");
  window.close();
});

/* ---------------- deviations ---------------- */

/* Deviations are authored where the position invites them, not at the start —
   find the first ply of the line that carries a set. */
async function firstDevPly(window) {
  const total = lab(window).plies.length;
  for (let i = 0; i < total; i++) {
    await act(window, (a) => a.jump(i));
    if (lab(window).actions.devList().length) return i;
  }
  return -1;
}

step("deviations: the picker, the severity words, the second cursor", async () => {
  const { window, document } = await loadPage("openings/ruylopez", { expectIsland: true });
  const at = await firstDevPly(window);
  ok(at >= 0, "a position with authored deviations somewhere in the line");
  fire(window, document, "keydown", { key: "d" });
  await tick(window, 40);
  ok(document.querySelector(".deviation-picker"), "the picker on D");
  const candidates = [...document.querySelectorAll(".candidate")];
  ok(candidates.length > 0, "candidates in the picker");
  ok(document.querySelector(".candidate .severity__word"), "a severity word on each candidate");

  candidates[0].click();
  await tick(window, 40);
  ok(lab(window).state.deviation, "the deviation cursor");
  ok(document.querySelector(".coach .severity__word"), "the panel's severity word");
  ok(document.querySelector(".coach__close"), "the way back");

  const plies = lab(window).plies;
  if (plies.length > 1) {
    await act(window, (a) => a.step(1));
    ok(lab(window).state.deviation.at === 1, "stepping inside the deviation");
  }
  fire(window, document, "keydown", { key: "Escape" });
  await tick(window, 40);
  ok(!lab(window).state.deviation, "Escape returns to the line");
  ok(lab(window).state.ply === at, "the line cursor untouched");
  checkLeaks(document, "deviations");
  window.close();
});

step("deviations: a costly move gets the engine's sentence", async () => {
  const { window, document } = await loadPage("openings/ruylopez", { expectIsland: true });
  // Walk the line for an authored deviation whose first move swings at least
  // half a pawn against its player — the evalmove threshold — from the data,
  // then enter exactly that one and expect the sentence.
  const scalar = (p) => (p.mate !== undefined ? Math.sign(p.mate) * (10000 - Math.abs(p.mate)) : p.ev);
  const total = lab(window).plies.length;
  let found = null;
  for (let ply = 0; ply < total - 1 && !found; ply++) {
    await act(window, (a) => a.jump(ply));
    const before = lab(window).plies[ply];
    const list = lab(window).actions.devList();
    for (let i = 0; i < list.length; i++) {
      const first = list[i].plies[0];
      if (before.ev === undefined || !first || first.ev === undefined) continue;
      const swing = Math.round((first.turn === "w" ? 1 : -1) * (scalar(first) - scalar(before)));
      if (swing <= -50) { found = { ply, i }; break; }
    }
  }
  ok(found, "a deviation that costs at least half a pawn somewhere in the line");
  await act(window, (a) => a.jump(found.ply));
  await act(window, (a) => a.devEnter(found.i, "read"));
  ok(document.querySelector(".coach .evalmove"), "the engine's sentence about it");
  ok(/gives up/.test(document.querySelector(".coach .evalmove")?.textContent || ""),
    "the sentence to say what was given up");
  window.close();
});

step("drill: a drilled deviation re-arms the question on the way out", async () => {
  const { window, document } = await loadPage("openings/ruylopez", { expectIsland: true });
  await act(window, (a) => a.setMode("drill"));
  // Answer correctly until the drill asks from a position that has an
  // authored deviation set, then play the deviation itself.
  let list = [];
  for (let guard = 0; guard < 60; guard++) {
    const s = lab(window).state;
    if (s.drill.phase === "ask") {
      list = lab(window).actions.devList();
      if (list.length) break;
      const answer = lab(window).plies[s.ply + 1];
      if (!answer) break;
      await act(window, (a) => a.boardMove(answer.from, answer.to));
    } else if (s.drill.phase === "done") break;
    else await act(window, (a) => a.cont());
  }
  ok(list.length > 0, "a drill question with authored deviations");
  const first = list[0].plies[0];
  await act(window, (a) => a.boardMove(first.from, first.to)); // play the deviation itself
  ok(lab(window).state.deviation, "the authored answer to the move actually played");
  ok(lab(window).state.deviation.origin === "drill", "the deviation knowing it came from the drill");
  fire(window, document, "keydown", { key: "Escape" });
  await tick(window, 40);
  ok(lab(window).state.drill.phase === "ask", "the question re-armed");
  window.close();
});

/* ---------------- the author's notes ---------------- */

step("notes: the shipped note card renders where a note exists", async () => {
  // The notes file attaches by position, so the note may sit on any line.
  const pages = ["openings/ruylopez", "openings/ruylopez/exchange", "openings/ruylopez/berlin",
    "openings/ruylopez/anderssen", "openings/ruylopez/open-spanish", "openings/ruylopez/marshall",
    "openings/ruylopez/chigorin-deep"];
  for (const route of pages) {
    const { window, document } = await loadPage(route, { expectIsland: true });
    const plies = lab(window).plies;
    const at = plies.findIndex((p) => p.mine);
    if (at < 0) { window.close(); continue; }
    await act(window, (a) => a.jump(at));
    const card = document.querySelector(".mynote");
    ok(card, `the note card on /${route} ply ${at}`);
    ok(/from the notes file/.test(card.textContent), "the card naming its source");
    window.close();
    return;
  }
  throw new Error("expected a shipped author note somewhere in the Ruy Lopez");
});

/* ---------------- run ---------------- */

let failed = 0;
const report = {};
for (const { name, fn } of steps) {
  try {
    await fn();
    console.log(`  ok  ${name}`);
    report[name] = "ok";
  } catch (err) {
    failed += 1;
    console.log(`FAIL  ${name}`);
    console.log(`      ${err.message.split("\n").join("\n      ")}`);
    report[name] = String(err.message);
  }
}
console.log(failed ? `\n${failed} of ${steps.length} steps failed` : `\nall ${steps.length} steps passed`);
process.exit(failed ? 1 : 0);
