import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs';

/* The memory model behind Recall: one card per position where the learner has a move to find,
   scheduled by FSRS (the scheduler Anki ships). Pure, so the server and the tests share it.

   The learner never grades themselves. What they did on the board is the grade: the move found
   first time is Good, found but after a long think is Hard, missed or revealed is Again. Only the
   first graded attempt of a learner's day counts — repeating a line the same afternoon is practice,
   not evidence that it's remembered. */

const scheduler = fsrs(
  generatorParameters({
    request_retention: 0.9,
    maximum_interval: 365,
    enable_fuzz: true,
    // Whole days only: a web course isn't opened every ten minutes, and a miss is re-asked inside
    // the session instead of on a minutes-long learning step.
    enable_short_term: false,
  }),
);

/** Found, but only after this long: still recalled, not yet fluent. */
export const SLOW_MS = 15_000;
/** A card this stable (days until recall falls to 90%) is in long-term memory. */
export const MASTERED_DAYS = 21;
const DAY_MS = 86_400_000;

export interface CardState {
  state: number;
  due: Date;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  last_review: Date | null;
}

export type Strength = 'new' | 'learning' | 'familiar' | 'mastered';

export function strengthOf(c: Pick<CardState, 'reps' | 'stability'>): Strength {
  if (c.reps === 0) return 'new';
  if (c.stability >= MASTERED_DAYS) return 'mastered';
  return c.stability >= 7 ? 'familiar' : 'learning';
}

export function ratingFor(hit: boolean, ms?: number | null): Grade {
  if (!hit) return Rating.Again;
  return ms != null && ms > SLOW_MS ? Rating.Hard : Rating.Good;
}

export function newCard(now: Date): CardState {
  return fromFsrs(createEmptyCard(now));
}

function toFsrs(c: CardState, now: Date): Card {
  return {
    ...createEmptyCard(now),
    state: c.state as State,
    due: c.due,
    stability: c.stability,
    difficulty: c.difficulty,
    reps: c.reps,
    lapses: c.lapses,
    last_review: c.last_review ?? undefined,
  };
}

function fromFsrs(c: Card): CardState {
  return {
    state: c.state,
    due: c.due,
    stability: c.stability,
    difficulty: c.difficulty,
    reps: c.reps,
    lapses: c.lapses,
    last_review: c.last_review ?? null,
  };
}

/**
 * The card after one graded attempt. A miss comes back tomorrow whatever FSRS would say: the
 * scheduler's first relearning gap is days long, and a move just forgotten wants an early second
 * look while the session's correction is fresh.
 */
export function review(c: CardState, now: Date, grade: Grade): CardState {
  const next = fromFsrs(scheduler.next(toFsrs(c, now), now, grade).card);
  if (grade === Rating.Again) {
    const tomorrow = new Date(now.getTime() + DAY_MS);
    if (next.due > tomorrow) next.due = tomorrow;
  }
  return next;
}

/** The chance the learner recalls this card now, 0–1; a card never reviewed has none yet. */
export function recallOdds(c: CardState, now: Date) {
  if (c.reps === 0) return 0;
  return scheduler.get_retrievability(toFsrs(c, now), now, false);
}

/** Whole days from `now` until the card is due, at least one. */
export function daysUntil(c: Pick<CardState, 'due'>, now: Date) {
  return Math.max(1, Math.round((c.due.getTime() - now.getTime()) / DAY_MS));
}
