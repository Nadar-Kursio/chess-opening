import type { PositionMemory } from './mastery.ts';

/* The stats page's arithmetic, on rows the database has already summed: days filled in, rolling
   accuracy, the year's calendar, the deck by stability, and the weakest positions. Pure, so
   tests/stats.test.ts can check it without a database. */

export interface DayRow {
  day: string;
  /** Moves found. */
  moves: number;
  /** Moves found and missed in the sessions that grade them (everything but Learn). */
  found: number;
  missed: number;
}

export function shiftDay(day: string, by: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + by);
  return d.toISOString().slice(0, 10);
}

/** The last `n` days up to `today`, oldest first, with a zero row for every day not practised. */
export function fillDays(rows: DayRow[], today: string, n: number): DayRow[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  return Array.from({ length: n }, (_, k) => {
    const day = shiftDay(today, k - n + 1);
    return byDay.get(day) ?? { day, moves: 0, found: 0, missed: 0 };
  });
}

export interface AccuracyPoint {
  day: string;
  /** Percent found over the trailing window; null when nothing was graded in it. */
  pct: number | null;
  graded: number;
}

/** Accuracy over the `window` days ending on each day: one day's handful of moves is too noisy to read. */
export function rollingAccuracy(days: DayRow[], window = 7): AccuracyPoint[] {
  return days.map((d, i) => {
    let found = 0;
    let graded = 0;
    for (let k = Math.max(0, i - window + 1); k <= i; k++) {
      found += days[k].found;
      graded += days[k].found + days[k].missed;
    }
    return { day: d.day, pct: graded ? Math.round((found / graded) * 100) : null, graded };
  });
}

export function sumDays(days: DayRow[]) {
  const t = days.reduce((a, d) => ({ moves: a.moves + d.moves, found: a.found + d.found, missed: a.missed + d.missed }), {
    moves: 0,
    found: 0,
    missed: 0,
  });
  const graded = t.found + t.missed;
  return { ...t, active: days.filter((d) => d.moves > 0).length, accuracy: graded ? Math.round((t.found / graded) * 100) : null };
}

/** How full a day was against the learner's daily goal, 0 (nothing) to 4 (twice the goal). */
export function dayLevel(moves: number, goal: number) {
  if (moves <= 0) return 0;
  if (moves < goal / 2) return 1;
  if (moves < goal) return 2;
  if (moves < goal * 2) return 3;
  return 4;
}

export interface CalendarDay {
  day: string;
  moves: number;
  level: number;
  future: boolean;
}

/**
 * The year as columns of weeks, Monday first, ending with the week that holds `today`. Days after
 * today are kept so the last column is a whole week, and marked as future.
 */
export function calendar(rows: { day: string; moves: number }[], today: string, goal: number, weeks = 53): CalendarDay[][] {
  const byDay = new Map(rows.map((r) => [r.day, r.moves]));
  const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
  const firstMonday = shiftDay(today, -weekday - (weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = shiftDay(firstMonday, w * 7 + d);
      const moves = byDay.get(day) ?? 0;
      return { day, moves, level: dayLevel(moves, goal), future: day > today };
    }),
  );
}

/** The longest run of consecutive practised days. */
export function longestStreak(days: string[]) {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const d of sorted) {
    run = prev && shiftDay(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export interface CardRow {
  reps: number;
  stability: number;
}

export const STABILITY_BUCKETS = [
  { id: 'new', label: 'Not yet recalled', level: 'new' },
  { id: 'days', label: 'Under 3 days', level: 'learning' },
  { id: 'week', label: '3 to 7 days', level: 'learning' },
  { id: 'weeks', label: '1 to 3 weeks', level: 'familiar' },
  { id: 'months', label: '3 weeks to 3 months', level: 'mastered' },
  { id: 'long', label: 'Over 3 months', level: 'mastered' },
] as const;

export type BucketId = (typeof STABILITY_BUCKETS)[number]['id'];

/** Which bucket a card's stability (days until recall falls to 90%) puts it in. */
export function bucketOf(c: CardRow): BucketId {
  if (c.reps === 0) return 'new';
  if (c.stability < 3) return 'days';
  if (c.stability < 7) return 'week';
  if (c.stability < 21) return 'weeks';
  if (c.stability < 90) return 'months';
  return 'long';
}

/** Cards per bucket; a row can stand for `n` cards at once. */
export function stabilityCounts(cards: (CardRow & { n?: number })[]) {
  const counts = Object.fromEntries(STABILITY_BUCKETS.map((b) => [b.id, 0])) as Record<BucketId, number>;
  for (const c of cards) counts[bucketOf(c)] += c.n ?? 1;
  return STABILITY_BUCKETS.map((b) => ({ ...b, n: counts[b.id] }));
}

/** Cards due on each of the next `days` days, from counts by day offset; overdue ones count today. */
export function fillForecast(rows: { offset: number; n: number }[], days = 7) {
  const out = Array.from({ length: days }, () => 0);
  for (const r of rows) {
    const k = Math.max(0, r.offset);
    if (k < days) out[k] += r.n;
  }
  return out;
}

export interface WeakCandidate {
  openingId: string;
  key: string;
  memory: PositionMemory;
  lapses: number;
}

/**
 * How badly a position needs work, 0–1: how likely it is to be forgotten now, and how often it
 * has been missed. Only positions with some evidence count: a card never answered isn't weak.
 */
export function weakness(c: Pick<WeakCandidate, 'memory' | 'lapses'>) {
  const { odds, misses, hits } = c.memory;
  if (odds === null && !misses) return null;
  const forget = odds === null ? 0.5 : 1 - odds / 100;
  const missRate = misses + hits ? misses / (misses + hits) : 0;
  return 0.6 * forget + 0.4 * missRate + Math.min(c.lapses, 5) * 0.01;
}

/** The `n` weakest positions, worst first, each asked once even if two courses share it. */
export function weakest<T extends WeakCandidate>(candidates: T[], n = 10): (T & { score: number })[] {
  const scored = candidates
    .map((c) => ({ ...c, score: weakness(c) }))
    .filter((c): c is T & { score: number } => c.score !== null && c.score > 0.1);
  scored.sort((a, b) => b.score - a.score || b.memory.misses - a.memory.misses);
  const seen = new Set<string>();
  return scored.filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true))).slice(0, n);
}
