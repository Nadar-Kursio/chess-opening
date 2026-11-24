/* Daily quests: three a day, one from each slot, chosen from the learner and the date alone, so
   every page agrees on today's quests without storing them. Progress is read from today's saved
   sessions (fun.ts). Pure, so tests/fun.test.ts can pin the choice down. */

/** What the learner has done today, from the learner's own calendar day. */
export interface Today {
  moves: number;
  sessions: number;
  courses: number;
  learned: number;
  cleanDrills: number;
  perfectQuizzes: number;
  recallRounds: number;
  rushBest: number;
  rushCombo: number;
  rushRuns: number;
}

export interface QuestDef {
  id: string;
  title: string;
  metric: keyof Today;
  goal: number;
  /** Where to go to work on it. */
  href: string;
  /** Only offered to a learner who already has Recall cards from before today. */
  needsDeck?: boolean;
}

const SLOTS: QuestDef[][] = [
  [
    { id: 'moves-20', title: 'Find 20 moves', metric: 'moves', goal: 20, href: '/' },
    { id: 'moves-40', title: 'Find 40 moves', metric: 'moves', goal: 40, href: '/' },
    { id: 'moves-60', title: 'Find 60 moves', metric: 'moves', goal: 60, href: '/' },
  ],
  [
    { id: 'learn', title: 'Learn a new chapter', metric: 'learned', goal: 1, href: '/' },
    { id: 'recall', title: 'Finish a Recall round', metric: 'recallRounds', goal: 1, href: '/recall', needsDeck: true },
    { id: 'clean-drill', title: 'Drill a chapter without a slip', metric: 'cleanDrills', goal: 1, href: '/' },
    { id: 'perfect-quiz', title: 'Ace a quiz with no mistakes', metric: 'perfectQuizzes', goal: 1, href: '/' },
    { id: 'two-courses', title: 'Practise two different courses', metric: 'courses', goal: 2, href: '/' },
  ],
  [
    { id: 'rush-15', title: 'Score 15 in Opening Rush', metric: 'rushBest', goal: 15, href: '/play/rush' },
    { id: 'rush-combo', title: 'Hit a combo of 8 in Opening Rush', metric: 'rushCombo', goal: 8, href: '/play/rush' },
    { id: 'rush-runs', title: 'Play 3 Opening Rush runs', metric: 'rushRuns', goal: 3, href: '/play/rush' },
    { id: 'sessions-3', title: 'Finish 3 sessions', metric: 'sessions', goal: 3, href: '/' },
  ],
];

export const QUEST_DEFS = SLOTS.flat();

/** FNV-1a: a small, stable string hash, the same on every server. */
export function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function dayBefore(day: string) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Today's three quests for this learner. `hasDeck`: they had Recall cards before today began. */
export function questsFor(userId: string, day: string, { hasDeck }: { hasDeck: boolean }): QuestDef[] {
  return SLOTS.map((slot, s) => {
    const pool = slot.filter((q) => hasDeck || !q.needsDeck);
    const pick = (d: string) => hash(`${userId}:${d}:${s}`) % pool.length;
    let i = pick(day);
    // Yesterday's pick in this slot steps aside, so the same quest doesn't come up two days running.
    if (pool.length > 1 && i === pick(dayBefore(day))) i = (i + 1) % pool.length;
    return pool[i];
  });
}

export interface QuestState extends QuestDef {
  value: number;
  done: boolean;
  share: number;
}

export function questStates(quests: QuestDef[], today: Today): QuestState[] {
  return quests.map((q) => {
    const value = Math.min(q.goal, today[q.metric]);
    return { ...q, value, done: value >= q.goal, share: value / q.goal };
  });
}

export function questById(id: string) {
  return QUEST_DEFS.find((q) => q.id === id) ?? null;
}
