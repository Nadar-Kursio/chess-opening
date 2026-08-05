"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Catalog, Opening } from "@/lib/content/types";
import { dbRevision, dbServerRevision, dbSubscribe } from "@/lib/db";
import { isOwnPiece, legalTargets } from "@/lib/chess/read";
import { moverSide } from "@/lib/study/drill";
import { noteIsLocal, noteShown } from "@/lib/study/notes";
import { useStudy } from "@/lib/study/useStudy";
import ModeBar from "./ModeBar";
import BoardColumn from "./BoardColumn";
import Variations from "./Variations";
import { RecordBar, Scoresheet } from "./Scoresheet";
import { CoachNote, Verdict } from "./Coach";
import NoteCard from "./NoteCard";
import DrillPanel from "./DrillPanel";
import { DevPanel, DevPicker } from "./Deviation";
import { PlanFor } from "./PlanCard";

/* The interactive island — the one piece of the page that ships JavaScript.
   Everything around it (theory, learning path, page head) is server-rendered.
   This component owns the same surface studyHTML owned: mode bar, board
   column, and the notes column. */

interface Props {
  opening: Opening;
  lineIndex: number;
  catalog: Catalog;
}

export default function StudyPanel({ opening, lineIndex, catalog }: Props) {
  const { state, line, side, actions, plies, index, current, devList, devCurrent } =
    useStudy(opening, lineIndex);

  const sref = useRef(state);
  sref.current = state;
  const dragRef = useRef<{ from: string; id: number } | null>(null);
  /* Board lookups stay inside this island — a second board elsewhere on a
     future page must never catch this panel's queries. */
  const rootRef = useRef<HTMLElement>(null);
  const boardEl = () => rootRef.current?.querySelector<HTMLElement>(".board") ?? null;

  useSyncExternalStore(dbSubscribe, dbRevision, dbServerRevision);
  const [mounted, setMounted] = useState(false);

  const inDeviation = !!state.deviation;
  const drillOn = state.mode === "drill";
  const drillAsking = drillOn && state.drill.phase === "ask" && !inDeviation;
  const hidesOverlays = drillOn && state.drill.phase === "ask";

  /* The board takes moves in three situations, and they want different
     answers — boardLive() from drill.js, minus the views this port skips. */
  const live =
    !inDeviation &&
    (state.picking ||
      !drillOn ||
      ["ask", "wrong", "right", "reveal"].includes(state.drill.phase));

  useEffect(() => {
    setMounted(true);
    document.documentElement.dataset.hydrated = "1";
    actions.restorePrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* A deliberate test seam: the artifact smoke drives the island through this
     handle, the way the old harness reached the globals. */
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__lab = {
      opening: opening.id,
      line: line.slug,
      state,
      actions,
      plies,
      index,
    };
  });

  /* ---- keyboard, ported from drillKey + the page-level handler ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const s = sref.current;
      const k = e.key;

      if (!(e.metaKey || e.ctrlKey || e.altKey)) {
        // Escape unwinds one layer at a time, innermost first.
        if (k === "Escape") {
          if (s.selected) { actions.pick(s.selected); e.preventDefault(); return; }
          if (s.picking) { actions.cancelPicker(); e.preventDefault(); return; }
          if (s.deviation) { actions.devExit(); e.preventDefault(); return; }
          return;
        }
        if ((k === "d" || k === "D") && !s.deviation) { actions.openPicker(); e.preventDefault(); return; }
        if (!s.deviation) {
          if (k === "m" || k === "M") {
            actions.setMode(s.mode === "drill" ? "read" : "drill");
            e.preventDefault();
            return;
          }
          if (s.mode === "drill") {
            if (k === "h" || k === "H") { actions.hint(); e.preventDefault(); return; }
            if (k === "s" || k === "S") { actions.show(); e.preventDefault(); return; }
            if (k === "r" || k === "R") { actions.restart(); e.preventDefault(); return; }
            if ((k === "Enter" || k === " ") && (s.drill.phase === "right" || s.drill.phase === "reveal")) {
              actions.cont(); e.preventDefault(); return;
            }
            const board = boardEl();
            const onBoard = board && board.contains(document.activeElement);
            if (onBoard) {
              if (k === "Enter" || k === " ") { actions.pick(s.drill.cursor); e.preventDefault(); return; }
              const delta = (
                { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] } as
                Record<string, [number, number]>
              )[k];
              if (delta) {
                if (actions.moveCursor(delta[0], delta[1])) {
                  requestAnimationFrame(() => {
                    boardEl()?.querySelector<HTMLElement>(
                      `[data-sq="${sref.current.drill.cursor}"]`
                    )?.focus();
                  });
                }
                e.preventDefault();
                return;
              }
              return;
            }
            // Never reveal the answer by stepping.
            if (s.drill.phase === "ask" && (k === "ArrowRight" || k === "End")) {
              e.preventDefault();
              return;
            }
          }
        }
      }

      // The page-level transport keys; step/jump are deviation-aware.
      if (k === "ArrowRight") { actions.step(1); e.preventDefault(); }
      else if (k === "ArrowLeft") { actions.step(-1); e.preventDefault(); }
      else if (k === "Home") { actions.jump(0); e.preventDefault(); }
      else if (k === "End") { actions.toEnd(); e.preventDefault(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [actions]);

  /* ---- pointer input, delegated exactly as drill.js delegated it ---- */
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (!live) return;
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-sq]");
    if (!cell) return;
    const sq = cell.dataset.sq!;
    const s = sref.current;
    const here = opening.lines[lineIndex].plies[s.ply];
    e.preventDefault();
    if (!s.selected && isOwnPiece(here.fen, sq, moverSide(line.plies, s.ply))) {
      dragRef.current = { from: sq, id: e.pointerId };
      try { cell.setPointerCapture(e.pointerId); } catch {}
    }
    actions.pick(sq);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    dragRef.current = null;
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const drop = under && under.closest ? under.closest<HTMLElement>("[data-sq]") : null;
    if (!drop || drop.dataset.sq === drag.from) return; // a click, not a drag
    actions.boardMove(drag.from, drop.dataset.sq!);
  };

  const here = line.plies[state.ply];
  /* Where the picked-up piece may go — the engine's list, every position,
     both modes. Blocked and illegal squares are simply not in it. */
  const targets = state.selected && live ? legalTargets(here, state.selected) : [];
  const grabSide = live ? moverSide(line.plies, state.ply) : null;
  /* One source for the note on this position: a browser-saved note shadows the
     shipped file note. Before mount only the file note exists, so the server
     render is deterministic. */
  const note = mounted ? noteShown(current) : current.mine || null;
  const noteLocal = mounted ? noteIsLocal(current) : false;

  const readout = inDeviation ? (
    <>Deviation &mdash; <b>{index + 1}</b> of {plies.length}</>
  ) : (
    <>Move <b>{state.ply}</b> of {line.plies.length - 1} &middot; {state.flipped ? "Black" : "White"} up</>
  );

  const hint = drillOn ? (
    <>Tap a piece then its square, or drag it. <b>H</b> hint · <b>S</b> show · <b>M</b> read</>
  ) : (
    <>Play a move on the board and I&rsquo;ll answer it. <b>←</b> <b>→</b> to step.</>
  );

  return (
    <section className="study" id={`moves-${opening.id}`} ref={rootRef}
      onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <ModeBar
        line={line}
        mode={state.mode}
        bothSides={state.drill.bothSides}
        picking={state.picking}
        inDeviation={inDeviation}
        onMode={actions.setMode}
        onBothSides={actions.toggleBothSides}
        onDeviate={actions.openPicker}
      />

      <BoardColumn
        ply={current}
        index={index}
        total={plies.length - 1}
        locked={drillAsking}
        flipped={state.flipped}
        autoplay={state.autoplay}
        canPlay={!drillOn && !inDeviation}
        arrowsOn={state.arrows}
        mineOn={state.mine}
        hidesOverlays={hidesOverlays}
        live={live}
        gridNav={live && drillOn}
        grabSide={grabSide}
        selected={state.selected}
        cursor={state.drill.cursor}
        targets={targets}
        rejected={drillOn || state.drill.verdictPly === state.ply ? state.drill.rejected : null}
        mine={note}
        depth={catalog.engine.depth}
        readout={readout}
        hint={hint}
        onFirst={() => actions.jump(0)}
        onPrev={() => actions.step(-1)}
        onNext={() => actions.step(1)}
        onLast={actions.toEnd}
        onFlip={actions.flip}
        onArrows={actions.toggleArrows}
        onMine={actions.toggleMine}
        onPlay={actions.toggleAutoplay}
      />

      <div className="study__notes">
        <Variations
          opening={opening}
          lineIndex={lineIndex}
          varsOpen={state.varsOpen}
          mounted={mounted}
          onToggle={actions.toggleVars}
        />
        <RecordBar line={line} drill={drillOn} />
        <Scoresheet
          line={line}
          ply={state.ply}
          hide={drillOn}
          muted={inDeviation}
          onJump={actions.jump}
        />
        {state.picking ? (
          <DevPicker
            list={devList}
            line={line}
            ply={state.ply}
            onPick={(i) => actions.devEnter(i, state.mode === "drill" ? "drill" : "read")}
            onCancel={actions.cancelPicker}
          />
        ) : null}
        {inDeviation && devCurrent && state.deviation ? (
          <DevPanel
            branch={devCurrent}
            deviation={state.deviation}
            line={line}
            catalog={catalog}
            onExit={actions.devExit}
            onPrev={() => actions.step(-1)}
            onNext={() => actions.step(1)}
            onAt={actions.devAtSet}
          />
        ) : drillOn ? (
          <DrillPanel
            opening={opening}
            line={line}
            drill={state.drill}
            ply={state.ply}
            side={side}
            structures={catalog.structures}
            onHint={actions.hint}
            onShow={actions.show}
            onRestart={actions.restart}
            onContinue={actions.cont}
            onRead={() => actions.setMode("read")}
          />
        ) : (
          <>
            {state.drill.verdict && state.drill.verdictPly === state.ply ? (
              <Verdict verdict={state.drill.verdict} tone={state.drill.tone} framed />
            ) : null}
            <CoachNote ply={current} index={index} prev={index > 0 ? plies[index - 1] : null} />
          </>
        )}
        <NoteCard note={note} local={noteLocal} show={state.mine && !hidesOverlays && !drillOn} />
        {!inDeviation && !drillOn && index >= plies.length - 1 ? (
          <PlanFor op={opening} line={line} structures={catalog.structures} />
        ) : null}
      </div>
    </section>
  );
}
