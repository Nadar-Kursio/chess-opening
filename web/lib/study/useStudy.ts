"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Branch, Line, Opening, Ply, Turn } from "@/lib/content/types";
import { announce } from "@/lib/announce";
import { isLegalMove, isOwnPiece, moveName, normaliseMove, FILES } from "@/lib/chess/read";
import { db, dbLineKey, dbSave } from "@/lib/db";
import { drillAskedCount, moverSide, movePrinciple, feedbackLevel } from "./drill";

/* The study island's state machine, ported from state.js + drill.js +
   deviation.js + the read-mode half of render.js. One hook per mounted page;
   the URL owns which opening and line this is, so none of that lives here.

   The transitions mutate a draft copy of the state and commit once — the same
   shape as the original's "mutate `state`, then render()", which is what keeps
   this a line-by-line port instead of a reinvention. */

export interface Deviation { fromPly: number; idx: number; at: number; origin: "read" | "drill" }
export interface Rejected { from: string; to: string; kind: "wrong" | "illegal" }

export interface DrillState {
  phase: "ask" | "right" | "reveal" | "wrong" | "done";
  hint: number;
  tries: number;
  seen: Record<number, "right" | "assisted" | "wrong">;
  streak: number;
  cursor: string;
  verdict: string;          // built with <b> — rendered via dangerouslySetInnerHTML
  tone: string;
  verdictPly: number;
  bothSides: boolean;
  rejected: Rejected | null;
}

export interface StudyState {
  ply: number;
  flipped: boolean;
  arrows: boolean;
  mine: boolean;
  mode: "read" | "drill";
  selected: string | null;
  picking: boolean;
  varsOpen: boolean;
  autoplay: boolean;
  deviation: Deviation | null;
  drill: DrillState;
}

function freshDrill(flipped: boolean): DrillState {
  return {
    phase: "ask", hint: 0, tries: 0, seen: {}, streak: 0,
    cursor: flipped ? "e5" : "e4",
    verdict: "", tone: "", verdictPly: 0, bothSides: false, rejected: null,
  };
}

