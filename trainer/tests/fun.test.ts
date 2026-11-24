import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { BADGES, badgeStates, longestRun, newlyMet, tierCounts, tierName, type Totals } from '../src/lib/achievements.ts';
import { positionKey, toMove } from '../src/lib/course.ts';
import { QUEST_DEFS, questStates, questsFor, type Today } from '../src/lib/quests.ts';
import { lineCards } from '../src/lib/recall.ts';
import { POOL_SIZE, multiplier, rushOrder, rushPool } from '../src/lib/rush.ts';
import type { Opening } from '../src/lib/types.ts';
import { GAME_MOVES_CAP, RANKS, XP, gameXp, levelFor, levelStart, rankName, totalXp, xpParts, type XpSource } from '../src/lib/xp.ts';

const ROOT = process.env.CONTENT_DIR ?? path.join(import.meta.dirname, '..', 'content');
const openings = new Map<string, Opening>(
  readdirSync(path.join(ROOT, 'openings')).map((f) => {
    const op = JSON.parse(readFileSync(path.join(ROOT, 'openings', f), 'utf8')) as Opening;
    return [op.id, op];
  }),
);
const london = openings.get('london')!;

/** A repeatable generator, so a shuffle can be asserted on. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- XP and levels ---------- */

const NONE: XpSource = {
  moves: 0,
  learned: 0,
  drilled: 0,
  tested: 0,
  quizzed: 0,
  perfectQuizzes: 0,
  recalled: 0,
  longTerm: 0,
  rushPoints: 0,
  questsCleared: 0,
  questDays: 0,
  games: 0,
  tiers: { bronze: 0, silver: 0, gold: 0 },
};

test('XP adds every source at its rate and lists only what earned some', () => {
  assert.equal(totalXp(NONE), 0);
  assert.deepEqual(xpParts(NONE), []);
  const s: XpSource = {
    ...NONE,
    moves: 100,
    learned: 2,
    quizzed: 1,
    perfectQuizzes: 1,
    recalled: 10,
    longTerm: 3,
    rushPoints: 17,
    questsCleared: 3,
    questDays: 1,
    tiers: { bronze: 1, silver: 1, gold: 0 },
  };
  const expected =
    100 * XP.move + 2 * XP.learned + XP.quizzed + XP.perfectQuiz + 10 * XP.recalled + 3 * XP.longTerm + 17 * XP.rushPoint +
    3 * XP.quest + XP.questDay + XP.tier.bronze + XP.tier.silver;
  assert.equal(totalXp(s), expected);
  const parts = xpParts(s);
  assert.equal(parts[0].label, 'Moves found');
  for (let i = 1; i < parts.length; i++) assert.ok(parts[i - 1].xp >= parts[i].xp, 'largest first');
});

test('a real game pays for its book moves up to a cap, its line end and a trap sprung', () => {
  assert.equal(gameXp({ bookMoves: 0, reachedEnd: false, sprung: false }), 0);
  assert.equal(gameXp({ bookMoves: 5, reachedEnd: false, sprung: false }), 5 * XP.gameMove);
  assert.equal(gameXp({ bookMoves: 40, reachedEnd: false, sprung: false }), GAME_MOVES_CAP * XP.gameMove);
  assert.equal(gameXp({ bookMoves: 8, reachedEnd: true, sprung: true }), 8 * XP.gameMove + XP.gameEnd + XP.gameTrap);
  assert.ok(XP.gameTrap > XP.gameEnd, 'a trap is the bigger bonus');
  const parts = xpParts({ ...NONE, moves: 10, games: 70 });
  assert.deepEqual(parts[0], { label: 'Your games', xp: 70 });
});

test('each level takes 100 XP more than the last', () => {
  assert.equal(levelStart(1), 0);
  assert.equal(levelStart(2), 100);
  assert.equal(levelStart(3), 300);
  assert.equal(levelStart(4), 600);
  for (let l = 1; l < 80; l++) assert.equal(levelStart(l + 1) - levelStart(l), 100 * l);
});

