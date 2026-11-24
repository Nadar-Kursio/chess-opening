import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FAMILIAR_DAYS, MAX_CROWN, crownOf, crownSummary, type CrownCard } from '../src/lib/crowns.ts';
import { MASTERED_DAYS } from '../src/lib/memory.ts';

const DAY = 86_400_000;
const today = new Date('2026-11-24T00:00:00Z');
const keys = ['a', 'b', 'c', 'd'];
const later = new Date(today.getTime() + 3 * DAY);

function deck(...cards: Partial<CrownCard>[]) {
  return new Map(cards.map((c, i) => [keys[i], { reps: 1, stability: 1, due: later, ...c }]));
}

test('a chapter not learned has no crown, whatever cards it shares', () => {
  const c = crownOf(false, keys, deck({}, {}, {}, {}), today);
  assert.equal(c.level, 0);
  assert.match(c.next!, /Learn/);
});

test('learned is level 1 until every move has been answered once', () => {
  assert.equal(crownOf(true, keys, new Map(), today).level, 1);
  const c = crownOf(true, keys, deck({}, {}, {}, { reps: 0 }), today);
  assert.equal(c.level, 1);
  assert.equal(c.next, 'Recall 1 move once');
});

test('the crown rises with the weakest card, up to long-term memory', () => {
  const s = (stability: number) => ({ stability });
  assert.equal(crownOf(true, keys, deck(s(2), s(30), s(30), s(30)), today).level, 2);
  assert.equal(crownOf(true, keys, deck(s(FAMILIAR_DAYS), s(8), s(10), s(12)), today).level, 3);
  const half = crownOf(true, keys, deck(s(FAMILIAR_DAYS), s(8), s(MASTERED_DAYS), s(40)), today);
  assert.equal(half.level, 4);
  assert.equal(half.next, '2 moves left to reach long-term memory');
  const full = crownOf(true, keys, deck(s(MASTERED_DAYS), s(30), s(40), s(90)), today);
  assert.equal(full.level, MAX_CROWN);
  assert.equal(full.next, null);
});

test('a position listed twice in a chapter counts once', () => {
  const c = crownOf(true, ['a', 'a', 'b'], deck({ stability: 30 }, { stability: 30 }), today);
  assert.equal(c.level, 5);
});

test('a card due today is on time; overdue cards cost a level, and another per week', () => {
  const s = MASTERED_DAYS;
  const dueToday = new Date(today.getTime() + DAY / 2);
  assert.equal(crownOf(true, keys, deck({ stability: s, due: dueToday }, { stability: s }, { stability: s }, { stability: s }), today).level, 5);

  const yesterday = new Date(today.getTime() - DAY);
  const late = crownOf(true, keys, deck({ stability: s, due: yesterday }, { stability: s, due: yesterday }, { stability: s }, { stability: s }), today);
  assert.deepEqual([late.level, late.earned, late.overdue], [4, 5, 2]);
  assert.equal(late.next, 'Recall 2 moves overdue to win back a level');

  const weeks = new Date(today.getTime() - 15 * DAY);
  assert.equal(crownOf(true, keys, deck({ stability: s, due: weeks }, { stability: s }, { stability: s }, { stability: s }), today).level, 2);
});

test('overdue cards never take a learned chapter below level 1', () => {
  const ages = new Date(today.getTime() - 200 * DAY);
  const c = crownOf(true, keys, deck({ stability: 3, due: ages }, { stability: 3 }, { stability: 3 }, { stability: 3 }), today);
  assert.equal(c.level, 1);
  assert.equal(c.earned, 2);
});

test('the course summary adds the levels and counts full and fading crowns', () => {
  const s = MASTERED_DAYS;
  const yesterday = new Date(today.getTime() - DAY);
  const crowns = [
    crownOf(true, keys, deck({ stability: s }, { stability: s }, { stability: s }, { stability: s }), today),
    crownOf(true, keys, deck({ stability: s, due: yesterday }, { stability: s }, { stability: s }, { stability: s }), today),
    crownOf(false, keys, new Map(), today),
  ];
  assert.deepEqual(crownSummary(crowns), { levels: 9, possible: 15, full: 1, fading: 1 });
});
