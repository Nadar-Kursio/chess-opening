"use client";

import Link from "next/link";
import type { Line, Opening } from "@/lib/content/types";
import { dbProgress } from "@/lib/db";

/* Which of an opening's lines you are reading, and what the others are — the
   chapter list from render.js's variationsHTML, with one structural change:
   each row is now a real link, so every variation page is one crawlable click
   from every other. */

interface Props {
  opening: Opening;
  lineIndex: number;
  varsOpen: boolean;
  mounted: boolean;
  onToggle: () => void;
}

function lineHref(op: Opening, i: number): string {
  return i === 0 ? `/openings/${op.id}/` : `/openings/${op.id}/${op.lines[i].slug}/`;
}

function Row({ op, l, i, on, mounted }: { op: Opening; l: Line; i: number; on: boolean; mounted: boolean }) {
  const score = mounted ? dbProgress(op.id, l.slug) : null;
  const meta = [
    `${Math.ceil((l.plies.length - 1) / 2)} moves`,
    l.record ? `${l.record.games.toLocaleString()} master games` : "",
    score && score.asked ? `${score.right}/${score.asked} first try` : "",
  ].filter(Boolean);
  return (
    <Link className="variation" href={lineHref(op, i)} prefetch={false}
      aria-current={on ? "page" : undefined} title={l.note}>
      <span className="variation__name">
        {l.name}
        {l.side && l.side !== op.orientation ? (
          <span className="variation__side">as {l.side === "black" ? "Black" : "White"}</span>
        ) : null}
        {l.tier ? <span className="variation__tier">{l.tier}</span> : null}
      </span>
      {on ? <span className="variation__note">{l.note}</span> : null}
      <span className="variation__meta">
        {meta.map((m, j) => (
          <span key={j}>
            {j > 0 ? <span className="sep">·</span> : null}
            {m}
          </span>
        ))}
      </span>
    </Link>
  );
}

export default function Variations({ opening, lineIndex, varsOpen, mounted, onToggle }: Props) {
  const op = opening;
  return (
    <div className={`variations${varsOpen ? " variations--open" : ""}`} role="group"
      aria-label={`Variations of ${op.name}`}>
      <div className="variations__head">
        <span className="label label--accent">Variations</span>
        <span className="variations__count">{lineIndex + 1} of {op.lines.length}</span>
        <button className="pill variations__toggle" id="varstoggle"
          aria-expanded={varsOpen} aria-controls="varlist" onClick={onToggle}>
          {varsOpen ? "Fewer" : `All ${op.lines.length}`}
          <span className="glyph" aria-hidden="true">{varsOpen ? "▴" : "▾"}</span>
        </button>
      </div>
      <div className="variations__list" id="varlist">
        {op.lines.map((l, i) => (
          <Row key={l.slug} op={op} l={l} i={i} on={i === lineIndex} mounted={mounted} />
        ))}
      </div>
    </div>
  );
}
