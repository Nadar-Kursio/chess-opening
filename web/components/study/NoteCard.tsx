"use client";

import type { NoteRecord } from "@/lib/db";
import { esc, squaresHTML } from "@/lib/chess/read";
import { noteText } from "@/lib/study/notes";

/* The learner's own note for this position — its own card in its own colour,
   never folded into the coached commentary, because it is unverified by
   design. Read-only for now: writing notes is the notepad, which is not part
   of this port yet.

   The text is user input (a file note or, later, one typed in the browser),
   so it is normalised to plain text upstream and escaped HERE, once — only
   the square-coordinate bolding is markup of ours. */

export default function NoteCard({ note, local, show }: {
  note: NoteRecord | null;
  local: boolean;
  show: boolean;
}) {
  if (!show || !note) return null;
  const marks = (note.arrows || []).map((a) => `${a.f}→${a.t}`)
    .concat((note.spots || []).map((s) => `○${s}`));
  const text = noteText(note, local);
  return (
    <article className="mynote">
      <header className="mynote__head">
        <span className="label">My note</span>
        {marks.length ? <span className="mynote__marks">{marks.join(" ")}</span> : null}
        <span className="mynote__where">{local ? "saved in this browser" : "from the notes file"}</span>
      </header>
      {text ? (
        <p className="mynote__body"
          dangerouslySetInnerHTML={{ __html: squaresHTML(esc(text)) }} />
      ) : null}
    </article>
  );
}
