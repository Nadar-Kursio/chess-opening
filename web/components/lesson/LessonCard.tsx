import type { DemoBoard } from "@/lib/content/types";
import Demo, { DemoBlock } from "@/components/demo/Demo";

/* One card of the ideas section: the lesson's chrome — eyebrow, card frame,
   the trap's danger colour — around a Demo, which owns the prose, the chips
   and the board. The card's grid places the Demo's figure and body; see
   lesson.css. */

interface Props {
  label: string;
  danger?: boolean;
  blocks: DemoBlock[];
  boards?: DemoBoard[];
  hero?: number;
  diagram?: { board: string; caption: string } | null;
  flipped: boolean;
}

export default function LessonCard({ label, danger, blocks, boards, hero, diagram, flipped }: Props) {
  const figured = (boards && boards.length) || diagram;
  return (
    <article className={`lesson-card${figured ? "" : " lesson-card--plain"}${danger ? " lesson-card--danger" : ""}`}>
      <p className={`lesson-card__head label ${danger ? "label--danger" : "label--accent"}`}>{label}</p>
      <Demo blocks={blocks} boards={boards} hero={hero} diagram={diagram} flipped={flipped} />
    </article>
  );
}
