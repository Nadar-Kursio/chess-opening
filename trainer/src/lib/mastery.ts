/* How well the learner knows a position, as the explorer and the stats page show it. Client-safe:
   the levels are decided on the server (repertoire.ts, from the Recall deck), and this file only
   names them and adds them up. */

export type Level = 'none' | 'new' | 'learning' | 'familiar' | 'mastered';

/** Weakest first: the order of every legend and segmented bar. */
export const LEVELS: Level[] = ['none', 'new', 'learning', 'familiar', 'mastered'];

export const LEVEL_LABEL: Record<Level, string> = {
  none: 'Not learned',
  new: 'New',
  learning: 'Learning',
  familiar: 'Familiar',
  mastered: 'Long-term',
};

export const LEVEL_NOTE: Record<Level, string> = {
  none: 'Not in your Recall deck yet',
  new: 'Learned, not yet recalled',
  learning: 'Recalled, still fresh: back within a week',
  familiar: 'Holding for a week or more',
  mastered: 'Holding for three weeks or more',
};

export interface PositionMemory {
  level: Level;
  /** Due today after being recalled before, or missed more often than found. */
  weak: boolean;
  /** Chance of recalling it now, 0–100; null before the first answer. */
  odds: number | null;
  misses: number;
  hits: number;
  /** Learner days until Recall asks it; 0 is today. Null when it isn't in the deck. */
  dueIn: number | null;
}

/** Positions where the learner moves, counted by level, plus how many of them are weak. */
export type Tally = Record<Level, number> & { weak: number };

export function emptyTally(): Tally {
  return { none: 0, new: 0, learning: 0, familiar: 0, mastered: 0, weak: 0 };
}

export function addTally(into: Tally, t: Tally) {
  for (const l of LEVELS) into[l] += t[l];
  into.weak += t.weak;
  return into;
}

export function tallyTotal(t: Tally) {
  return LEVELS.reduce((n, l) => n + t[l], 0);
}

/** One phrase for a tally, for labels a screen reader reads out. */
export function tallyWords(t: Tally) {
  const parts = LEVELS.filter((l) => t[l]).map((l) => `${t[l]} ${LEVEL_LABEL[l].toLowerCase()}`);
  if (t.weak) parts.push(`${t.weak} need work`);
  return parts.join(', ') || 'nothing to play';
}
