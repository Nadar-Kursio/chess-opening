import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dayName, dayOffset, dueByDay, nextDue } from '../src/lib/dueDays.ts';

const END = new Date('2026-11-26T00:00:00Z');
const at = (iso: string) => new Date(iso);

test('overdue and due today share today; tomorrow starts the instant today ends', () => {
  assert.equal(dayOffset(at('2026-11-20T09:00:00Z'), END), 0);
  assert.equal(dayOffset(at('2026-11-25T23:59:59Z'), END), 0);
  assert.equal(dayOffset(END, END), 1);
  assert.equal(dayOffset(at('2026-11-26T23:59:59Z'), END), 1);
  assert.equal(dayOffset(at('2026-11-27T00:00:00Z'), END), 2);
});

test('each day is split by course, the largest share first, and days past the window are left out', () => {
  const days = dueByDay(
    [
      { openingId: 'sicilian', due: at('2026-11-27T10:00:00Z') },
      { openingId: 'london', due: at('2026-11-27T11:00:00Z') },
      { openingId: 'london', due: at('2026-11-27T12:00:00Z') },
      { openingId: 'london', due: at('2026-11-01T12:00:00Z') },
      { openingId: 'london', due: at('2026-12-20T12:00:00Z') },
    ],
    END,
    7,
  );
  assert.equal(days.length, 7);
  assert.deepEqual(days[0], { offset: 0, total: 1, courses: [{ id: 'london', n: 1 }] });
  assert.deepEqual(days[2].courses, [
    { id: 'london', n: 2 },
    { id: 'sicilian', n: 1 },
  ]);
  assert.equal(days.reduce((n, d) => n + d.total, 0), 4);
});

test('the next review skips today and looks past the week', () => {
  assert.equal(nextDue([{ openingId: 'london', due: at('2026-11-25T10:00:00Z') }], END), null);
  assert.deepEqual(
    nextDue(
      [
        { openingId: 'london', due: at('2026-11-25T10:00:00Z') },
        { openingId: 'london', due: at('2026-12-12T10:00:00Z') },
        { openingId: 'sicilian', due: at('2026-12-12T18:00:00Z') },
        { openingId: 'sicilian', due: at('2026-12-15T18:00:00Z') },
      ],
      END,
    ),
    { offset: 17, n: 2 },
  );
});

test('days read as words: today, tomorrow, a weekday, then a date', () => {
  const now = at('2026-11-26T12:00:00Z');
  assert.deepEqual(dayName(0, 'UTC', now), { short: 'Today', phrase: 'today' });
  assert.deepEqual(dayName(1, 'UTC', now), { short: 'Fri', phrase: 'tomorrow' });
  assert.deepEqual(dayName(3, 'UTC', now), { short: 'Sun', phrase: 'on Sunday' });
  assert.equal(dayName(16, 'UTC', now).phrase, 'on 12 Dec');
});
