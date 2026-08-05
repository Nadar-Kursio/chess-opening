"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Branch, Line, Opening, Ply, Turn } from "@/lib/content/types";
import { announce } from "@/lib/announce";
import { isLegalMove, isOwnPiece, moveName, normaliseMove, FILES } from "@/lib/chess/read";
import { db, dbFlush, dbLineKey, dbSave, type NoteRecord } from "@/lib/db";
import { drillAskedCount, moverSide, movePrinciple, feedbackLevel } from "./drill";
import { noteKey, noteShown, noteText, noteIsLocal } from "./notes";

/* The study island's state machine, ported from state.js + drill.js +
   deviation.js + the read-mode half of render.js. One hook per mounted page;
   the URL owns which opening and line this is, so none of that lives here.

   The transitions mutate a draft copy of the state and commit once — the same
   shape as the original's "mutate `state`, then render()", which is what keeps
   this a line-by-line port instead of a reinvention. */

export interface Deviation { fromPly: number; idx: number; at: number; origin: "read" | "drill" }
export interface Rejected { from: string; to: string; kind: "wrong" | "illegal" }

/* The open note editor: a working copy of the note for the position it was
   opened on, so Cancel costs nothing. `key` is fixed at open — otherwise
   stepping forward mid-sentence would file the text against a position the
   writer never looked at. */
export interface NoteEditor {
  key: string;
  text: string;
  arrows: { f: string; t: string }[];
  spots: string[];
  tool: "arrow" | "spot" | null;
  /** The first square of a two-tap arrow, waiting for its second. */
  pendingFrom: string | null;
  focus: boolean;
}

