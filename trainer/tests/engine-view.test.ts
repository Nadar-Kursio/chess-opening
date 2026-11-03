import assert from 'node:assert/strict';
import { test } from 'node:test';
import { yourMoveIndexes } from '../src/lib/course.ts';
import { evalBarText, evalShare, evalText, verdictOf, verdictWords } from '../src/lib/engineView.ts';
import type { Line, Ply } from '../src/lib/types.ts';

const position: Pick<Ply, 'ev' | 'verdicts'> = {
  ev: 21,
  verdicts: {
    d1b3: ['Qb3', 21, 'g'],
    b1d2: ['Nbd2', -69, 'i'],
    f4b8: ['Bb8', -900, 'b'],
    a1a1: ['Mate', 9998, 'g', 2],
  },
};

test('evalText reads as a player writes it', () => {
  assert.equal(evalText({ ev: 21 }), '+0.21');
  assert.equal(evalText({ ev: -69 }), '−0.69');
  assert.equal(evalText({ ev: 0 }), '0.00');
  assert.equal(evalText({ ev: 9998, mate: 2 }), 'M2');
  assert.equal(evalText({ ev: -9998, mate: -2 }), '−M2');
  assert.equal(evalText({ ev: 10000, mate: 0 }), '#');
});

test('evalBarText fits the bar and always says who is ahead', () => {
  assert.equal(evalBarText({ ev: 36 }), '+0.4');
  assert.equal(evalBarText({ ev: -707 }), '−7.1');
  assert.equal(evalBarText({ ev: -4 }), '0.0');
  assert.equal(evalBarText({ ev: 0 }), '0.0');
  assert.equal(evalBarText({ ev: 996 }), '+10');
  assert.equal(evalBarText({ ev: -1234 }), '−12');
  assert.equal(evalBarText({ ev: -9998, mate: -3 }), '−M3');
});

test('evalShare splits the bar by who stands better', () => {
  assert.equal(evalShare({ ev: 0 }), 50);
  assert.ok(evalShare({ ev: 100 }) > 50);
  assert.ok(evalShare({ ev: -100 }) < 50);
  assert.equal(evalShare({ ev: 9998, mate: 2 }), 100);
  assert.equal(evalShare({ ev: -10000, mate: 0 }), 0);
});

test('verdictOf reads the shipped score and severity', () => {
  assert.deepEqual(verdictOf(position, 'b1', 'd2'), {
    from: 'b1', to: 'd2', san: 'Nbd2', ev: -69, mate: undefined, sev: 'inaccuracy', glyph: '?!',
  });
  assert.equal(verdictOf(position, 'f4', 'b8')?.glyph, '??');
  assert.equal(verdictOf(position, 'd1', 'b3')?.glyph, '');
  assert.equal(verdictOf(position, 'h1', 'h8'), null);
  assert.equal(verdictOf({}, 'b1', 'd2'), null);
});

test('an authored severity outranks the engine', () => {
  assert.equal(verdictOf(position, 'b1', 'd2', 'playable')?.sev, 'good');
  assert.equal(verdictOf(position, 'd1', 'b3', 'blunder')?.glyph, '??');
});

test('verdictWords never names the course move', () => {
  const bad = verdictWords(verdictOf(position, 'b1', 'd2')!, position, '6.Qb3');
  assert.equal(bad.title, '6.Nbd2?!');
  assert.equal(bad.text, 'That takes the score from +0.21 to −0.69.');
  const good = verdictWords(verdictOf(position, 'd1', 'b3')!, position, '6.Nf3');
  assert.equal(good.title, '6.Qb3 is a good move too');
  assert.doesNotMatch(good.text, /Nf3/);
});

test('a sideline only asks the moves after it leaves the chapter', () => {
  const ply = (turn: 'w' | 'b') => ({ san: 'x', fen: '', from: null, to: null, num: '', turn }) as Ply;
  const line = { slug: 's', name: '', note: '', plies: [ply('w'), ply('w'), ply('b'), ply('w'), ply('b'), ply('w')], start: 2 } as Line;
  assert.deepEqual(yourMoveIndexes(line, 'white'), [3, 5]);
  assert.deepEqual(yourMoveIndexes({ ...line, start: undefined }, 'white'), [1, 3, 5]);
});
