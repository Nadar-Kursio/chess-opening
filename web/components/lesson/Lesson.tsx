import type { Lesson as LessonData, Opening, Seg } from "@/lib/content/types";
import { getStructures } from "@/lib/content/load";
import LessonCard from "./LessonCard";

/* The ideas section. The theory used to render as six cards of prose; here
   each card gets the board its sentences are about, with the moves in the text
   as the controls (LessonCard). The emit derives the boards — engine/lesson.py
   replays every run it finds in the prose — and an opening emitted without a
   lesson record falls back to the same cards with no boards, prose intact. */

const plain = (text: string): Seg[] => [text];

export default function Lesson({ opening }: { opening: Opening }) {
  const op = opening;
  const t = op.theory;
  const flipped = op.orientation === "black";
  const lesson: LessonData = op.lesson ?? {
    idea: { seg: plain(t.big_idea) },
    structure: { seg: plain(t.structure) },
    plans: { white: t.white_plans.map(plain), black: t.black_plans.map(plain) },
    traps: t.traps.map((x) => ({ seg: plain(x) })),
  };

  /* The diagram for the structure card: the structure the opening's own plan
     cards point at, when one does. */
  const sid = op.lines.map((l) => l.plan?.structure).find(Boolean);
  const structure = (sid && getStructures().find((s) => s.id === sid)) || null;

  const interactive =
    [lesson.idea, lesson.structure, lesson.plans, ...lesson.traps]
      .some((card) => card.boards && card.boards.length);

  return (
    <section className="lesson" id={`ideas-${op.id}`}>
      {interactive ? (
        <p className="lesson__hint">
          The moves in the text are buttons &mdash; press one and the board
          beside it shows the position.
        </p>
      ) : null}
      <LessonCard label="The idea in one paragraph" flipped={flipped}
        blocks={[{ items: [lesson.idea.seg] }]}
        boards={lesson.idea.boards} hero={lesson.idea.hero} />
      <LessonCard label="The pawn structure" flipped={flipped}
        blocks={[{ items: [lesson.structure.seg] }]}
        boards={lesson.structure.boards} hero={lesson.structure.hero}
        diagram={structure ? { board: structure.board, caption: structure.name } : null} />
      <LessonCard label="The plans" flipped={flipped}
        blocks={[
          { heading: "♔ White’s plans", items: lesson.plans.white, list: true },
          { heading: "♚ Black’s plans", items: lesson.plans.black, list: true },
        ]}
        boards={lesson.plans.boards} hero={lesson.plans.hero} />
      <div className="lesson__traps">
        <p className="lesson__traps-head label label--danger">Traps and things that lose games</p>
        {lesson.traps.map((trap, i) => (
          <LessonCard key={i} danger flipped={flipped}
            label={trap.name || `Trap ${i + 1}`}
            blocks={[{ items: [trap.seg] }]}
            boards={trap.boards} hero={trap.hero} />
        ))}
      </div>
      <div className="lesson__who"><p dangerouslySetInnerHTML={{ __html: t.who }} /></div>
    </section>
  );
}
