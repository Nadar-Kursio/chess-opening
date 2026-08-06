"use client";

import Link from "next/link";
import type { Branch, Catalog, Line, Severity } from "@/lib/content/types";
import type { Deviation } from "@/lib/study/useStudy";
import { TacticsLine } from "./Coach";
import { EvalMove } from "./Eval";

/* "They played something else" — the picker and the panel, from deviation.js.
   Three buckets, and only one of them is a mistake; the word is what makes the
   severity legible to someone who reads neither the colour nor the glyph. */

const SEVERITY: Record<Severity, { label: string; mark: string }> = {
  blunder: { label: "Blunder", mark: "??" },
  inaccuracy: { label: "Inaccuracy", mark: "?!" },
  playable: { label: "Playable", mark: "=" },
};

export function SeverityChip({ sev }: { sev: Severity }) {
  const s = SEVERITY[sev];
  return (
    <span className={`severity severity--${sev}`}>
      <b className="severity__mark" aria-hidden="true">{s.mark}</b>
      <span className="severity__word">{s.label}</span>
    </span>
  );
}

export function DevPicker({
  list, line, ply, onPick, onCancel,
}: {
  list: Branch[];
  line: Line;
  ply: number;
  onPick: (i: number) => void;
  onCancel: () => void;
}) {
  const next = line.plies[ply + 1];
  return (
    <div className="deviation-picker" id="deviation-picker">
      <p className="deviation-picker__lead">
        {next ? <>What did they play instead of <b>{next.num}</b>?</> : "What did they play here?"}
      </p>
      {list.length ? (
        <div className="candidates">
          {list.map((b, i) => (
            <button key={i} className={`candidate candidate--${b.sev}`} onClick={() => onPick(i)}>
              {b.san} <SeverityChip sev={b.sev} />
            </button>
          ))}
        </div>
      ) : null}
      <p className="deviation-picker__else">
        {list.length
          ? "…or play their move on the board and I'll tell you what I can."
          : "Play their move on the board and I'll tell you what I can."}
      </p>
      <button className="deviation-picker__cancel" onClick={onCancel}>Cancel <kbd>Esc</kbd></button>
    </div>
  );
}

/* A deviation's `see` names where the idea is covered in full. Resolved against
   the catalog, which only lists ported openings — a target that is not on the
   new site yet (another opening, a game, a structure) gets no card rather than
   a link into a 404. */
function devTarget(see: string | undefined, catalog: Catalog) {
  if (!see) return null;
  const [opId, slug] = String(see).split("#");
  if (opId === "structure") return null;
  const op = catalog.openings.find((o) => o.id === opId);
  if (!op) return null;
  if (slug) {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const i = op.lines.findIndex((l) => norm(l.name).includes(slug));
    if (i >= 0) {
      return {
        label: op.lines[i].name,
        lead: `In ${op.name}`,
        href: i === 0 ? `/openings/${op.id}/` : `/openings/${op.id}/${op.lines[i].slug}/`,
      };
    }
    return null;
  }
  return { label: op.name, lead: "The opening", href: `/openings/${op.id}/` };
}

export function DevPanel({
  branch, deviation, line, catalog, onExit, onPrev, onNext, onAt,
}: {
  branch: Branch;
  deviation: Deviation;
  line: Line;
  catalog: Catalog;
  onExit: () => void;
  onPrev: () => void;
  onNext: () => void;
  onAt: (n: number) => void;
}) {
  const at = deviation.at;
  const ply = branch.plies[at];
  const last = at >= branch.plies.length - 1;
  const jump = devTarget(branch.see, catalog);
  /* The position the move on screen was played from: a deviation's first move
     was played from the line position it branched off. */
  const prev = at > 0 ? branch.plies[at - 1] : line.plies[deviation.fromPly] || null;

  return (
    <article className="coach" data-tone={branch.sev}>
      <header className="coach__head">
        <SeverityChip sev={branch.sev} />
        <span className="coach__move">{branch.plies[0].num}</span>
        {branch.name ? <span className="coach__name">{branch.name}</span> : null}
        <button className="coach__close" onClick={onExit} aria-label="Back to the line"
          title="Back to the line (Esc)">✕</button>
      </header>
      <p className="coach__body" dangerouslySetInnerHTML={{ __html: branch.why }} />
      {jump ? (
        <Link className="jump-card" href={jump.href} prefetch={false}>
          <span className="jump-card__lead label">{jump.lead}</span>
          <span className="jump-card__name">{jump.label}</span>
        </Link>
      ) : null}
      {branch.plies.length > 1 ? (
        <>
          <div className="scoresheet scoresheet--inline">
            {branch.plies.map((q, i) => {
              const num = q.turn === "w"
                ? <span className="scoresheet__no">{Math.ceil((i + 1) / 2)}.</span>
                : null;
              const cls = i === at ? "move current" : i < at ? "move played" : "move";
              return (
                <span key={i}>
                  {num}
                  <button className={cls} onClick={() => onAt(i)}>{q.san}</button>
                </span>
              );
            })}
          </div>
          <header className="coach__head coach__head--plain">
            <span className="coach__move">{ply.num}</span>
            <span className="label">{ply.turn === "w" ? "White to have moved" : "Black to have moved"}</span>
          </header>
          {ply.tactics ? <TacticsLine tactics={ply.tactics} /> : null}
          <EvalMove before={prev} after={ply} />
          <div className="coach__actions">
            <button className="btn" onClick={onPrev} disabled={at === 0}>← Back</button>
            <button className="btn" onClick={onNext} disabled={last}>Next →</button>
            <button className="btn btn--primary" onClick={onExit}>Return to the line</button>
          </div>
        </>
      ) : (
        <div className="coach__actions">
          <button className="btn btn--primary" onClick={onExit}>Return to the line</button>
        </div>
      )}
    </article>
  );
}
