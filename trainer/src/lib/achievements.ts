import type { Tier } from './xp.ts';

/* Badges: each is a family with up to three tiers, measured from totals fun.ts reads. A tier is
   unlocked the first time its goal is met and stays unlocked (fun.ts stores the date), so resetting
   a course never takes a badge away. Pure, so the rules are tested in tests/fun.test.ts. */

/** All-time totals a badge can be measured against. */
export interface Totals {
  moves: number;
  learned: number;
  longestStreak: number;
  coursesFinished: number;
  longTerm: number;
  perfectQuizzes: number;
  rushBest: number;
  sparSessions: number;
  gameSessions: number;
  questDays: number;
  /** Chapters at the full crown right now. */
  fullCrowns: number;
  /** Different trap courses the learner has sprung in a real game or a sparring game. */
  trapsSprung: number;
}

export type Emblem = 'book' | 'flame' | 'target' | 'crown' | 'brain' | 'star' | 'bolt' | 'swords' | 'board' | 'flag' | 'trap' | 'jewels';

export interface BadgeDef {
  id: string;
  name: string;
  emblem: Emblem;
  metric: keyof Totals;
  /** Goals in rising order, each with the line shown under the badge. */
  tiers: { goal: number; label: string }[];
}

export const BADGES: BadgeDef[] = [
  {
    id: 'chapters',
    name: 'Student',
    emblem: 'book',
    metric: 'learned',
    tiers: [
      { goal: 1, label: 'Learn your first chapter' },
      { goal: 10, label: 'Learn 10 chapters' },
      { goal: 25, label: 'Learn 25 chapters' },
    ],
  },
  {
    id: 'streak',
    name: 'On a Roll',
    emblem: 'flame',
    metric: 'longestStreak',
    tiers: [
      { goal: 3, label: 'Practise 3 days in a row' },
      { goal: 7, label: 'Practise 7 days in a row' },
      { goal: 30, label: 'Practise 30 days in a row' },
    ],
  },
  {
    id: 'moves',
    name: 'Move Finder',
    emblem: 'target',
    metric: 'moves',
    tiers: [
      { goal: 100, label: 'Find 100 moves' },
      { goal: 1000, label: 'Find 1,000 moves' },
      { goal: 10000, label: 'Find 10,000 moves' },
    ],
  },
  {
    id: 'courses',
    name: 'Repertoire',
    emblem: 'crown',
    metric: 'coursesFinished',
    tiers: [
      { goal: 1, label: 'Finish every step of a course' },
      { goal: 3, label: 'Finish 3 courses' },
    ],
  },
  {
    id: 'memory',
    name: 'Long-Term Memory',
    emblem: 'brain',
    metric: 'longTerm',
    tiers: [
      { goal: 10, label: 'Hold 10 moves in long-term memory' },
      { goal: 50, label: 'Hold 50 moves in long-term memory' },
      { goal: 200, label: 'Hold 200 moves in long-term memory' },
    ],
  },
  {
    id: 'quiz',
    name: 'Perfect Quiz',
    emblem: 'star',
    metric: 'perfectQuizzes',
    tiers: [
      { goal: 1, label: 'Score 100% on a quiz' },
      { goal: 10, label: 'Score 100% on 10 quizzes' },
    ],
  },
  {
    id: 'rush',
    name: 'Opening Rush',
    emblem: 'bolt',
    metric: 'rushBest',
    tiers: [
      { goal: 10, label: 'Score 10 in Opening Rush' },
      { goal: 20, label: 'Score 20 in Opening Rush' },
      { goal: 30, label: 'Score 30 in Opening Rush' },
    ],
  },
  {
    id: 'spar',
    name: 'Sparring Partner',
    emblem: 'swords',
    metric: 'sparSessions',
    tiers: [
      { goal: 1, label: 'Finish a sparring game' },
      { goal: 10, label: 'Finish 10 sparring games' },
    ],
  },
  {
    id: 'games',
    name: 'Game Detective',
    emblem: 'board',
    metric: 'gameSessions',
    tiers: [
      { goal: 1, label: 'Study one of your own games' },
      { goal: 10, label: 'Study 10 of your own games' },
    ],
  },
  {
    id: 'crowned',
    name: 'Crowned',
    emblem: 'jewels',
    metric: 'fullCrowns',
    tiers: [{ goal: 1, label: 'Earn the full crown on a chapter' }],
  },
  {
    id: 'traps',
    name: 'Trap Setter',
    emblem: 'trap',
    metric: 'trapsSprung',
    tiers: [
      { goal: 1, label: 'Spring a trap in one of your games' },
      { goal: 5, label: 'Spring 5 different traps' },
    ],
  },
  {
    id: 'quests',
    name: 'Quest Hunter',
    emblem: 'flag',
    metric: 'questDays',
    tiers: [
      { goal: 1, label: 'Clear all three daily quests' },
      { goal: 7, label: 'Clear all three quests on 7 days' },
    ],
  },
];

