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

  const stateRef = useRef(state);
  stateRef.current = state;
  /* A live piece drag: the glyph follows the pointer (imperative style — no
     commits mid-drag, so nothing re-renders under the hand), and the square
     it hovers wears the drag-over ring. */
  const dragRef = useRef<{
    from: string; id: number; piece: HTMLElement | null;
    cx: number; cy: number; moved: boolean; over: HTMLElement | null;
  } | null>(null);
  /* False for exactly the render after a drag-drop: the hand carried the
     piece, so it must not glide in a second time. */
  const slideRef = useRef(true);
  /* A finger holding still on a square is what it has instead of a right
     button: long enough that neither a tap nor a piece-drag arms it by
     accident, cancelled by travel, superseded by any new press. */
  const holdRef = useRef<{ id: number; from: string; x: number; y: number; timer: number } | null>(null);
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
     answers — boardLive() from drill.js. A two-tap mark tool owns the taps
     while it is armed; an open editor otherwise leaves the board alone. */
  const live =
    !inDeviation &&
    !state.note?.tool &&
    (state.picking ||
      !drillOn ||
      ["ask", "wrong", "right", "reveal"].includes(state.drill.phase));

  /* Nothing draws while the Notes layer is off — a gesture that made a mark
     you could not see would be a page that changed its mind about a press. */
  const canDraw = state.mine && !hidesOverlays;

  useEffect(() => { slideRef.current = true; });

  useEffect(() => {
    setMounted(true);
    document.documentElement.dataset.hydrated = "1";
    actions.restorePrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Once a mark is being dragged out the page must not scroll under it, and
     only a non-passive touchmove can still say no mid-gesture. */
  useEffect(() => {
    if (!state.drawing) return;
    const stop = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", stop, { passive: false });
    return () => document.removeEventListener("touchmove", stop);
  }, [state.drawing]);

  /* A press followed by navigation inside the hold window must not fire the
     timer into an unmounted island. */
  useEffect(() => () => {
    if (holdRef.current) clearTimeout(holdRef.current.timer);
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
      const s = stateRef.current;
      const k = e.key;

      if (!(e.metaKey || e.ctrlKey || e.altKey)) {
        // Escape unwinds one layer at a time, innermost first.
        if (k === "Escape") {
          if (s.note) { actions.noteCancel(); e.preventDefault(); return; }
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
              actions.continueLine(); e.preventDefault(); return;
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
                      `[data-sq="${stateRef.current.drill.cursor}"]`
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

  /* ---- pointer input, delegated exactly as drill.js + notepad.js did ---- */
  const squareAt = (e: React.PointerEvent): string | null => {
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const cell = under && under.closest ? under.closest<HTMLElement>("[data-sq]") : null;
    return cell ? cell.dataset.sq! : null;
  };

  const holdCancel = () => {
    if (holdRef.current) {
      clearTimeout(holdRef.current.timer);
      holdRef.current = null;
    }
  };

  const dragVisualReset = () => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.piece) {
      drag.piece.style.transform = "";
      drag.piece.style.zIndex = "";
      drag.piece.style.pointerEvents = "";
    }
    drag.over?.classList.remove("drag-over");
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-sq]");
    if (!cell) return;
    const sq = cell.dataset.sq!;
    // Any new press supersedes a hold still counting down — a timer that
    // fires later would start drawing from a square nobody is touching.
    holdCancel();

    /* Drawing is the right button, and only the right button: a left-drag
       means "play this move". The exception is an armed two-tap tool, which
       is what buys a plain tap its new meaning. */
    const drawGesture = canDraw && (e.button === 2 || (e.button === 0 && !!stateRef.current.note?.tool));
    if (drawGesture) {
      e.preventDefault();
      if (stateRef.current.note?.tool) { actions.noteTapSquare(sq); return; }
      dragVisualReset();
      dragRef.current = null;
      actions.noteStartDraw(sq, e.pointerId);
      try { cell.setPointerCapture(e.pointerId); } catch {}
      return;
    }

    /* Not on a mouse: there the right button is right there, and a slow left
       press should stay a slow left press. */
    if (e.button === 0 && e.pointerType !== "mouse" && canDraw) {
      holdRef.current = {
        id: e.pointerId, from: sq, x: e.clientX, y: e.clientY,
        timer: window.setTimeout(() => {
          const hold = holdRef.current;
          holdRef.current = null;
          if (!hold) return;
          // The hold has won the pointer: a piece picked up on the way is dropped.
          dragVisualReset();
          dragRef.current = null;
          actions.noteStartDraw(hold.from, hold.id);
          try {
            boardEl()?.querySelector<HTMLElement>(`[data-sq="${hold.from}"]`)
              ?.setPointerCapture(hold.id);
          } catch {}
        }, 420),
      };
    }

    if (e.button !== 0) return;
    if (!live) return;
    const s = stateRef.current;
    const here = line.plies[s.ply];
    e.preventDefault();
    if (!s.selected && isOwnPiece(here.fen, sq, moverSide(line.plies, s.ply))) {
      const rect = cell.getBoundingClientRect();
      dragRef.current = {
        from: sq, id: e.pointerId,
        piece: cell.querySelector<HTMLElement>(".piece"),
        cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2,
        moved: false, over: null,
      };
      try { cell.setPointerCapture(e.pointerId); } catch {}
    }
    actions.pick(sq);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const hold = holdRef.current;
    if (hold && hold.id === e.pointerId
        && (Math.abs(e.clientX - hold.x) > 10 || Math.abs(e.clientY - hold.y) > 10)) {
      holdCancel(); // travel means a piece-drag, not a hold
    }
    if (stateRef.current.drawing?.id === e.pointerId) {
      const sq = squareAt(e);
      if (sq) actions.noteDrawTo(sq, e.pointerId);
    }

    /* The picked-up piece follows the hand, chess.com style. */
    const drag = dragRef.current;
    if (drag && drag.id === e.pointerId && drag.piece) {
      const dx = e.clientX - drag.cx;
      const dy = e.clientY - drag.cy;
      if (!drag.moved && Math.hypot(dx, dy) > 4) {
        drag.moved = true;
        drag.piece.style.zIndex = "6"; // above the arrows canvas
        drag.piece.style.pointerEvents = "none"; // the drop square must be hittable
      }
      if (drag.moved) {
        drag.piece.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const overCell = under && under.closest ? under.closest<HTMLElement>("[data-sq]") : null;
        if (overCell !== drag.over) {
          drag.over?.classList.remove("drag-over");
          if (overCell) overCell.classList.add("drag-over");
          drag.over = overCell;
        }
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    holdCancel();
    if (stateRef.current.drawing?.id === e.pointerId) {
      actions.noteEndDraw(squareAt(e), e.pointerId);
      return;
    }
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    dragVisualReset();
    dragRef.current = null;
    const drop = squareAt(e);
    // No square, or the piece's own: it snaps back and stays picked up.
    if (!drop || drop === drag.from) return;
    if (drag.moved) slideRef.current = false; // the hand already carried it
    actions.boardMove(drag.from, drop);
  };

  const onPointerCancel = (e: React.PointerEvent) => {
    holdCancel();
    dragVisualReset();
    dragRef.current = null;
    actions.noteAbortDraw(e.pointerId);
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
  /* While the editor is open it is the WORKING COPY that draws, so a mark
     appears under the pointer and disappears again on Cancel. */
  const marksShown = state.note
    ? { arrows: state.note.arrows, spots: state.note.spots }
    : note;

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
      onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
      onContextMenu={(e) => {
        // The right button draws here; the browser menu would eat the gesture.
        if ((e.target as HTMLElement).closest("[data-sq]")) e.preventDefault();
      }}>
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
        animate={slideRef.current}
        mine={marksShown}
        drawing={state.drawing}
        pendingFrom={state.note?.pendingFrom ?? null}
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
          onJump={actions.jumpLine}
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
            onContinue={actions.continueLine}
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
        <NoteCard
          note={note}
          local={noteLocal}
          show={state.mine && !hidesOverlays}
          editor={state.note}
          onEdit={actions.noteEdit}
          onSave={actions.noteSave}
          onCancel={actions.noteCancel}
          onDelete={actions.noteDelete}
          onText={actions.noteSetText}
          onTool={actions.noteSetTool}
          onRemoveMark={actions.noteRemoveMark}
        />
        {!inDeviation && !drillOn && index >= plies.length - 1 ? (
          <PlanFor op={opening} line={line} structures={catalog.structures} />
        ) : null}
      </div>
    </section>
  );
}
