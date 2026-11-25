import 'server-only';
import { getClub, getOpening } from './content';
import { pack } from './pack';
import { forBrowser, sparBook, type SparBook } from './spar';
import type { Colour } from './types';

/* A course's sparring book is the same for every learner and changes only with a deploy, so each
   (course, side) is built and packed once per process, like the courses in content.ts. */

const books = new Map<string, { book: SparBook; json: string }>();

/** The book and its packed JSON for the browser; null for a course without club data. */
export function servedBook(id: string, side: Colour) {
  const club = getClub(id);
  if (!club) return null;
  const at = `${id}|${side}`;
  let served = books.get(at);
  if (!served) {
    const book = sparBook(getOpening(id), side, club);
    served = { book, json: JSON.stringify(pack(forBrowser(book))) };
    books.set(at, served);
  }
  return served;
}
