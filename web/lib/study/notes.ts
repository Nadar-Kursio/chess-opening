"use client";

import type { Ply } from "@/lib/content/types";
import { db, type NoteRecord } from "@/lib/db";

/* The personal-notes channel, keyed by POSITION (turn + board string) so a
   note follows a transposition. Two sources, one rule: a note written in this
   browser shadows the shipped file note for the same position, and deleting
   the local copy brings the file's note straight back.

   Escaping lives at exactly one seam. The build pre-escapes file notes (their
   authors type casually and a stray '<' must not break the page); what the
   notepad will store is raw. So a file note is UNESCAPED here back to plain
   text, and every note is escaped once, at render — the old app's contract,
   ported so the future editor cannot re-introduce the double standard. */

export function noteKey(p: Ply): string {
  return p.turn + p.fen;
}

export function noteSaved(p: Ply): NoteRecord | null {
  return db.notes[noteKey(p)] || null;
}

export function noteShown(p: Ply): NoteRecord | null {
  return noteSaved(p) || p.mine || null;
}

export function noteIsLocal(p: Ply): boolean {
  return !!noteSaved(p);
}

function noteUnescape(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
}

/** The note's text as plain text, whichever source it came from. */
export function noteText(note: NoteRecord, local: boolean): string {
  if (!note.text) return "";
  return local ? note.text : noteUnescape(note.text);
}