/* A mark being dragged out — the rubber band on the canvas. */
export interface Drawing { from: string; to: string; id: number }

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
  note: NoteEditor | null;
  drawing: Drawing | null;
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
    note: null,
    drawing: null,
  }));

  const stateRef = useRef(state);
  stateRef.current = state;

  /* Thin bindings over the module-level cursor helpers below, so nothing in
     `actions` closes over a per-render value — the memo freezes first-render
     closures, and only bindings that reach state through `stateRef.current` (or
     per-mount-stable props) are safe inside it. */
  const devsAt = (ply: number) => devsAtIn(opening, line, ply);
  const currentPlies = (s: StudyState) => currentPliesIn(opening, line, s);
  const currentIndex = (s: StudyState) => currentIndexIn(s);
  const steppedBy = (s: StudyState, delta: number) => steppedByIn(opening, line, s, delta);

  /* ---- transitions; each builds the next state and commits once ---- */

  /* The write, with no commit in it, so mid-transition callers can use it.
     An empty note is not a note: saving one is how you delete it. */
  const noteStore = (n: NoteEditor): boolean => {
    const text = n.text.trim();
    const keep = !!(text || n.arrows.length || n.spots.length);
    if (keep) {
      const rec: NoteRecord = {};
      if (text) rec.text = text;
      if (n.arrows.length) rec.arrows = n.arrows;
      if (n.spots.length) rec.spots = n.spots;
      db.notes[n.key] = rec;
    } else {
      delete db.notes[n.key];
    }
    dbSave();
    dbFlush();
    return keep;
  };

  const commit = (next: StudyState) => {
    /* The editor belongs to the position it was opened on, and every way of
       leaving a position comes through here — an arrow key, the move list,
       a deviation, the Notes layer switched off. What was typed is kept, not
       dropped: navigating away is not a decision to throw work out. */
    if (next.note && (!next.mine
        || next.note.key !== noteKey(currentPliesIn(opening, line, next)[currentIndexIn(next)]))) {
      noteStore(next.note);
      next = { ...next, note: null, drawing: null };
    }
    stateRef.current = next;
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
    const actions = {
      jump(n: number) {
        const s = stopAutoplay(stateRef.current);
        commit(s.deviation ? { ...s, deviation: { ...s.deviation, at: n } } : { ...s, ply: n });
      },
      /* The move tape names a LINE ply, so a tap there leaves any deviation —
         the old app's behaviour — rather than writing a line index into the
         branch cursor, whose plies it may overrun. */
      jumpLine(n: number) {
        const s = stopAutoplay(stateRef.current);
        commit({ ...s, deviation: null, picking: false, ply: n });
      },
      step(delta: number): boolean {
        const s = stopAutoplay(stateRef.current);
        const next = steppedBy(s, delta);
        commit(next || s);
        return !!next;
      },
      /* Not stopAutoplay: the autoplay interval itself steps through here. */
      autoStep(): boolean {
        const next = steppedBy(stateRef.current, 1);
        if (next) commit(next);
        return !!next;
      },
      toEnd() {
        const s = stopAutoplay(stateRef.current);
        actions.jump(currentPlies(s).length - 1);
      },
      toggleAutoplay() {
        const s = stateRef.current;
        commit({ ...s, autoplay: !s.autoplay });
      },
      flip() {
        const s = stateRef.current;
        commit({ ...s, flipped: !s.flipped });
      },
      toggleArrows() {
        const s = stateRef.current;
        db.ui.arrows = !s.arrows;
        dbSave();
        commit({ ...s, arrows: !s.arrows });
      },
      toggleMine() {
        const s = stateRef.current;
        db.ui.mine = !s.mine;
        dbSave();
        commit({ ...s, mine: !s.mine });
      },
      toggleVars() {
        const s = stateRef.current;
        commit({ ...s, varsOpen: !s.varsOpen });
      },
      restorePrefs() {
        const s = stateRef.current;
        commit({
          ...s,
          arrows: typeof db.ui.arrows === "boolean" ? db.ui.arrows : s.arrows,
          mine: typeof db.ui.mine === "boolean" ? db.ui.mine : s.mine,
          drill: { ...s.drill, bothSides: !!db.ui.bothSides },
        });
      },

      setMode(mode: "read" | "drill") {
        const s = stopAutoplay(stateRef.current);
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
        const s = stateRef.current;
        const bothSides = !s.drill.bothSides;
        db.ui.bothSides = bothSides;
        dbSave();
        commit(drillResetState({ ...s, drill: { ...s.drill, bothSides } }));
        announce(bothSides
          ? "Answering for both colours, from the start of the line."
          : "Answering for your own colour only, from the start of the line.");
      },
      restart() {
        const s = stateRef.current;
        if (s.mode !== "drill") return;
        commit(drillResetState(stopAutoplay(s)));
        announce("Drill started. Play the move on the board.");
      },
      continueLine() {
        const s = stateRef.current;
        if (s.drill.phase === "done") return;
        commit(advanceToAsk({
          ...s,
          selected: null,
          drill: { ...s.drill, verdict: "", tone: "", hint: 0, tries: 0, rejected: null },
        }));
      },
      hint() {
        const s = stateRef.current;
        const d = s.drill;
        if (s.mode !== "drill" || d.phase === "done" || d.hint >= 3) return;
        if (d.hint + 1 === 3) { actions.show(); return; }
        commit({ ...s, drill: { ...d, hint: d.hint + 1, phase: "ask" } });
        announce(d.hint + 1 === 1 ? "Hint: which piece." : "Hint: the idea.");
      },
      show() {
        const s = stateRef.current;
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
        const s = stateRef.current;
        if (s.deviation) return;
        commit({ ...s, picking: !s.picking, selected: null });
      },
      cancelPicker() {
        commit({ ...stateRef.current, picking: false });
      },
      devList(): Branch[] {
        return devsAt(stateRef.current.ply);
      },
      devEnter(idx: number, origin: "read" | "drill") {
        const s = stateRef.current;
        commit({ ...s, deviation: { fromPly: s.ply, idx, at: 0, origin }, picking: false, selected: null });
        const d = devsAt(s.ply)[idx];
        if (d) announce(`${d.sev}. ${d.san}.`);
      },
      devExit() {
        const s = stateRef.current;
        const origin = s.deviation?.origin;
        let next: StudyState = { ...s, deviation: null, selected: null };
        if (origin === "drill" && s.mode === "drill") {
          next = { ...next, drill: { ...next.drill, phase: "ask", verdict: "", tone: "" } };
        }
        commit(next);
        announce("Back to the line.");
      },
      devAtSet(n: number) {
        const s = stateRef.current;
        if (s.deviation) commit({ ...s, deviation: { ...s.deviation, at: n } });
      },

      /* ---- board input (drill.js's attempt logic, verbatim in spirit) ---- */
      pick(sq: string) {
        const s = stateRef.current;
        let next = s;
        if (s.drill.rejected || s.drill.verdict) {
          next = { ...s, drill: { ...s.drill, rejected: null, verdict: "", tone: "" } };
        }
        if (next.selected === sq) { commit({ ...next, selected: null }); return; }
        if (next.selected) {
          const from = next.selected;
          commit({ ...next, selected: null });
          actions.boardMove(from, sq);
          return;
        }
        const here = currentPlies(next)[currentIndex(next)];
        if (!isOwnPiece(here.fen, sq, moverSide(line.plies, next.ply))) { commit(next); return; }
        commit({ ...next, selected: sq, drill: { ...next.drill, cursor: sq } });
      },

      boardMove(from: string, to: string) {
        const s = stateRef.current;
        if (s.picking || s.mode !== "drill") actions.readModeTry(from, to);
        else actions.drillTry(from, to);
      },

      readModeTry(from: string, to: string) {
        const s = stateRef.current;
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

        const hit = devsAt(s.ply).findIndex((b) => {
          const first = b.plies[0];
          return first && first.from === from && first.to === to;
        });
        if (hit >= 0) {
          commit({ ...s, selected: null, drill: { ...s.drill, rejected: null } });
          actions.devEnter(hit, "read");
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
        const s = stateRef.current;
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
        const hit = devsAt(s.ply).findIndex((b) => {
          const first = b.plies[0];
          return first && first.from === from && first.to === to;
        });
        if (hit >= 0) {
          const seen = { ...d.seen };
          if (seen[s.ply + 1] === undefined) seen[s.ply + 1] = "wrong";
          db.streak.cur = 0;
          dbSave();
          commit({ ...s, drill: { ...d, tries: d.tries + 1, streak: 0, seen } });
          actions.devEnter(hit, "drill");
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

      /* ---- your own note on this position ---- */
      noteEdit() {
        const s = stateRef.current;
        if (s.note) return;
        commit({ ...s, note: noteBeginFrom(opening, line, s, true) });
      },
      noteCancel() {
        commit({ ...stateRef.current, note: null, drawing: null });
      },
      noteSave() {
        const s = stateRef.current;
        if (!s.note) return;
        const keep = noteStore(s.note);
        commit({ ...s, note: null, drawing: null });
        announce(keep ? "Note saved." : "Note removed.");
      },
      /* Nothing in a browser can edit a file, so Delete only drops the copy
         saved here — the shipped note, if there was one, comes straight back. */
      noteDelete() {
        const s = stateRef.current;
        if (!s.note) return;
        delete db.notes[s.note.key];
        dbSave();
        dbFlush();
        commit({ ...s, note: null, drawing: null });
        announce("Note removed.");
      },
      noteSetText(text: string) {
        const s = stateRef.current;
        if (s.note) commit({ ...s, note: { ...s.note, text } });
      },
      noteSetTool(tool: "arrow" | "spot") {
        const s = stateRef.current;
        if (!s.note) return;
        commit({ ...s, note: { ...s.note, tool: s.note.tool === tool ? null : tool, pendingFrom: null } });
      },
      noteRemoveMark(i: number) {
        const s = stateRef.current;
        if (!s.note) return;
        const arrows = [...s.note.arrows];
        const spots = [...s.note.spots];
        if (i < arrows.length) arrows.splice(i, 1);
        else spots.splice(i - arrows.length, 1);
        commit({ ...s, note: { ...s.note, arrows, spots } });
      },
      /* The two-tap tools: the same marks without a drag, for a finger and for
         anyone who would rather press a button than know a gesture. */
      noteTapSquare(sq: string) {
        const s = stateRef.current;
        const n = s.note;
        if (!n) return;
        if (n.tool === "spot") {
          commit({ ...s, note: { ...n, spots: toggleSpot(n.spots, sq), tool: null } });
          return;
        }
        if (!n.pendingFrom) {
          commit({ ...s, note: { ...n, pendingFrom: sq } });
          return;
        }
        const from = n.pendingFrom;
        commit({ ...s, note: { ...n, pendingFrom: null, tool: null, arrows: toggleArrow(n.arrows, from, sq) } });
      },
      /* ---- drawing: right-drag on a mouse, hold-to-draw on touch ---- */
      noteStartDraw(sq: string, id: number) {
        const s = stateRef.current;
        const note = s.note || noteBeginFrom(opening, line, s, false);
        commit({ ...s, note, drawing: { from: sq, to: sq, id }, selected: null });
      },
      noteDrawTo(sq: string, id: number) {
        const s = stateRef.current;
        if (s.drawing && s.drawing.id === id && s.drawing.to !== sq) {
          commit({ ...s, drawing: { ...s.drawing, to: sq } });
        }
      },
      /* A press that never left its square is a circle; one that travelled is
         an arrow. */
      noteEndDraw(sq: string | null, id: number) {
        const s = stateRef.current;
        const d = s.drawing;
        if (!d || d.id !== id || !s.note) return;
        const to = sq || d.from;
        const n = s.note;
        const note = to === d.from
          ? { ...n, spots: toggleSpot(n.spots, d.from) }
          : { ...n, arrows: toggleArrow(n.arrows, d.from, to) };
        commit({ ...s, drawing: null, note });
      },
      /* A drag the browser takes away — a phone call, a gesture the OS claims —
         must not leave a rubber band with nothing holding it. */
      noteAbortDraw(id: number) {
        const s = stateRef.current;
        if (s.drawing && s.drawing.id === id) commit({ ...s, drawing: null });
      },

      moveCursor(dcol: number, drow: number): boolean {
        const s = stateRef.current;
        const cur = s.drill.cursor;
        const file = FILES.indexOf(cur[0]) + (s.flipped ? -dcol : dcol);
        const rank = +cur[1] + (s.flipped ? -drow : drow);
        if (file < 0 || file > 7 || rank < 1 || rank > 8) return false;
        commit({ ...s, drill: { ...s.drill, cursor: FILES[file] + rank } });
        return true;
      },
    };
    return actions;
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
    plies: currentPlies(state),
    index: currentIndex(state),
    current: currentPlies(state)[currentIndex(state)] || currentPlies(state)[0],
    devList: devsAt(state.ply),
    devCurrent: devCurrentIn(opening, line, state),
  };
}

/* ---- the cursor, deviation-aware (state.js's currentPlies/currentIndex),
   as module-level pure functions so they are unit-testable and cannot close
   over stale render values ---- */

/* The deviation sets are shared between every line that reaches the position,
   so the move THIS line plays is dropped: from here it is the main line. */
function devsAtIn(opening: Opening, line: Line, ply: number): Branch[] {
  const sets = opening.branchsets;
  if (!sets) return [];
  const here = line.plies[ply];
  if (!here || here.bx === undefined) return [];
  const next = line.plies[ply + 1];
  return sets[here.bx].filter((b) => !next || b.san !== next.san);
}

function devCurrentIn(opening: Opening, line: Line, s: StudyState): Branch | null {
  return s.deviation ? devsAtIn(opening, line, s.deviation.fromPly)[s.deviation.idx] || null : null;
}

function currentPliesIn(opening: Opening, line: Line, s: StudyState): Ply[] {
  const d = devCurrentIn(opening, line, s);
  return d ? d.plies : line.plies;
}

function currentIndexIn(s: StudyState): number {
  return s.deviation ? s.deviation.at : s.ply;
}

function steppedByIn(opening: Opening, line: Line, s: StudyState, delta: number): StudyState | null {
  const n = currentIndexIn(s) + delta;
  if (n < 0 || n > currentPliesIn(opening, line, s).length - 1) return null;
  return s.deviation
    ? { ...s, deviation: { ...s.deviation, at: n } }
    : { ...s, ply: n };
}

/* Drawing the same mark twice takes it away — the only undo a drag gesture
   can have that does not need a button. */
function toggleArrow(arrows: { f: string; t: string }[], f: string, t: string) {
  if (f === t) return arrows;
  const at = arrows.findIndex((a) => a.f === f && a.t === t);
  return at >= 0 ? arrows.filter((_, i) => i !== at) : [...arrows, { f, t }];
}

function toggleSpot(spots: string[], sq: string) {
  return spots.includes(sq) ? spots.filter((s) => s !== sq) : [...spots, sq];
}

/* A working copy seeded from whatever note the position shows — the shipped
   file note included, so editing it starts from its text and marks. */
function noteBeginFrom(opening: Opening, line: Line, s: StudyState, focus: boolean): NoteEditor {
  const ply = currentPliesIn(opening, line, s)[currentIndexIn(s)];
  const seed = noteShown(ply);
  return {
    key: noteKey(ply),
    text: seed ? noteText(seed, noteIsLocal(ply)) : "",
    arrows: (seed?.arrows || []).map((a) => ({ f: a.f, t: a.t })),
    spots: (seed?.spots || []).slice(),
    tool: null,
    pendingFrom: null,
    focus,
  };
}
