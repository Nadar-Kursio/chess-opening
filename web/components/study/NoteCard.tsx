"use client";

import { useEffect, useRef } from "react";
import type { NoteRecord } from "@/lib/db";
import { esc, squaresHTML } from "@/lib/chess/read";
import type { NoteEditor } from "@/lib/study/useStudy";
import { noteText } from "@/lib/study/notes";

/* The learner's own note for this position — its own card in its own colour,
   never folded into the coached commentary, because it is unverified by
   design. Ported from notepad.js: the card, and the editor with its working
   copy, mark chips and two-tap tools. Marks are drawn on the board by
   ArrowLayer; this card is the words and the buttons.

   The text is user input, so it is normalised to plain text upstream and
   escaped HERE, once — only the square-coordinate bolding is markup of ours. */

function markLabels(n: { arrows?: { f: string; t: string }[]; spots?: string[] }): string[] {
  return (n.arrows || []).map((a) => `${a.f}→${a.t}`)
    .concat((n.spots || []).map((s) => `○${s}`));
}

function editorHint(n: NoteEditor): string {
  if (n.pendingFrom) return "Now tap the square it points at.";
  if (n.tool === "arrow") return "Tap the square the arrow starts from.";
  if (n.tool === "spot") return "Tap a square to circle it.";
  return "Hold a square to circle it, or hold and drag for an arrow. Right-drag with a mouse.";
}

interface Props {
  note: NoteRecord | null;
  local: boolean;
  show: boolean;
  editor: NoteEditor | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onText: (text: string) => void;
  onTool: (tool: "arrow" | "spot") => void;
  onRemoveMark: (i: number) => void;
}

export default function NoteCard({
  note, local, show, editor, onEdit, onSave, onCancel, onDelete, onText, onTool, onRemoveMark,
}: Props) {
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const wantsFocus = !!editor?.focus;

  /* Focus once, when the editor was opened by its button — a right-drag opens
     it on the way past, and yanking focus mid-gesture would fight the pointer. */
  useEffect(() => {
    if (wantsFocus) boxRef.current?.focus();
  }, [wantsFocus]);

  if (!show) return null;

  if (editor) {
    const marks = markLabels(editor);
    return (
      <article className="mynote mynote--editing">
        <header className="mynote__head">
          <span className="label">My note</span>
          <span className="mynote__hint">{editorHint(editor)}</span>
        </header>
        <textarea
          ref={boxRef}
          className="mynote__text"
          rows={3}
          spellCheck
          placeholder="What this move does, in your words."
          aria-label="Your note on this position"
          value={editor.text}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { e.preventDefault(); onCancel(); return; }
            // A note is prose and wraps, so Enter has to stay Enter.
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSave(); }
          }}
        />
        {marks.length ? (
          <div className="mynote__marklist">
            {marks.map((m, i) => (
              <button key={`${m}-${i}`} className="mynote__mark"
                aria-label={`Remove the mark ${m}`} onClick={() => onRemoveMark(i)}>
                {m} ✕
              </button>
            ))}
          </div>
        ) : null}
        <div className="mynote__tools">
          <button className={`btn${editor.tool === "arrow" ? " on" : ""}`}
            aria-pressed={editor.tool === "arrow"} onClick={() => onTool("arrow")}>Make arrow</button>
          <button className={`btn${editor.tool === "spot" ? " on" : ""}`}
            aria-pressed={editor.tool === "spot"} onClick={() => onTool("spot")}>Circle square</button>
        </div>
        <div className="coach__actions">
          <button className="btn btn--primary" onClick={onSave}>Save</button>
          <button className="btn" onClick={onCancel}>Cancel</button>
          {local ? <button className="btn" onClick={onDelete}>Delete</button> : null}
        </div>
      </article>
    );
  }

  if (!note) {
    return (
      <button className="mynote-add" onClick={onEdit}>
        <span className="glyph" aria-hidden="true">✎</span>Write a note on this position
      </button>
    );
  }

  const marks = markLabels(note);
  const text = noteText(note, local);
  return (
    <article className="mynote">
      <header className="mynote__head">
        <span className="label">My note</span>
        {marks.length ? <span className="mynote__marks">{marks.join(" ")}</span> : null}
        <span className="mynote__where">{local ? "saved in this browser" : "from the notes file"}</span>
        <button className="mynote__edit" onClick={onEdit}>Edit</button>
      </header>
      {text ? (
        <p className="mynote__body"
          dangerouslySetInnerHTML={{ __html: squaresHTML(esc(text)) }} />
      ) : null}
    </article>
  );
}
