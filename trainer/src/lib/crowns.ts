import { MASTERED_DAYS } from './memory.ts';

/* A chapter's crown: how well its moves are held, 0 to 5, from the chapter's Recall cards. Each
   level asks something of every move in the chapter, so the crown shows the weakest of them, and a
   chapter whose cards are left overdue loses levels until Recall asks them again. Pure, so
   tests/crowns.test.ts checks the rules. */

export type CrownLevel = 0 | 1 | 2 | 3 | 4 | 5;
export const MAX_CROWN = 5;

/** A card holds for this long (FSRS stability, days) to count as familiar. */
export const FAMILIAR_DAYS = 7;
/** Every week a card sits overdue costs the chapter another level. */
export const OVERDUE_STEP_DAYS = 7;
const DAY_MS = 86_400_000;

export const CROWN_LABEL: Record<CrownLevel, string> = {
  0: 'Not learned',
  1: 'Learned',
  2: 'Recalled',
  3: 'Familiar',
  4: 'Strong',
  5: 'Long-term',
};

export interface CrownCard {
  reps: number;
  stability: number;
  due: Date;
}

export interface Crown {
  level: CrownLevel;
  /** What the cards' stability alone earns; above `level` while cards sit overdue. */
  earned: CrownLevel;
  /** Cards due before the learner's day began. */
  overdue: number;
  /** What the next level asks for, or what brings back the lost ones. */
  next: string | null;
}

const moves = (n: number) => `${n} move${n === 1 ? '' : 's'}`;

/**
 * The crown for one chapter. `keys` are the positions its Learn introduces, `cards` the learner's
 * cards by position, and `dayStart` when the learner's day began: a card due today is on time.
 */
export function crownOf(learned: boolean, keys: string[], cards: Map<string, CrownCard>, dayStart: Date): Crown {
  if (!learned || !keys.length) return { level: 0, earned: 0, overdue: 0, next: learned ? null : 'Learn the chapter to earn its first crown' };
  const mine = [...new Set(keys)].map((k) => cards.get(k));
  const total = mine.length;
  const answered = mine.filter((c) => c && c.reps > 0) as CrownCard[];
  const familiar = answered.filter((c) => c.stability >= FAMILIAR_DAYS).length;
  const longTerm = answered.filter((c) => c.stability >= MASTERED_DAYS).length;
  const half = Math.ceil(total / 2);

  let earned: CrownLevel;
  let next: string | null;
  if (answered.length < total) {
    earned = 1;
    next = `Recall ${moves(total - answered.length)} once`;
  } else if (familiar < total) {
    earned = 2;
    next = `Hold ${moves(total - familiar)} for a week`;
  } else if (longTerm < half) {
    earned = 3;
    next = `${moves(half - longTerm)} more into long-term memory`;
  } else if (longTerm < total) {
    earned = 4;
    next = `${moves(total - longTerm)} left to reach long-term memory`;
  } else {
    earned = 5;
    next = null;
  }

  const late = mine.filter((c): c is CrownCard => !!c && c.due < dayStart);
  if (!late.length) return { level: earned, earned, overdue: 0, next };
  const oldest = Math.min(...late.map((c) => c.due.getTime()));
  const weeks = Math.floor((dayStart.getTime() - oldest) / (OVERDUE_STEP_DAYS * DAY_MS));
  const level = Math.max(1, earned - 1 - weeks) as CrownLevel;
  return {
    level,
    earned,
    overdue: late.length,
    next: level < earned ? `Recall ${moves(late.length)} overdue to win back ${earned - level === 1 ? 'a level' : `${earned - level} levels`}` : next,
  };
}

export interface CrownSummary {
  /** Levels held across the chapters, out of `possible`. */
  levels: number;
  possible: number;
  /** Chapters at the full crown. */
  full: number;
  /** Chapters below what their cards earned, because of overdue cards. */
  fading: number;
}

export function crownSummary(crowns: Crown[]): CrownSummary {
  return {
    levels: crowns.reduce((n, c) => n + c.level, 0),
    possible: crowns.length * MAX_CROWN,
    full: crowns.filter((c) => c.level === MAX_CROWN).length,
    fading: crowns.filter((c) => c.level < c.earned).length,
  };
}
