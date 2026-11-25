import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FAMILIAR_DAYS,
  MAX_CROWN,
  courseCrowns,
  crownForecast,
  crownOf,
  crownRises,
  crownStep,
  crownSummary,
  type CrownCard,
  type CrownDay,
  type CrownLevel,
  type CrownView,
} from '../src/lib/crowns.ts';
import { MASTERED_DAYS, newCard } from '../src/lib/memory.ts';

const DAY = 86_400_000;
const start = new Date('2026-11-24T00:00:00Z');
const day = { start, now: new Date(start.getTime() + 10 * 3_600_000) };
const keys = ['a', 'b', 'c', 'd'];
const later = new Date(start.getTime() + 3 * DAY);
const ago = (days: number) => new Date(start.getTime() - days * DAY);

function card(c: Partial<CrownCard>): CrownCard {
  return { ...newCard(ago(30)), state: 2, reps: 1, stability: 1, difficulty: 5, due: later, last_review: ago(1), ...c };
}

function deck(...cards: Partial<CrownCard>[]) {
  return new Map(cards.map((c, i) => [keys[i], card(c)]));
}

const s = (stability: number) => ({ stability });

function view(learned: boolean, k: string[], cards: Map<string, CrownCard>, at: CrownDay, owned?: string[]): CrownView {
  const c = crownOf(learned, k, cards, at, owned);
  return { ...c, ...crownForecast(c, k, cards, at) };
}

test('a chapter not learned is New, whatever cards it shares', () => {
  const c = view(false, keys, deck({}, {}, {}, {}), day);
  assert.equal(c.level, 0);
  assert.equal(crownStep(c, day).title, 'Not learned yet');
});

test('a learned chapter with no moves to ask is Learned, with nothing left to do', () => {
  const c = view(true, [], new Map(), day);
  assert.deepEqual([c.level, c.earned, c.toGo], [1, 1, 0]);
  assert.deepEqual(crownStep(c, day), { title: 'Learned', detail: 'This chapter has no moves for Recall to ask.', action: null });
});

test('learned is level 1 until every move has been answered once', () => {
  assert.equal(view(true, keys, new Map(), day).level, 1);
  const c = view(true, keys, deck({}, {}, {}, { reps: 0 }), day);
  assert.equal(c.level, 1);
  assert.equal(c.toGo, 1);
  assert.deepEqual(crownStep(c, day), {
    title: '1 move to go for Practised',
    detail: 'Answer each move once, in Drill, Test or Recall.',
    action: 'answer',
  });
});

test('the crown rises with the weakest card, up to long-term memory', () => {
  assert.equal(view(true, keys, deck(s(2), s(30), s(30), s(30)), day).level, 2);
  assert.equal(view(true, keys, deck(s(FAMILIAR_DAYS), s(8), s(10), s(12)), day).level, 3);
  const half = view(true, keys, deck(s(FAMILIAR_DAYS), s(8), s(MASTERED_DAYS), s(40)), day);
  assert.equal(half.level, 4);
  assert.equal(half.toGo, 2);
  const full = view(true, keys, deck(s(MASTERED_DAYS), s(30), s(40), s(90)), day);
  assert.equal(full.level, MAX_CROWN);
  assert.equal(full.toGo, 0);
  assert.equal(full.eta, null);
});

test('a position listed twice in a chapter counts once', () => {
  const c = view(true, ['a', 'a', 'b'], deck(s(30), s(30)), day);
  assert.equal(c.level, 5);
});

test('the next level comes with a date, if every review is on time and right', () => {
  const c = view(true, keys, deck(s(2), s(10), s(10), s(10)), day);
  assert.equal(c.level, 2);
  assert.ok(c.eta && c.eta.getTime() >= later.getTime(), 'not before the weak card is next asked');
  const step = crownStep(c, day);
  assert.match(step.title, /^Solid in about \d+ days$/);
  assert.equal(step.action, null);
  assert.equal(step.detail, 'Keep up your reviews. The next is due in 3 days.');

  // A weak card due today is the one review between the chapter and Solid.
  const today = view(true, keys, deck({ stability: 5, due: day.now }, s(10), s(10), s(10)), day);
  assert.equal(today.due, 1);
  assert.deepEqual(crownStep(today, day), {
    title: 'Solid with today’s reviews',
    detail: 'Keep up your reviews: 1 move due today.',
    action: 'review',
  });

  // Moves reviewed together pass Strong on the way: the step names the level that review reaches.
  const together = view(true, keys, deck(s(10), s(10), s(10), s(10)), day);
  assert.deepEqual([together.level, together.reach], [3, 5]);
  assert.match(crownStep(together, day).title, /^Mastered in about \d+ days$/);

  // Strong needs only the soonest half: the far-off card doesn't hold it back.
  const strong = view(true, keys, deck(s(MASTERED_DAYS), s(20), { stability: 8, due: new Date(start.getTime() + 40 * DAY) }, s(9)), day);
  assert.equal(strong.level, 3);
  assert.equal(strong.toGo, 1);
  assert.ok(strong.eta!.getTime() < new Date(start.getTime() + 40 * DAY).getTime());
});