test('levelFor lands on the right level at and around every boundary', () => {
  assert.deepEqual(levelFor(0), { level: 1, name: 'Pawn', xp: 0, into: 0, span: 100, share: 0 });
  assert.equal(levelFor(-5).level, 1);
  assert.equal(levelFor(99).level, 1);
  for (let l = 2; l < 80; l++) {
    assert.equal(levelFor(levelStart(l)).level, l, `exactly level ${l}`);
    assert.equal(levelFor(levelStart(l) - 1).level, l - 1, `just below level ${l}`);
  }
  const mid = levelFor(levelStart(5) + 250);
  assert.equal(mid.level, 5);
  assert.equal(mid.into, 250);
  assert.equal(mid.span, 500);
  assert.equal(mid.share, 0.5);
});

test('ranks run from the pieces to the titles, in level order', () => {
  assert.equal(rankName(1), 'Pawn');
  assert.equal(rankName(2), 'Pawn');
  assert.equal(rankName(3), 'Knight');
  assert.equal(rankName(30), 'International Master');
  assert.equal(rankName(99), 'World Champion');
  for (let i = 1; i < RANKS.length; i++) assert.ok(RANKS[i].from > RANKS[i - 1].from);
});

/* ---------- achievements ---------- */

const ZERO: Totals = {
  moves: 0,
  learned: 0,
  longestStreak: 0,
  coursesFinished: 0,
  longTerm: 0,
  perfectQuizzes: 0,
  rushBest: 0,
  sparSessions: 0,
  gameSessions: 0,
  questDays: 0,
  fullCrowns: 0,
  trapsSprung: 0,
};

test('about twenty badge tiers, with unique ids and rising goals', () => {
  const tiers = BADGES.reduce((n, b) => n + b.tiers.length, 0);
  assert.ok(tiers >= 18 && tiers <= 30, `${tiers} tiers`);
  assert.equal(new Set(BADGES.map((b) => b.id)).size, BADGES.length);
  for (const b of BADGES) {
    assert.ok(b.tiers.length >= 1 && b.tiers.length <= 3);
    for (let i = 1; i < b.tiers.length; i++) assert.ok(b.tiers[i].goal > b.tiers[i - 1].goal, b.id);
    assert.equal(tierName(b, b.tiers.length - 1), 'gold', `${b.id} tops out at gold`);
  }
  for (const metric of ['sparSessions', 'gameSessions', 'rushBest', 'fullCrowns', 'trapsSprung'] as const) {
    assert.ok(BADGES.some((b) => b.metric === metric), `a badge for ${metric}`);
  }
});

test('a tier unlocks when its goal is met, and progress is measured to the next one', () => {
  const states = badgeStates({ ...ZERO, moves: 550, longestStreak: 7, rushBest: 9 });
  const moves = states.find((b) => b.def.id === 'moves')!;
  assert.equal(moves.top?.goal, 100);
  assert.equal(moves.next?.goal, 1000);
  assert.equal(moves.share, 0.5);
  const streak = states.find((b) => b.def.id === 'streak')!;
  assert.deepEqual(streak.tiers.map((t) => t.unlocked), [true, true, false]);
  const rush = states.find((b) => b.def.id === 'rush')!;
  assert.equal(rush.top, null);
  assert.equal(rush.share, 0.9);
  const maxed = badgeStates({ ...ZERO, moves: 20_000 }).find((b) => b.def.id === 'moves')!;
  assert.equal(maxed.next, null);
  assert.equal(maxed.share, 1);
});

