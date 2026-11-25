import { CROWN_NAME, MAX_CROWN, type CrownLevel } from './crownLevels.ts';
import { MASTERED_DAYS, readyBy, type CardState } from './memory.ts';

export { CROWN_NAME, CROWN_RULE, MAX_CROWN, type CrownLevel } from './crownLevels.ts';

/* A chapter's crown: how well its moves are held, from New to Mastered, read off the chapter's
   Recall cards. Each level asks something of every move in the chapter, so the crown follows the
   weakest of them, and a chapter whose cards are left overdue fades until Recall asks them again.
   Chapters share their opening moves, so an overdue move fades only the chapter it belongs to: the
   earliest learned chapter in the course that plays it. Pure, so tests/crowns.test.ts checks the
   rules. */

/** A card holds for this long (FSRS stability, days) to count as remembered for a week. */
export const FAMILIAR_DAYS = 7;
/** Every week a card sits overdue costs the chapter another level. */
export const OVERDUE_STEP_DAYS = 7;
const DAY_MS = 86_400_000;

export type CrownCard = CardState;

/** When the crown is read: the start of the learner's day (a card due today is on time) and now. */
export interface CrownDay {
  start: Date;
  now: Date;
}

export interface Crown {
  level: CrownLevel;
  /** What the cards' stability alone earns; above `level` while the chapter's own cards sit overdue. */
  earned: CrownLevel;
  /** The chapter's own cards overdue from before today: what fades it. */
  overdue: number;
  /** The chapter's cards Recall asks today, shared ones included. */
  due: number;
  /** Moves the next level still needs. */
  toGo: number;
  /** The review that could earn the next level, if every review from now on is on time and right. */
  eta: Date | null;
  /** The highest level the review at `eta` could bring. */
  reach: CrownLevel;
  /** The soonest one of the chapter's cards falls due after today. */
  nextReview: Date | null;
}

const NEW: Crown = { level: 0, earned: 0, overdue: 0, due: 0, toGo: 0, eta: null, reach: 0, nextReview: null };

const daysFrom = (at: Date, day: CrownDay) => Math.max(0, Math.floor((at.getTime() - day.start.getTime()) / DAY_MS));

const moves = (n: number) => `${n} move${n === 1 ? '' : 's'}`;

/** The `n`th soonest any of `cards` reaches `stability`. */
function nthReady(cards: CrownCard[], stability: number, n: number, now: Date) {
  const at = cards.map((c) => readyBy(c, stability, now).getTime()).sort((a, b) => a - b);
  return new Date(at[Math.min(n, at.length) - 1]);
}

/**
 * The crown for one chapter. `keys` are the positions its Learn introduces, `cards` the learner's
 * cards by position, and `owned` the keys whose overdue cards fade this chapter (all of them unless
 * an earlier chapter plays the same move).
 */
export function crownOf(learned: boolean, keys: string[], cards: Map<string, CrownCard>, day: CrownDay, owned: string[] = keys): Crown {
  const unique = [...new Set(keys)];
  if (!learned || !unique.length) return NEW;
  const mine = unique.map((k) => cards.get(k)).filter((c): c is CrownCard => !!c);
  const total = unique.length;
  const answered = mine.filter((c) => c.reps > 0);
  const half = Math.ceil(total / 2);

  const weak = answered.filter((c) => c.stability < FAMILIAR_DAYS);
  const shortTerm = answered.filter((c) => c.stability < MASTERED_DAYS);
  const longTerm = total - shortTerm.length;
  let earned: CrownLevel;
  let toGo: number;
  if (answered.length < total) {
    earned = 1;
    toGo = total - answered.length;
  } else if (weak.length) {
    earned = 2;
    toGo = weak.length;
  } else if (longTerm < half) {
    earned = 3;
    toGo = half - longTerm;
  } else if (shortTerm.length) {
    earned = 4;
    toGo = shortTerm.length;
  } else {
    earned = 5;
    toGo = 0;
  }

  // Cards reviewed together grow together, so the review that earns the next level often earns the
  // one after it too: `reach` is the highest level that same day brings.
  let eta: Date | null = null;
  let reach: CrownLevel = earned;
  if (earned >= 2 && earned < MAX_CROWN) {
    const ready = (pool: CrownCard[], stability: number, n: number) => (n > 0 ? nthReady(pool, stability, n, day.now).getTime() : day.now.getTime());
    const solid = ready(weak, FAMILIAR_DAYS, weak.length);
    const strong = Math.max(solid, ready(shortTerm, MASTERED_DAYS, half - longTerm));
    const at = [0, 0, 0, solid, strong, Math.max(strong, ready(shortTerm, MASTERED_DAYS, shortTerm.length))];
    eta = new Date(at[earned + 1]);
    const etaDay = daysFrom(eta, day);
    reach = (earned + 1) as CrownLevel;
    while (reach < MAX_CROWN && daysFrom(new Date(at[reach + 1]), day) === etaDay) reach = (reach + 1) as CrownLevel;
  }

  const dayEnd = day.start.getTime() + DAY_MS;
  const due = mine.filter((c) => c.due.getTime() < dayEnd).length;
  const upcoming = mine.map((c) => c.due.getTime()).filter((t) => t >= dayEnd);
  const nextReview = upcoming.length ? new Date(Math.min(...upcoming)) : null;
  const base = { earned, due, toGo, eta, reach, nextReview };

  const late = [...new Set(owned)].map((k) => cards.get(k)).filter((c): c is CrownCard => !!c && c.due < day.start);
  if (!late.length) return { ...base, level: earned, overdue: 0 };
  const oldest = Math.min(...late.map((c) => c.due.getTime()));
  const weeks = Math.floor((day.start.getTime() - oldest) / (OVERDUE_STEP_DAYS * DAY_MS));
  return { ...base, level: Math.max(1, earned - 1 - weeks) as CrownLevel, overdue: late.length };
}