export function useStudy(opening: Opening, lineIndex: number) {
  const line: Line = opening.lines[lineIndex];
  const sideColour = line.side || opening.orientation;
  const side: Turn = sideColour === "black" ? "b" : "w";

  const [state, setState] = useState<StudyState>(() => ({
    ply: 0,
    flipped: side === "b",
    arrows: true,
    mine: true,
    mode: "read",
    selected: null,
    picking: false,
    varsOpen: false,
    autoplay: false,
    deviation: null,
    drill: freshDrill(side === "b"),
  }));

  const ref = useRef(state);
  ref.current = state;

  /* Thin bindings over the module-level cursor helpers below, so nothing in
     `actions` closes over a per-render value — the memo freezes first-render
     closures, and only bindings that reach state through `ref.current` (or
     per-mount-stable props) are safe inside it. */
  const devAt = (ply: number) => devAtOf(opening, line, ply);
  const pliesOf = (s: StudyState) => pliesIn(opening, line, s);
  const indexOf = (s: StudyState) => indexIn(s);
  const stepped = (s: StudyState, d: number) => steppedIn(opening, line, s, d);

  /* ---- transitions; each builds the next state and commits once ---- */

  const commit = (next: StudyState) => {
    ref.current = next;
    setState(next);
  };

  const stopAutoplay = (s: StudyState): StudyState =>
    s.autoplay ? { ...s, autoplay: false } : s;

  /* Play the opponent's moves for them until it is the learner's turn again —
     the loop is what makes this correct rather than the alternation happening
     to hold. drillFinish's db writes live here because "no next move" is only
     discoverable while advancing. */
  const advanceToAsk = (s: StudyState): StudyState => {
    let ply = s.ply;
    let next = line.plies[ply + 1];
    while (!s.drill.bothSides && next && next.turn !== side) {
      ply += 1;
      next = line.plies[ply + 1];
    }
    if (next) return { ...s, ply, drill: { ...s.drill, phase: "ask" } };

    const d = s.drill;
    const asked = drillAskedCount(line, side, d.bothSides);
    const right = Object.values(d.seen).filter((v) => v === "right").length;
    const hints = Object.values(d.seen).filter((v) => v === "assisted").length;
    const key = dbLineKey(opening.id, line.slug);
    const prev = db.lines[key];
    const score = asked ? right / asked : 0;
    db.lines[key] = { asked, right, hints, done: true, best: Math.max(score, prev?.best || 0) };
    db.streak.cur = d.streak;
    dbSave();
    return { ...s, ply, drill: { ...d, phase: "done" } };
  };

  const drillResetState = (s: StudyState): StudyState => {
    const flipped = s.flipped;
    return advanceToAsk({
      ...s,
      ply: 0,
      selected: null,
      drill: {
        ...freshDrill(flipped),
        bothSides: s.drill.bothSides, // a preference, and it deliberately survives
        streak: db.streak.cur | 0,
      },
    });
  };

  const actions = useMemo(() => {
    const a = {
      jump(n: number) {
        const s = stopAutoplay(ref.current);
        commit(s.deviation ? { ...s, deviation: { ...s.deviation, at: n } } : { ...s, ply: n });
      },
      step(d: number): boolean {
        const s = stopAutoplay(ref.current);
        const next = stepped(s, d);
        commit(next || s);
        return !!next;
      },
      /* Not stopAutoplay: the autoplay interval itself steps through here. */
      autoStep(): boolean {
        const next = stepped(ref.current, 1);
        if (next) commit(next);
        return !!next;
      },
      toEnd() {
        const s = stopAutoplay(ref.current);
        a.jump(pliesOf(s).length - 1);
      },
      toggleAutoplay() {
        const s = ref.current;
        commit({ ...s, autoplay: !s.autoplay });
      },
      flip() {
        const s = ref.current;
        commit({ ...s, flipped: !s.flipped });
      },
      toggleArrows() {
        const s = ref.current;
        db.ui.arrows = !s.arrows;
        dbSave();
        commit({ ...s, arrows: !s.arrows });
      },
      toggleMine() {
        const s = ref.current;
        db.ui.mine = !s.mine;
        dbSave();
        commit({ ...s, mine: !s.mine });
      },
      toggleVars() {
        const s = ref.current;
        commit({ ...s, varsOpen: !s.varsOpen });
      },
      restorePrefs() {
        const s = ref.current;
        commit({
          ...s,
          arrows: typeof db.ui.arrows === "boolean" ? db.ui.arrows : s.arrows,
          mine: typeof db.ui.mine === "boolean" ? db.ui.mine : s.mine,
          drill: { ...s.drill, bothSides: !!db.ui.bothSides },
        });
      },

      setMode(mode: "read" | "drill") {
        const s = stopAutoplay(ref.current);
        const base = { ...s, mode, selected: null };
        if (mode === "drill") {
          commit(drillResetState(base));
          announce("Drill started. Play the move on the board.");
        } else {
          commit({ ...base, drill: { ...base.drill, phase: "ask" } });
        }
      },
      toggleBothSides() {
        // Restarts the line: the score is out of a different number of moves now.
        const s = ref.current;
        const bothSides = !s.drill.bothSides;
        db.ui.bothSides = bothSides;
        dbSave();
        commit(drillResetState({ ...s, drill: { ...s.drill, bothSides } }));
        announce(bothSides
          ? "Answering for both colours, from the start of the line."
          : "Answering for your own colour only, from the start of the line.");
      },
      restart() {
        const s = ref.current;
        if (s.mode !== "drill") return;
        commit(drillResetState(stopAutoplay(s)));
        announce("Drill started. Play the move on the board.");
      },
      cont() {
        const s = ref.current;
        if (s.drill.phase === "done") return;
        commit(advanceToAsk({
          ...s,
          selected: null,
          drill: { ...s.drill, verdict: "", tone: "", hint: 0, tries: 0, rejected: null },
        }));
      },
      hint() {
        const s = ref.current;
        const d = s.drill;
        if (s.mode !== "drill" || d.phase === "done" || d.hint >= 3) return;
        if (d.hint + 1 === 3) { a.show(); return; }
        commit({ ...s, drill: { ...d, hint: d.hint + 1, phase: "ask" } });
        announce(d.hint + 1 === 1 ? "Hint: which piece." : "Hint: the idea.");
      },
      show() {
        const s = ref.current;
        const answer = line.plies[s.ply + 1];
        if (!answer) return;
        const d = s.drill;
        const seen = { ...d.seen };
        if (seen[s.ply + 1] === undefined) seen[s.ply + 1] = "assisted";
        db.streak.cur = 0;
        commit({
          ...s, selected: null, ply: s.ply + 1,
          drill: { ...d, seen, streak: 0, phase: "reveal", hint: 0, tries: 0, verdict: "", tone: "flat", rejected: null },
        });
        announce("The move is " + answer.san + ".");
      },

      /* ---- deviations ---- */
      openPicker() {
        const s = ref.current;
        if (s.deviation) return;
        commit({ ...s, picking: !s.picking, selected: null });
      },
      cancelPicker() {
        commit({ ...ref.current, picking: false });
      },
      devList(): Branch[] {
        return devAt(ref.current.ply);
      },
      devEnter(idx: number, origin: "read" | "drill") {
        const s = ref.current;
        commit({ ...s, deviation: { fromPly: s.ply, idx, at: 0, origin }, picking: false, selected: null });
        const d = devAt(s.ply)[idx];
        if (d) announce(`${d.sev}. ${d.san}.`);
      },
      devExit() {
        const s = ref.current;
        const origin = s.deviation?.origin;
        let next: StudyState = { ...s, deviation: null, selected: null };
        if (origin === "drill" && s.mode === "drill") {
          next = { ...next, drill: { ...next.drill, phase: "ask", verdict: "", tone: "" } };
        }
        commit(next);
        announce("Back to the line.");
      },
      devAtSet(n: number) {
        const s = ref.current;
        if (s.deviation) commit({ ...s, deviation: { ...s.deviation, at: n } });
      },

      /* ---- board input (drill.js's attempt logic, verbatim in spirit) ---- */
      pick(sq: string) {
        const s = ref.current;
        let next = s;
        if (s.drill.rejected || s.drill.verdict) {
          next = { ...s, drill: { ...s.drill, rejected: null, verdict: "", tone: "" } };
        }
        if (next.selected === sq) { commit({ ...next, selected: null }); return; }
        if (next.selected) {
          const from = next.selected;
          commit({ ...next, selected: null });
          a.boardMove(from, sq);
          return;
        }
        const here = pliesOf(next)[indexOf(next)];
        if (!isOwnPiece(here.fen, sq, moverSide(line.plies, next.ply))) { commit(next); return; }
        commit({ ...next, selected: sq, drill: { ...next.drill, cursor: sq } });
      },

      boardMove(from: string, to: string) {
        const s = ref.current;
        if (s.picking || s.mode !== "drill") a.readModeTry(from, to);
        else a.drillTry(from, to);
      },

      readModeTry(from: string, to: string) {
        const s = ref.current;
        const here = line.plies[s.ply];
        [from, to] = normaliseMove(here.fen, from, to);

        const next = line.plies[s.ply + 1];
        if (next && next.from === from && next.to === to) {
          commit({
            ...s, selected: null, picking: false, ply: s.ply + 1,
            drill: { ...s.drill, verdict: "", tone: "", rejected: null },
          });
          announce(next.san + ".");
          return;
        }

        const hit = devAt(s.ply).findIndex((b) => {
          const first = b.plies[0];
          return first && first.from === from && first.to === to;
        });
        if (hit >= 0) {
          commit({ ...s, selected: null, drill: { ...s.drill, rejected: null } });
          a.devEnter(hit, "read");
          return;
        }

        const name = moveName(here.fen, from, to);
        const illegal = isLegalMove(here, from, to) === false;
        const verdict = illegal
          ? `<b>${name}</b> isn't a legal move in this position.`
          : `<b>${name}</b> isn't one I have notes on. `
            + (next ? `This line plays <b>${next.san}</b>. ` : "")
            + movePrinciple(here, from, to, s.ply);
        commit({
          ...s, selected: null, picking: false,
          drill: {
            ...s.drill, verdict, tone: illegal ? "bad" : "flat", verdictPly: s.ply,
            rejected: { from, to, kind: illegal ? "illegal" : "wrong" },
          },
        });
        announce(name + ".");
      },

      drillTry(from: string, to: string) {
        const s = ref.current;
        if (s.mode !== "drill" || s.drill.phase === "done") return;
        const here = line.plies[s.ply];
        const answer = line.plies[s.ply + 1];
        if (!answer) return;

        [from, to] = normaliseMove(here.fen, from, to);
        const d = s.drill;

        // Standing on an answered move with the reply still to come: playing it
        // is just a nicer way to press Continue — it neither scores nor breaks
        // a streak.
        const replying = !d.bothSides && (d.phase === "right" || d.phase === "reveal") && !!answer;
        if (replying) {
          if (from === answer.from && to === answer.to) {
            commit(advanceToAsk({
              ...s, ply: s.ply + 1, selected: null,
              drill: { ...d, rejected: null, verdict: "", tone: "", hint: 0, tries: 0 },
            }));
            announce(answer.num + ". Your move.");
            return;
          }
          commit({
            ...s, selected: null,
            drill: {
              ...d, tone: "flat", rejected: { from, to, kind: "wrong" },
              verdict: `<b>${moveName(here.fen, from, to)}</b> isn't the reply this line plays &mdash; it goes <b>${answer.san}</b>.`,
            },
          });
          announce("Not the reply. The line plays " + answer.san + ".");
          return;
        }

        if (from === answer.from && to === answer.to) {
          const clean = d.tries === 0 && d.hint === 0;
          const seen = { ...d.seen };
          if (seen[s.ply + 1] === undefined) seen[s.ply + 1] = clean ? "right" : "assisted";
          let streak = d.streak;
          if (clean) {
            streak += 1;
            if (streak > (db.streak.best | 0)) db.streak.best = streak;
          }
          db.streak.cur = streak;
          dbSave();
          commit({
            ...s, selected: null, ply: s.ply + 1,
            drill: { ...d, seen, streak, phase: "right", tries: 0, hint: 0, verdict: "", tone: "ok", rejected: null },
          });
          announce("Correct. " + answer.num + ".");
          return;
        }

        if (isLegalMove(here, from, to) === false) {
          commit({
            ...s, selected: null,
            drill: {
              ...d, phase: "wrong", tone: "bad",
              verdict: `<b>${moveName(here.fen, from, to)}</b> isn't a legal move here.`,
              rejected: { from, to, kind: "illegal" },
            },
          });
          announce("Not a legal move.");
          return;
        }

        // An authored deviation answers the move actually played — the whole point.
        const hit = devAt(s.ply).findIndex((b) => {
          const first = b.plies[0];
          return first && first.from === from && first.to === to;
        });
        if (hit >= 0) {
          const seen = { ...d.seen };
          if (seen[s.ply + 1] === undefined) seen[s.ply + 1] = "wrong";
          db.streak.cur = 0;
          dbSave();
          commit({ ...s, drill: { ...d, tries: d.tries + 1, streak: 0, seen } });
          a.devEnter(hit, "drill");
          return;
        }

        // Legal but not this line's move. Deliberately not an error.
        const name = moveName(here.fen, from, to);
        const level = feedbackLevel(line);
        const seen = { ...d.seen };
        if (seen[s.ply + 1] === undefined) seen[s.ply + 1] = "wrong";
        db.streak.cur = 0;
        dbSave();
        commit({
          ...s, selected: null,
          drill: {
            ...d, tries: d.tries + 1, streak: 0, seen, phase: "wrong",
            tone: level >= 1 ? "flat" : "warn",
            verdict: level >= 1
              ? `<b>${name}</b> is legal — it just isn't the move this line teaches. ${movePrinciple(here, from, to, s.ply)}`
              : `<b>${name}</b> is not the move this line plays. Try another, or take a hint.`,
            rejected: { from, to, kind: "wrong" },
          },
        });
        announce(name + ". Not this line's move.");
      },

      moveCursor(dcol: number, drow: number): boolean {
        const s = ref.current;
        const cur = s.drill.cursor;
        const file = FILES.indexOf(cur[0]) + (s.flipped ? -dcol : dcol);
        const rank = +cur[1] + (s.flipped ? -drow : drow);
        if (file < 0 || file > 7 || rank < 1 || rank > 8) return false;
        commit({ ...s, drill: { ...s.drill, cursor: FILES[file] + rank } });
        return true;
      },
    };
    return a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening, lineIndex]);

  /* Autoplay: an interval while the flag is up, cleaned on the way down. */
  useEffect(() => {
    if (!state.autoplay) return;
    const t = setInterval(() => {
      if (!actions.autoStep()) actions.toggleAutoplay();
    }, 1500);
    return () => clearInterval(t);
  }, [state.autoplay, actions]);

  return {
    state, line, side, sideColour, actions,
    plies: pliesOf(state),
    index: indexOf(state),
    current: pliesOf(state)[indexOf(state)] || pliesOf(state)[0],
    devList: devAt(state.ply),
    devCurrent: devCurrentIn(opening, line, state),
  };
}

