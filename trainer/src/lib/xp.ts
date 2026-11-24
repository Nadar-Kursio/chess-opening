/* Experience and levels, derived from what the learner has already done: nothing here is stored
   except what can't be recomputed (badge unlocks and cleared quests, which fun.ts keeps). Pure, so
   tests/fun.test.ts can check the arithmetic. */

/** What XP is counted from: totals fun.ts reads from the progress tables. */
export interface XpSource {
  /** Correct moves in every saved session, whatever the mode. */
  moves: number;
  learned: number;
  drilled: number;
  tested: number;
  quizzed: number;
  perfectQuizzes: number;
  /** Recall answers found (review_log ratings above Again). */
  recalled: number;
  /** Cards whose stability has reached long-term memory. */
  longTerm: number;
  /** Points scored across every Opening Rush run. */
  rushPoints: number;
  questsCleared: number;
  /** Days on which all three quests were cleared. */
  questDays: number;
  /** Badge tiers unlocked, by tier. */
  tiers: Record<Tier, number>;
}

export type Tier = 'bronze' | 'silver' | 'gold';

export const XP = {
  move: 2,
  learned: 25,
  drilled: 25,
  tested: 40,
  quizzed: 40,
  perfectQuiz: 25,
  recalled: 1,
  longTerm: 5,
  rushPoint: 1,
  quest: 15,
  questDay: 50,
  tier: { bronze: 20, silver: 50, gold: 100 } satisfies Record<Tier, number>,
} as const;

export interface XpPart {
  label: string;
  xp: number;
}

/** Where the learner's XP came from, largest first, leaving out what hasn't earned any yet. */
export function xpParts(s: XpSource): XpPart[] {
  const parts: XpPart[] = [
    { label: 'Moves found', xp: s.moves * XP.move },
    {
      label: 'Chapter steps',
      xp: s.learned * XP.learned + s.drilled * XP.drilled + s.tested * XP.tested + s.quizzed * XP.quizzed,
    },
    { label: 'Perfect quizzes', xp: s.perfectQuizzes * XP.perfectQuiz },
    { label: 'Recall', xp: s.recalled * XP.recalled + s.longTerm * XP.longTerm },
    { label: 'Opening Rush', xp: s.rushPoints * XP.rushPoint },
    { label: 'Daily quests', xp: s.questsCleared * XP.quest + s.questDays * XP.questDay },
    {
      label: 'Badges',
      xp: s.tiers.bronze * XP.tier.bronze + s.tiers.silver * XP.tier.silver + s.tiers.gold * XP.tier.gold,
    },
  ];
  return parts.filter((p) => p.xp > 0).sort((a, b) => b.xp - a.xp);
}

export function totalXp(s: XpSource) {
  return xpParts(s).reduce((n, p) => n + p.xp, 0);
}

/* ---------- levels ---------- */

/** XP to go from level n to n + 1 grows by this much each level: 100, 200, 300 ... */
const STEP = 100;

/** Total XP at which `level` begins. Level 1 starts at 0. */
export function levelStart(level: number) {
  return (STEP / 2) * level * (level - 1);
}

/** The pieces first, then the titles a player earns over the board. Each holds from its level up. */
export const RANKS: { from: number; name: string }[] = [
  { from: 1, name: 'Pawn' },
  { from: 3, name: 'Knight' },
  { from: 5, name: 'Bishop' },
  { from: 7, name: 'Rook' },
  { from: 10, name: 'Queen' },
  { from: 13, name: 'King' },
  { from: 16, name: 'Club Player' },
  { from: 20, name: 'Candidate Master' },
  { from: 25, name: 'FIDE Master' },
  { from: 30, name: 'International Master' },
  { from: 40, name: 'Grandmaster' },
  { from: 50, name: 'World Champion' },
];

export function rankName(level: number) {
  let name = RANKS[0].name;
  for (const r of RANKS) if (level >= r.from) name = r.name;
  return name;
}

export interface Level {
  level: number;
  name: string;
  xp: number;
  /** XP earned since this level began, and how much the level spans. */
  into: number;
  span: number;
  /** 0 to 1: how far through the level. */
  share: number;
}

export function levelFor(xp: number): Level {
  const total = Math.max(0, Math.floor(xp));
  // Inverse of levelStart, then nudged to absorb floating point at the boundaries.
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (8 * total) / STEP)) / 2));
  while (levelStart(level + 1) <= total) level++;
  while (level > 1 && levelStart(level) > total) level--;
  const start = levelStart(level);
  const span = levelStart(level + 1) - start;
  return { level, name: rankName(level), xp: total, into: total - start, span, share: (total - start) / span };
}