export interface CrownChapter {
  slug: string;
  keys: string[];
  learned: boolean;
}

/** Every chapter's crown in a course, in course order: each shared move belongs to the earliest learned chapter that plays it. */
export function courseCrowns(chapters: CrownChapter[], cards: Map<string, CrownCard>, day: CrownDay) {
  const owner = new Map<string, string>();
  for (const ch of chapters) {
    if (!ch.learned) continue;
    for (const k of ch.keys) if (!owner.has(k)) owner.set(k, ch.slug);
  }
  return new Map(
    chapters.map((ch) => [ch.slug, crownOf(ch.learned, ch.keys, cards, day, ch.keys.filter((k) => owner.get(k) === ch.slug))]),
  );
}

export interface CrownStep {
  title: string;
  detail: string;
  /** What moves the crown on now: answering every move (Drill or Recall), or reviewing what's due. */
  action: 'answer' | 'review' | null;
}

function whenNext(at: Date | null, day: CrownDay) {
  if (!at) return '';
  const days = daysFrom(at, day);
  return days <= 1 ? ' The next is due tomorrow.' : ` The next is due in ${days} days.`;
}

/** What the chapter's crown needs next, in words, and the session that gets it there. */
export function crownStep(c: Crown, day: CrownDay): CrownStep {
  if (c.level === 0) return { title: 'Not learned yet', detail: 'Finish Learn to earn the first crown.', action: null };
  if (c.level < c.earned) {
    return {
      title: `Fading: ${moves(c.overdue)} overdue`,
      detail: `Review ${c.overdue === 1 ? 'it' : 'them'} to win back ${CROWN_NAME[c.earned]}.`,
      action: 'review',
    };
  }
  if (c.level === MAX_CROWN) {
    return c.due
      ? { title: CROWN_NAME[5], detail: `${moves(c.due)} due today. Review to keep the crown.`, action: 'review' }
      : { title: CROWN_NAME[5], detail: 'Every move is in long-term memory. Recall checks in now and then.', action: null };
  }
  const next = CROWN_NAME[(c.level + 1) as CrownLevel];
  if (c.level === 1) {
    return { title: `${moves(c.toGo)} to go for ${next}`, detail: 'Answer each move once, in Drill, Test or Recall.', action: 'answer' };
  }
  const days = c.eta ? daysFrom(c.eta, day) : null;
  const goal = CROWN_NAME[c.reach];
  const title =
    days === null ? `Next: ${next}` : days === 0 ? `${goal} with today’s reviews` : days === 1 ? `${goal} tomorrow` : `${goal} in about ${days} days`;
  return c.due
    ? { title, detail: `Keep up your reviews: ${moves(c.due)} due today.`, action: 'review' }
    : { title, detail: `Keep up your reviews.${whenNext(c.nextReview, day)}`, action: null };
}

/** A crown in one line, for a title or a screen reader. */
export function crownWords(c: Crown, day: CrownDay) {
  const step = crownStep(c, day);
  const head = c.level ? `${CROWN_NAME[c.level]}, crown ${c.level} of ${MAX_CROWN}` : 'New, no crown yet';
  return step.title === CROWN_NAME[c.level] ? `${head}. ${step.detail}` : `${head}. ${step.title}. ${step.detail}`;
}

export interface CrownSummary {
  chapters: number;
  /** Chapters at the full crown. */
  mastered: number;
  /** Chapters below what their cards earned, because of overdue cards. */
  fading: number;
  /** Overdue cards fading them; each card fades one chapter, so none is counted twice. */
  overdue: number;
  /** How many chapters hold each level, highest level first, leaving out levels nobody holds. */
  levels: [level: CrownLevel, chapters: number][];
}

const LEVELS_DOWN = Array.from({ length: MAX_CROWN + 1 }, (_, i) => (MAX_CROWN - i) as CrownLevel);

export function crownSummary(crowns: Crown[]): CrownSummary {
  const fading = crowns.filter((c) => c.level < c.earned);
  return {
    chapters: crowns.length,
    mastered: crowns.filter((c) => c.level === MAX_CROWN).length,
    fading: fading.length,
    overdue: fading.reduce((n, c) => n + c.overdue, 0),
    levels: LEVELS_DOWN.map((l) => [l, crowns.filter((c) => c.level === l).length] as [CrownLevel, number]).filter(([, n]) => n),
  };
}

/** Per learned chapter, the crown the learner was last shown and the best they've been shown. */
export type CrownsSeen = Record<string, [level: number, best: number]>;

export interface CrownRise {
  key: string;
  level: CrownLevel;
  /** Back to a level shown before, after fading. */
  back: boolean;
}

/**
 * What went up since the learner last looked, highest first, and what to remember now. A fall is
 * remembered without a word, so winning the level back is news again; a chapter no longer learned
 * (its course was reset) is forgotten, best and all.
 */
export function crownRises(seen: CrownsSeen, current: Map<string, CrownLevel>) {
  const next: CrownsSeen = {};
  const rises: CrownRise[] = [];
  for (const [key, level] of current) {
    if (!level) continue;
    const [was, best] = seen[key] ?? [0, 0];
    next[key] = [level, Math.max(best, level)];
    if (level > was) rises.push({ key, level, back: level <= best });
  }
  const changed = JSON.stringify(Object.entries(next).sort()) !== JSON.stringify(Object.entries(seen).sort());
  return { rises: rises.sort((a, b) => b.level - a.level), next, changed };
}
