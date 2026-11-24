import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PositionMemory } from '../src/lib/mastery.ts';
import {
  bucketOf,
  calendar,
  dayLevel,
  fillDays,
  fillForecast,
  longestStreak,
  rollingAccuracy,
  shiftDay,
  stabilityCounts,
  sumDays,
  weakest,
  weakness,
} from '../src/lib/stats.ts';

test('days are filled in oldest first, with nothing on the days not practised', () => {
  const days = fillDays([{ day: '2026-11-22', moves: 12, found: 10, missed: 2 }], '2026-11-24', 5);
  assert.deepEqual(days.map((d) => d.day), ['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24']);
  assert.equal(days[2].moves, 12);
  assert.equal(days[4].moves, 0);
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28');
});

test('accuracy rolls over a week and stays empty until something is graded', () => {
  const days = fillDays(
    [
      { day: '2026-11-18', moves: 10, found: 8, missed: 2 },
      { day: '2026-11-20', moves: 10, found: 10, missed: 0 },
    ],
    '2026-11-26',
    10,
  );
  const acc = rollingAccuracy(days, 7);
  assert.equal(acc[0].pct, null);
  assert.equal(acc[1].pct, 80);
  assert.equal(acc[3].pct, 90);
  assert.equal(acc[3].graded, 20);
  // 11-25: the 18th has left the window, the 20th hasn't.
  assert.equal(acc[8].pct, 100);
  assert.equal(acc[8].graded, 10);
  const t = sumDays(days);
  assert.equal(t.moves, 20);
  assert.equal(t.accuracy, 90);
  assert.equal(t.active, 2);
});

test('the calendar is whole Monday weeks ending this week, levelled against the goal', () => {
  // 2026-11-24 is a Tuesday.
  const weeks = calendar([{ day: '2026-11-24', moves: 30 }, { day: '2026-11-23', moves: 70 }], '2026-11-24', 30, 53);
  assert.equal(weeks.length, 53);
  assert.ok(weeks.every((w) => w.length === 7));
  const last = weeks.at(-1)!;
  assert.equal(last[0].day, '2026-11-23');
  assert.equal(new Date(`${weeks[0][0].day}T12:00:00Z`).getUTCDay(), 1);
  assert.equal(last[0].level, 4);
  assert.equal(last[1].level, 3);
  assert.equal(last[2].future, true);
  assert.deepEqual([0, 5, 20, 30, 59, 60].map((n) => dayLevel(n, 30)), [0, 1, 2, 3, 3, 4]);
});

test('the longest streak counts consecutive days, whatever the order given', () => {
  assert.equal(longestStreak([]), 0);
  assert.equal(longestStreak(['2026-11-03', '2026-11-01', '2026-11-02', '2026-11-05', '2026-11-02']), 3);
  assert.equal(longestStreak(['2026-02-28', '2026-03-01']), 2);
});

test('cards fall into stability buckets at whole-day edges', () => {
  assert.equal(bucketOf({ reps: 0, stability: 40 }), 'new');
  assert.equal(bucketOf({ reps: 2, stability: 2 }), 'days');
  assert.equal(bucketOf({ reps: 2, stability: 3 }), 'week');
  assert.equal(bucketOf({ reps: 2, stability: 7 }), 'weeks');
  assert.equal(bucketOf({ reps: 2, stability: 21 }), 'months');
  assert.equal(bucketOf({ reps: 2, stability: 90 }), 'long');
  const counts = stabilityCounts([
    { reps: 0, stability: 0, n: 4 },
    { reps: 1, stability: 25, n: 3 },
    { reps: 1, stability: 26 },
  ]);
  assert.deepEqual(counts.map((b) => b.n), [4, 0, 0, 0, 4, 0]);
});

test('the week ahead counts overdue cards today', () => {
  assert.deepEqual(fillForecast([{ offset: -3, n: 2 }, { offset: 0, n: 1 }, { offset: 6, n: 5 }, { offset: 9, n: 1 }]), [3, 0, 0, 0, 0, 0, 5]);
});

const mem = (odds: number | null, misses = 0, hits = 0): PositionMemory => ({ level: 'learning', weak: false, odds, misses, hits, dueIn: 1 });

test('the weakest positions are the likeliest forgotten and the most missed, each once', () => {
  assert.equal(weakness({ memory: mem(null), lapses: 0 }), null, 'no evidence yet');
  const list = weakest(
    [
      { openingId: 'a', key: 'k1', memory: mem(95, 0, 5), lapses: 0 },
      { openingId: 'a', key: 'k2', memory: mem(40, 3, 1), lapses: 2 },
      { openingId: 'a', key: 'k3', memory: mem(70, 0, 2), lapses: 0 },
      { openingId: 'b', key: 'k2', memory: mem(60, 1, 1), lapses: 0 },
      { openingId: 'a', key: 'k4', memory: mem(null, 2, 0), lapses: 0 },
    ],
    10,
  );
  assert.deepEqual(list.map((w) => w.key), ['k4', 'k2', 'k3']);
  assert.equal(list[1].openingId, 'a', 'the worse of two courses sharing it');
  assert.equal(weakest(list, 1).length, 1);
});