/** A family's tiers take the top of bronze, silver, gold: one tier is gold, two are silver and gold. */
export function tierName(def: BadgeDef, index: number): Tier {
  const names: Tier[] = ['bronze', 'silver', 'gold'];
  return names[names.length - def.tiers.length + index];
}

export interface TierState {
  index: number;
  tier: Tier;
  goal: number;
  label: string;
  unlocked: boolean;
  /** When it was unlocked, for a tier stored as unlocked. */
  at: string | null;
}

export interface BadgeState {
  def: BadgeDef;
  value: number;
  tiers: TierState[];
  /** The highest unlocked tier, if any. */
  top: TierState | null;
  /** The next tier to aim for, and how far along it is (0 to 1). */
  next: TierState | null;
  share: number;
}

/** A stored unlock, as fun.ts reads it. */
export interface Unlock {
  badge: string;
  tier: number;
  at: string;
}

/** Every badge measured against the totals, with what's already stored as unlocked. */
export function badgeStates(totals: Totals, unlocks: Unlock[] = []): BadgeState[] {
  const stored = new Map(unlocks.map((u) => [`${u.badge}:${u.tier}`, u.at]));
  return BADGES.map((def) => {
    const value = totals[def.metric];
    const tiers = def.tiers.map((t, index): TierState => {
      const at = stored.get(`${def.id}:${index}`) ?? null;
      return { index, tier: tierName(def, index), ...t, unlocked: at !== null || value >= t.goal, at };
    });
    const top = tiers.filter((t) => t.unlocked).at(-1) ?? null;
    const next = tiers.find((t) => !t.unlocked) ?? null;
    const floor = top?.goal ?? 0;
    const share = next ? Math.max(0, Math.min(1, (value - floor) / (next.goal - floor))) : 1;
    return { def, value, tiers, top, next, share };
  });
}

/** Tiers whose goal is met now but that aren't stored yet: what fun.ts saves and announces. */
export function newlyMet(totals: Totals, unlocks: Unlock[]) {
  const stored = new Set(unlocks.map((u) => `${u.badge}:${u.tier}`));
  const out: { badge: string; tier: number }[] = [];
  for (const def of BADGES) {
    def.tiers.forEach((t, index) => {
      if (totals[def.metric] >= t.goal && !stored.has(`${def.id}:${index}`)) out.push({ badge: def.id, tier: index });
    });
  }
  return out;
}

export function tierCounts(unlocks: Pick<Unlock, 'badge' | 'tier'>[]): Record<Tier, number> {
  const counts: Record<Tier, number> = { bronze: 0, silver: 0, gold: 0 };
  for (const u of unlocks) {
    const def = BADGES.find((b) => b.id === u.badge);
    if (def && def.tiers[u.tier]) counts[tierName(def, u.tier)]++;
  }
  return counts;
}

export function badgeById(id: string) {
  return BADGES.find((b) => b.id === id) ?? null;
}

/** The longest run of consecutive days in a list of 'YYYY-MM-DD' days, in any order. */
export function longestRun(days: string[]) {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of sorted) {
    const t = Date.parse(`${d}T12:00:00Z`) / 86_400_000;
    run = prev !== null && Math.round(t - prev) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}