test('a stored unlock stays unlocked when the totals drop, and is never met twice', () => {
  const unlocks = [{ badge: 'chapters', tier: 1, at: '2026-11-01' }];
  const chapters = badgeStates(ZERO, unlocks).find((b) => b.def.id === 'chapters')!;
  assert.equal(chapters.tiers[1].unlocked, true);
  assert.equal(chapters.tiers[1].at, '2026-11-01');
  assert.equal(chapters.top?.index, 1);
  const met = newlyMet({ ...ZERO, learned: 12 }, unlocks);
  assert.deepEqual(met.filter((m) => m.badge === 'chapters'), [{ badge: 'chapters', tier: 0 }]);
  assert.deepEqual(newlyMet(ZERO, []), []);
});

test('tier counts follow each family’s own tiers', () => {
  // `courses` has two tiers, silver then gold; `moves` has three.
  assert.deepEqual(
    tierCounts([
      { badge: 'courses', tier: 0 },
      { badge: 'moves', tier: 0 },
      { badge: 'moves', tier: 2 },
      { badge: 'gone', tier: 0 },
    ]),
    { bronze: 1, silver: 1, gold: 1 },
  );
});

test('the longest streak counts consecutive days only', () => {
  assert.equal(longestRun([]), 0);
  assert.equal(longestRun(['2026-11-03']), 1);
  assert.equal(longestRun(['2026-11-03', '2026-11-01', '2026-11-02', '2026-11-05']), 3);
  assert.equal(longestRun(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-01']), 3);
});

/* ---------- daily quests ---------- */

const QUIET: Today = {
  moves: 0,
  sessions: 0,
  courses: 0,
  learned: 0,
  cleanDrills: 0,
  perfectQuizzes: 0,
  recallRounds: 0,
  rushBest: 0,
  rushCombo: 0,
  rushRuns: 0,
};

test('three quests a day, the same every time for the same learner and day', () => {
  const a = questsFor('user-1', '2026-11-24', { hasDeck: true });
  assert.equal(a.length, 3);
  assert.equal(new Set(a.map((q) => q.id)).size, 3);
  assert.deepEqual(questsFor('user-1', '2026-11-24', { hasDeck: true }), a);
  const days = Array.from({ length: 60 }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10));
  const seen = new Set(days.flatMap((d) => questsFor('user-1', d, { hasDeck: true }).map((q) => q.id)));
  assert.equal(seen.size, QUEST_DEFS.length, 'every quest comes up over two months');
  const others = days.filter((d) => questsFor('user-2', d, { hasDeck: true }).map((q) => q.id).join() !== questsFor('user-1', d, { hasDeck: true }).map((q) => q.id).join());
  assert.ok(others.length > 30, 'learners get different quests');
});

test('the Recall quest only goes to a learner with a deck', () => {
  for (let i = 0; i < 200; i++) {
    const day = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
    assert.ok(!questsFor('newcomer', day, { hasDeck: false }).some((q) => q.needsDeck));
  }
});

test('quest progress is capped at the goal and done when it is reached', () => {
  const quests = questsFor('user-1', '2026-11-24', { hasDeck: true });
  const quiet = questStates(quests, QUIET);
  assert.ok(quiet.every((q) => !q.done && q.value === 0 && q.share === 0));
  const busy = questStates(quests, {
    moves: 500,
    sessions: 9,
    courses: 3,
    learned: 2,
    cleanDrills: 1,
    perfectQuizzes: 1,
    recallRounds: 2,
    rushBest: 31,
    rushCombo: 12,
    rushRuns: 4,
  });
  assert.ok(busy.every((q) => q.done && q.value === q.goal && q.share === 1));
});

/* ---------- Opening Rush ---------- */

const isLegal = (legal: string | undefined, uci: string) => {
  const i = legal?.indexOf(uci) ?? -1;
  return i >= 0 && i % 4 === 0;
};

test('Rush asks only learned chapters, from the learner’s chair, with legal answers', () => {
  const learned = [london.lines[0].slug, london.lines[1].slug];
  const keys = new Set(learned.flatMap((s) => lineCards(london, s)));
  const { positions, fromLearned } = rushPool([{ op: london, learned }], seeded(1));
  assert.equal(fromLearned, true);
  assert.equal(positions.length, Math.min(POOL_SIZE, keys.size));
  for (const p of positions) {
    const here = p.history.at(-1)!;
    const key = positionKey(here as Parameters<typeof positionKey>[0]);
    assert.ok(keys.has(key), `${p.id} isn't from a learned chapter`);
    assert.equal(toMove(here as Parameters<typeof toMove>[0]), p.side, 'the learner is to move');
    assert.ok(p.accept.length > 0);
    assert.ok(p.accept.some((a) => a.uci === p.answer.uci), 'the shown answer is accepted');
    for (const a of p.accept) {
      assert.ok(isLegal(here.legal, a.uci), `${a.uci} is not legal in ${p.id}`);
      assert.equal(a.step.turn, p.side);
    }
    for (const h of p.history.slice(0, -1)) assert.equal(h.legal, undefined, 'only the asked position ships legal moves');
  }
});

test('Rush falls back to every course position when nothing is learned', () => {
  const { positions, fromLearned } = rushPool([{ op: london, learned: [] }], seeded(2), 10_000);
  assert.equal(fromLearned, false);
  const all = new Set(london.lines.flatMap((l) => lineCards(london, l.slug)));
  assert.equal(positions.length, all.size);
  // Across courses, only learned chapters count once any course has one.
  const other = [...openings.values()].find((o) => o.id !== 'london')!;
  const mixed = rushPool([{ op: london, learned: [london.lines[0].slug] }, { op: other, learned: [] }], seeded(3), 10_000);
  assert.ok(mixed.fromLearned);
  assert.ok(mixed.positions.every((p) => p.openingId === 'london'));
});

test('Rush asks a position shared by two courses once', () => {
  const sources = [...openings.values()].map((op) => ({ op, learned: [] as string[] }));
  const { positions } = rushPool(sources, seeded(4), 100_000);
  const keys = positions.map((p) => p.id.split(':')[1]);
  assert.equal(new Set(keys).size, keys.length);
});

test('a position two courses teach accepts either course’s move', () => {
  const ruy = openings.get('ruylopez')!;
  const { positions } = rushPool([{ op: london, learned: [] }, { op: ruy, learned: [] }], seeded(7), 100_000);
  const start = positions.find((p) => p.depth === 0)!;
  assert.ok(start, 'the starting position is asked');
  const moves = start.accept.map((a) => a.uci);
  assert.ok(moves.includes('d2d4') && moves.includes('e2e4'), moves.join());
});

test('a Rush pool is capped, and its order leans from shallow to deep', () => {
  const sources = [...openings.values()].map((op) => ({ op, learned: [] as string[] }));
  const { positions } = rushPool(sources, seeded(5));
  assert.equal(positions.length, POOL_SIZE);
  const order = rushOrder(positions, seeded(6));
  assert.equal(order.length, positions.length);
  assert.deepEqual(new Set(order), new Set(positions));
  const half = Math.floor(order.length / 2);
  const mean = (xs: typeof order) => xs.reduce((n, p) => n + p.depth, 0) / xs.length;
  assert.ok(mean(order.slice(0, half)) < mean(order.slice(half)), 'the first half is shallower');
  assert.deepEqual(rushOrder(positions, seeded(6)), order, 'the same seed gives the same order');
});

test('the combo multiplier steps up at 5, 10 and 20 in a row', () => {
  assert.deepEqual([0, 4, 5, 9, 10, 19, 20, 50].map(multiplier), [1, 1, 2, 2, 3, 3, 4, 4]);
  // Twenty right answers in a row: five at each of x1 and x2, ten at x3.
  let combo = 0;
  let score = 0;
  for (let i = 0; i < 20; i++) score += multiplier(combo++);
  assert.equal(score, 5 + 10 + 30);
});
