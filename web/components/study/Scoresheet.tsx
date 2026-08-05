"use client";

import { useEffect, useRef } from "react";
import type { Line } from "@/lib/content/types";

/* The move tape and the win bar, from render.js. In drill the tape is the
   answer sheet, so everything ahead of the cursor is masked. */

export function Scoresheet({
  line, ply, hide, muted, onJump,
}: {
  line: Line;
  ply: number;
  hide: boolean;
  muted: boolean;
  onJump: (n: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  /* Keep the current move visible inside the scoresheet, and nowhere else —
     scrollIntoView would drag the pinned board off a phone screen. */
  useEffect(() => {
    const sheet = ref.current;
    const current = sheet?.querySelector<HTMLElement>(".move.current");
    if (!sheet || !current) return;
    const box = sheet.getBoundingClientRect();
    const move = current.getBoundingClientRect();
    if (move.top < box.top) sheet.scrollTop -= box.top - move.top;
    else if (move.bottom > box.bottom) sheet.scrollTop += move.bottom - box.bottom;
  }, [ply]);

  return (
    <div className={`scoresheet scroller${muted ? " scoresheet--muted" : ""}`} id="tape" ref={ref}>
      {line.plies.slice(1).map((q, i) => {
        const idx = i + 1;
        const num = q.turn === "w"
          ? <span className="scoresheet__no">{Math.ceil(idx / 2)}.</span>
          : null;
        if (hide && idx > ply) {
          return (
            <span key={idx}>
              {num}
              <span className="move--masked" aria-hidden="true">••</span>
            </span>
          );
        }
        const cls = idx === ply ? "move current" : idx < ply ? "move played" : "move";
        return (
          <span key={idx}>
            {num}
            <button className={cls} data-ply={idx} onClick={() => onJump(idx)}>{q.san}</button>
          </span>
        );
      })}
    </div>
  );
}

/* How the games that reached this line's key position actually finished. */
export function RecordBar({ line, drill }: { line: Line; drill: boolean }) {
  const r = line.record;
  if (!r) return null;
  const games = r.games.toLocaleString();
  const at = drill ? "" : line.plies[r.at].num;
  const share = (who: string, n: number) => (
    <span className={`record__share record__share--${who}`} style={{ width: `${n}%` }}>
      {n >= 12 ? `${n}%` : ""}
    </span>
  );
  return (
    <div className="record">
      <div className="record__bar" role="img"
        aria-label={`Of ${games} master games from this position, White won ${r.white}%, ${r.draw}% were drawn, and Black won ${r.black}%.`}>
        {share("white", r.white)}
        {share("draw", r.draw)}
        {share("black", r.black)}
      </div>
      <p className="record__caption">
        {games} master games{at ? <> after <b>{at}</b></> : null}
        <span className="sep">·</span> White {r.white}%
        <span className="sep">·</span> Draw {r.draw}%
        <span className="sep">·</span> Black {r.black}%
      </p>
    </div>
  );
}
