"use client";

import type { Line, Opening } from "@/lib/content/types";

/* Every line finishes with a card, from plan.js. The authored plan names the
   structure it reaches; structure pages are not part of this port yet, so the
   name renders without a link rather than linking into a 404. */

export function PlanFor({ op, line, structures }: {
  op: Opening;
  line: Line;
  structures: { id: string; name: string }[];
}) {
  const plan = line.plan;
  if (plan) {
    const st = plan.structure ? structures.find((s) => s.id === plan.structure) : null;
    return (
      <div className="plan">
        <p className="label label--accent">You&rsquo;re on your own from here</p>
        <p className="plan__point" dangerouslySetInnerHTML={{ __html: plan.point }} />
        {st ? (
          <div className="structure-link">
            <span className="label">The structure you reached</span>
            <span className="structure-link__name">{st.name}</span>
          </div>
        ) : null}
        {plan.next && plan.next.length ? (
          <>
            <p className="label plan__sub">What usually happens next</p>
            <ul className="plan__next">
              {plan.next.map((x, i) => <li key={i} dangerouslySetInnerHTML={{ __html: x }} />)}
            </ul>
          </>
        ) : null}
        {plan.endgame ? (
          <p className="plan__endgame"><b>If it simplifies.</b> <span dangerouslySetInnerHTML={{ __html: plan.endgame }} /></p>
        ) : null}
      </div>
    );
  }

  /* No authoring at all: the plans are the ones the opening already states. */
  const side = line.side || op.orientation;
  const mine = side === "black" ? op.theory.black_plans : op.theory.white_plans;
  return (
    <div className="plan plan--generic">
      <p className="label">You&rsquo;re on your own from here</p>
      <p className="plan__point">
        {line.name} ends here. There is no move {Math.ceil(line.plies.length / 2) + 1} written
        down &mdash; from this position you are playing on the ideas, not the moves.
      </p>
      <p className="label plan__sub">What you are trying to do in this opening</p>
      <ul className="plan__next">
        {mine.slice(0, 3).map((x, i) => <li key={i} dangerouslySetInnerHTML={{ __html: x }} />)}
      </ul>
      <p className="plan__endgame"><b>The structure.</b> <span dangerouslySetInnerHTML={{ __html: op.theory.structure }} /></p>
    </div>
  );
}