test('a card due today is on time; overdue cards cost a level, and another per week', () => {
  const m = MASTERED_DAYS;
  const dueToday = new Date(start.getTime() + DAY / 2);
  const onTime = view(true, keys, deck({ stability: m, due: dueToday }, s(m), s(m), s(m)), day);
  assert.deepEqual([onTime.level, onTime.due], [5, 1]);
  assert.equal(crownStep(onTime, day).action, 'review');

  const late = view(true, keys, deck({ stability: m, due: ago(1) }, { stability: m, due: ago(1) }, s(m), s(m)), day);
  assert.deepEqual([late.level, late.earned, late.overdue, late.due], [4, 5, 2, 2]);
  assert.deepEqual(crownStep(late, day), {
    title: 'Fading: 2 moves overdue',
    detail: 'Review them to win back Mastered.',
    action: 'review',
  });

  assert.equal(view(true, keys, deck({ stability: m, due: ago(15) }, s(m), s(m), s(m)), day).level, 2);
});

test('overdue cards never take a learned chapter below level 1', () => {
  const c = view(true, keys, deck({ stability: 3, due: ago(200) }, s(3), s(3), s(3)), day);
  assert.equal(c.level, 1);
  assert.equal(c.earned, 2);
});

const learnedOn = (d: number) => ago(40 - d);

test('a shared move fades only the chapter learned first', () => {
  const cards = new Map([
    ['open', card({ stability: MASTERED_DAYS, due: ago(2) })],
    ['x1', card(s(MASTERED_DAYS))],
    ['y1', card(s(MASTERED_DAYS))],
  ]);
  const crowns = courseCrowns(
    [
      { slug: 'one', keys: ['open', 'x1'], learnedAt: learnedOn(1) },
      { slug: 'two', keys: ['open', 'y1'], learnedAt: learnedOn(2) },
    ],
    cards,
    day,
  );
  assert.deepEqual([crowns.get('one')!.level, crowns.get('one')!.overdue], [4, 1]);
  assert.deepEqual([crowns.get('two')!.level, crowns.get('two')!.overdue], [5, 0]);
  // The overdue card is still due in the second chapter's Recall.
  assert.equal(crowns.get('two')!.due, 1);

  // Not learned, the first chapter doesn't own it: the learned one does.
  const alone = courseCrowns(
    [
      { slug: 'one', keys: ['open', 'x1'], learnedAt: null },
      { slug: 'two', keys: ['open', 'y1'], learnedAt: learnedOn(2) },
    ],
    cards,
    day,
  );
  assert.equal(alone.get('two')!.level, 4);
});

test('learning an earlier chapter later does not move the fade, restore a crown or celebrate', () => {
  const cards = new Map([
    ['open', card({ stability: MASTERED_DAYS, due: ago(9) })],
    ['x1', card({ reps: 0, due: day.now })],
    ['y1', card(s(MASTERED_DAYS))],
  ]);
  const chapters = (oneLearned: Date | null) => [
    { slug: 'one', keys: ['open', 'x1'], learnedAt: oneLearned },
    { slug: 'two', keys: ['open', 'y1'], learnedAt: learnedOn(1) },
  ];
  const levels = (m: Map<string, { level: CrownLevel }>) => new Map([...m].map(([slug, c]) => [`c/${slug}`, c.level]));

  const before = courseCrowns(chapters(null), cards, day);
  assert.deepEqual([before.get('two')!.level, before.get('two')!.earned], [3, 5]);
  const shown = crownRises({}, levels(before)).next;

  // Chapter one comes first in the course but is learned second: chapter two keeps the overdue move.
  const after = courseCrowns(chapters(learnedOn(5)), cards, day);
  assert.deepEqual([after.get('two')!.level, after.get('two')!.overdue], [3, 1]);
  assert.equal(after.get('one')!.overdue, 0);
  assert.deepEqual(
    crownRises(shown, levels(after)).rises.filter((r) => r.key === 'c/two'),
    [],
  );
});

test('the course summary counts mastered and fading chapters', () => {
  const m = MASTERED_DAYS;
  const crowns = [
    view(true, keys, deck(s(m), s(m), s(m), s(m)), day),
    view(true, keys, deck({ stability: m, due: ago(1) }, s(m), s(m), s(m)), day),
    view(false, keys, new Map(), day),
  ];
  assert.deepEqual(crownSummary(crowns), {
    chapters: 3,
    mastered: 1,
    fading: 1,
    overdue: 1,
    levels: [
      [5, 1],
      [4, 1],
      [0, 1],
    ],
  });
});

test('a rise is news once; a fall is remembered quietly, so winning it back is news again', () => {
  const now = (entries: [string, CrownLevel][]) => new Map(entries);
  const first = crownRises({}, now([['c/one', 1]]));
  assert.deepEqual(first.rises, [{ key: 'c/one', level: 1, back: false }]);
  assert.ok(first.changed);

  const same = crownRises(first.next, now([['c/one', 1]]));
  assert.deepEqual(same.rises, []);
  assert.ok(!same.changed);

  const up = crownRises({ 'c/one': [3, 3] }, now([['c/one', 4], ['c/two', 2]]));
  assert.deepEqual(up.rises.map((r) => r.level), [4, 2]);

  const fell = crownRises({ 'c/one': [4, 4] }, now([['c/one', 3]]));
  assert.deepEqual(fell.rises, []);
  assert.deepEqual(fell.next, { 'c/one': [3, 4] });
  const back = crownRises(fell.next, now([['c/one', 4]]));
  assert.deepEqual(back.rises, [{ key: 'c/one', level: 4, back: true }]);

  const reset = crownRises({ 'c/one': [4, 4] }, now([['c/one', 0]]));
  assert.deepEqual(reset.next, {});
  assert.ok(reset.changed);
});