/* ---- the cursor, deviation-aware (state.js's currentPlies/currentIndex),
   as module-level pure functions so they are unit-testable and cannot close
   over stale render values ---- */

/* The deviation sets are shared between every line that reaches the position,
   so the move THIS line plays is dropped: from here it is the main line. */
function devAtOf(opening: Opening, line: Line, ply: number): Branch[] {
  const sets = opening.branchsets;
  if (!sets) return [];
  const here = line.plies[ply];
  if (!here || here.bx === undefined) return [];
  const next = line.plies[ply + 1];
  return sets[here.bx].filter((b) => !next || b.san !== next.san);
}

function devCurrentIn(opening: Opening, line: Line, s: StudyState): Branch | null {
  return s.deviation ? devAtOf(opening, line, s.deviation.fromPly)[s.deviation.idx] || null : null;
}

function pliesIn(opening: Opening, line: Line, s: StudyState): Ply[] {
  const d = devCurrentIn(opening, line, s);
  return d ? d.plies : line.plies;
}

function indexIn(s: StudyState): number {
  return s.deviation ? s.deviation.at : s.ply;
}

function steppedIn(opening: Opening, line: Line, s: StudyState, d: number): StudyState | null {
  const n = indexIn(s) + d;
  if (n < 0 || n > pliesIn(opening, line, s).length - 1) return null;
  return s.deviation
    ? { ...s, deviation: { ...s.deviation, at: n } }
    : { ...s, ply: n };
}
