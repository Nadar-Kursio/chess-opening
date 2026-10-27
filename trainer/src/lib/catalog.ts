import 'server-only';
import { getCatalog, getOpening } from './content';
import { chapters, courseProgress, type LineProgress } from './course';
import type { Colour, OpeningSummary } from './types';

/* Which openings the trainer leads with. Everything else the build ships still appears, after
   these, so adding an opening stays data-only. */
const FEATURED = ['london', 'scandinavian', 'sicilian', 'friedliver'];

export function courses() {
  const all = getCatalog().openings;
  const rank = (o: OpeningSummary) => {
    const i = FEATURED.indexOf(o.id);
    return i < 0 ? FEATURED.length : i;
  };
  return [...all].sort((a, b) => rank(a) - rank(b));
}

export function isFeatured(id: string) {
  return FEATURED.includes(id);
}

/** The openings whose lines are traps, taught one trap per chapter. */
export function trapCourses() {
  return getCatalog().openings.filter((o) => o.section === 'traps');
}

/** Opening progress for a card: course progress plus the board to show on it. */
export function courseCard(o: OpeningSummary, byLine: Map<string, LineProgress> | undefined) {
  const op = getOpening(o.id);
  const chs = chapters(op);
  const progress = courseProgress(chs, byLine ?? new Map());
  const first = op.lines[0];
  // The position the opening is named for: a few moves in, before the lines part ways.
  const hero = first.plies[Math.min(first.plies.length - 1, o.orientation === 'white' ? 5 : 6)];
  return { summary: o, chapters: chs, progress, hero };
}

export function sideLabel(side: Colour) {
  return side === 'white' ? 'You play White' : 'You play Black';
}
