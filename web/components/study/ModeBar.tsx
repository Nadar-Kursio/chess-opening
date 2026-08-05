"use client";

import type { Line } from "@/lib/content/types";
import { FEEDBACK_LEVELS, feedbackLevel } from "@/lib/study/drill";

/* Read or drill, and — in either — "they played something else". From
   drill.js's modeBarHTML. */

interface Props {
  line: Line;
  mode: "read" | "drill";
  bothSides: boolean;
  picking: boolean;
  inDeviation: boolean;
  onMode: (m: "read" | "drill") => void;
  onBothSides: () => void;
  onDeviate: () => void;
}

export default function ModeBar({
  line, mode, bothSides, picking, inDeviation, onMode, onBothSides, onDeviate,
}: Props) {
  const level = feedbackLevel(line);
  return (
    <div className="study__modes">
      <div className="segmented" role="group" aria-label="How to study this line">
        <button className="seg" aria-pressed={mode === "read"} onClick={() => onMode("read")}>Read</button>
        <button className="seg" aria-pressed={mode === "drill"}
          title="Play each move before it is shown" onClick={() => onMode("drill")}>Drill</button>
      </div>
      {mode === "drill" ? (
        <button className={`pill${bothSides ? " on" : ""}`} aria-pressed={bothSides}
          title={bothSides
            ? "Answering for both colours. Switch back to only your own."
            : "Answer for both colours instead of having the replies played for you."}
          onClick={onBothSides}>
          <span className="glyph" aria-hidden="true">⇄</span>Both sides
        </button>
      ) : null}
      <span className="spacer"></span>
      <span className={`feedback-level feedback-level--${level}`}
        title="How much this line can tell you about a wrong move">
        <b className="feedback-level__tag">{FEEDBACK_LEVELS[level].tag}</b>
        <span className="feedback-level__what">{FEEDBACK_LEVELS[level].blurb}</span>
      </span>
      <button className={`pill pill--warn${picking ? " on" : ""}`} disabled={inDeviation}
        onClick={onDeviate}>
        They deviated<kbd>D</kbd>
      </button>
    </div>
  );
}
