"use client";

import type { Line, Opening, Ply } from "@/lib/content/types";
import type { DrillState } from "@/lib/study/useStudy";
import { pieceAt, pieceName } from "@/lib/chess/read";
import { drillAskedCount, drillRedact, moverSide } from "@/lib/study/drill";
import { TacticsLine, Verdict } from "./Coach";
import { PlanFor } from "./PlanCard";

/* The drill's coach card, from drill.js's drillPanelHTML — score, hint ladder,
   verdicts, and the plan card when the line is done. */

interface Props {
  opening: Opening;
  line: Line;
  drill: DrillState;
  ply: number;
  side: "w" | "b";
  structures: { id: string; name: string }[];
  onHint: () => void;
  onShow: () => void;
  onRestart: () => void;
  onContinue: () => void;
  onRead: () => void;
}

function Score({ line, drill, side, ply }: { line: Line; drill: DrillState; side: "w" | "b"; ply: number }) {
  const asked = drillAskedCount(line, side, drill.bothSides);
  const done = Object.keys(drill.seen).length;
  const right = Object.values(drill.seen).filter((v) => v === "right").length;
  const pct = asked ? Math.round((100 * done) / asked) : 0;
  return (
    <>
      <div className="coach__score">
        <span className="coach__turn">
          {drill.phase === "done"
            ? "Line complete"
            : <>Your move &mdash; <b>{moverSide(line.plies, ply) === "w" ? "White" : "Black"}</b></>}
        </span>
        <span className="coach__tally">
          <b>{right}</b> of <b>{asked}</b> first try <span className="sep">·</span> streak <b>{drill.streak}</b>
        </span>
      </div>
      <div className="coach__progress" role="progressbar" aria-valuenow={done}
        aria-valuemin={0} aria-valuemax={asked}>
        <i style={{ width: `${pct}%` }}></i>
      </div>
    </>
  );
}

export default function DrillPanel({
  opening, line, drill, ply, side, structures, onHint, onShow, onRestart, onContinue, onRead,
}: Props) {
  const played = line.plies[ply];
  const answer: Ply | null = line.plies[ply + 1] || null;

  if (drill.phase === "done") {
    const asked = drillAskedCount(line, side, drill.bothSides);
    const right = Object.values(drill.seen).filter((v) => v === "right").length;
    return (
      <>
        <article className="coach" data-tone="ok">
          <Score line={line} drill={drill} side={side} ply={ply} />
          <p className="coach__prompt">You played {right} of {asked} first time.</p>
          <div className="coach__actions">
            <button className="btn btn--primary" onClick={onRestart}>Drill again<kbd>R</kbd></button>
            <button className="btn" onClick={onRead}>Read this line</button>
          </div>
        </article>
        <PlanFor op={opening} line={line} structures={structures} />
      </>
    );
  }

  if (drill.phase === "right" || drill.phase === "reveal") {
    const replying = !drill.bothSides && !!answer;
    return (
      <article className="coach" data-tone={drill.tone}>
        <Score line={line} drill={drill} side={side} ply={ply} />
        <header className="coach__head">
          <span className="coach__move">{played.num}</span>
          <span className="label">{drill.phase === "right" ? "You played it" : "Shown to you"}</span>
        </header>
        <p className="coach__body" dangerouslySetInnerHTML={{ __html: played.note || "" }} />
        {played.tactics ? <TacticsLine tactics={played.tactics} /> : null}
        <Verdict verdict={drill.verdict} tone={drill.tone} />
        {replying ? (
          <p className="coach__aside">
            Play <b>{answer!.turn === "w" ? "White" : "Black"}</b>&rsquo;s reply on the board,
            or press Continue to have it played.
          </p>
        ) : null}
        <div className="coach__actions">
          <button className="btn btn--primary btn--wide" onClick={onContinue}>Continue →<kbd>↵</kbd></button>
        </div>
      </article>
    );
  }

  // asking, or just answered wrongly
  const rungs: React.ReactNode[] = [];
  if (answer && drill.hint >= 1) {
    rungs.push(
      <li key="piece">
        Move {drill.bothSides ? (answer.turn === "w" ? "White’s" : "Black’s") : "your"}{" "}
        <b>{pieceName(pieceAt(played.fen, answer.from || ""))}</b>.
      </li>
    );
  }
  if (answer && drill.hint >= 2) {
    const why = drillRedact(answer.note, answer) || drillRedact(answer.tactics, answer);
    rungs.push(<li key="why" dangerouslySetInnerHTML={{ __html: why }} />);
  }

  return (
    <article className="coach" data-tone={drill.tone || "flat"}>
      <Score line={line} drill={drill} side={side} ply={ply} />
      <Verdict verdict={drill.verdict} tone={drill.tone} />
      <p className="coach__prompt">
        Play {moverSide(line.plies, ply) === "w" ? "White" : "Black"}&rsquo;s move on the board.
      </p>
      {played.note ? (
        <p className="coach__context"
          dangerouslySetInnerHTML={{ __html: drillRedact(played.note, answer) }} />
      ) : null}
      {rungs.length ? <ol className="coach__hints">{rungs}</ol> : null}
      <div className="coach__actions">
        <button className="btn" onClick={onHint}>Hint<kbd>H</kbd></button>
        <button className="btn" onClick={onShow}>Show me<kbd>S</kbd></button>
        <button className="btn" onClick={onRestart}>Restart<kbd>R</kbd></button>
      </div>
    </article>
  );
}
