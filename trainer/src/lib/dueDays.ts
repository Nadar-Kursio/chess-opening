/* When the learner's cards come back, by learner day and course: the Recall page's week ahead and
   its "next" line. Pure, so tests/dueDays.test.ts can pin the day boundaries. */

const DAY_MS = 86_400_000;

export interface DueCard {
  openingId: string;
  due: Date;
}

export interface DueDay {
  /** Learner days from today; today holds everything overdue as well. */
  offset: number;
  total: number;
  /** Largest share first. */
  courses: { id: string; n: number }[];
}

/** The learner day a card falls due on, counted from today; `end` is the instant today ends. */
export function dayOffset(due: Date, end: Date) {
  return due < end ? 0 : Math.floor((due.getTime() - end.getTime()) / DAY_MS) + 1;
}

export function dueByDay(cards: DueCard[], end: Date, days = 7): DueDay[] {
  const counts = Array.from({ length: days }, () => new Map<string, number>());
  for (const c of cards) {
    const k = dayOffset(c.due, end);
    if (k < days) counts[k].set(c.openingId, (counts[k].get(c.openingId) ?? 0) + 1);
  }
  return counts.map((byCourse, offset) => {
    const courses = [...byCourse].map(([id, n]) => ({ id, n })).sort((a, b) => b.n - a.n);
    return { offset, total: courses.reduce((s, c) => s + c.n, 0), courses };
  });
}

/** The first day after today with anything due, however far off, and how much comes back then. */
export function nextDue(cards: DueCard[], end: Date) {
  let offset = Infinity;
  let n = 0;
  for (const c of cards) {
    const k = dayOffset(c.due, end);
    if (k === 0 || k > offset) continue;
    if (k < offset) {
      offset = k;
      n = 0;
    }
    n++;
  }
  return n ? { offset, n } : null;
}

/**
 * A day ahead, as a column label ("Today", "Thu") and inside a sentence ("tomorrow", "on Thursday",
 * "on 12 Dec").
 */
export function dayName(offset: number, tz: string, now = new Date()) {
  const at = new Date(now.getTime() + offset * DAY_MS);
  const fmt = (o: Intl.DateTimeFormatOptions) => at.toLocaleDateString('en-GB', { ...o, timeZone: tz });
  if (offset === 0) return { short: 'Today', phrase: 'today' };
  if (offset === 1) return { short: fmt({ weekday: 'short' }), phrase: 'tomorrow' };
  return { short: fmt({ weekday: 'short' }), phrase: `on ${offset < 7 ? fmt({ weekday: 'long' }) : fmt({ day: 'numeric', month: 'short' })}` };
}
