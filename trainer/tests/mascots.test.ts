import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { LOOK_GAINS, MASCOTS, RANK_LINES, lookAt, mascotLine, newLookAt, nextLook, nextLookLine, stageFor } from '../src/lib/mascots.ts';
import { RANKS } from '../src/lib/xp.ts';

const prose = JSON.parse(readFileSync(path.join(import.meta.dirname, '..', '..', 'tests', 'prose.json'), 'utf8')) as {
  rules: { id: string; pattern: string }[];
};
const rules = prose.rules.map((r) => ({ id: r.id, re: new RegExp(r.pattern, 'iu') }));

test('every rank has a line and a look, and each rank past Pawn adds something', () => {
  assert.equal(RANK_LINES.length, RANKS.length);
  assert.equal(LOOK_GAINS.length, RANKS.length);
  assert.equal(LOOK_GAINS[0], null);
  for (let i = 1; i < RANKS.length; i++) {
    assert.ok(LOOK_GAINS[i], `rank ${RANKS[i].name} adds nothing`);
    assert.notDeepEqual(lookAt(i), lookAt(i - 1), `rank ${RANKS[i].name} looks like the one before`);
  }
});

test('the look follows the level through the ranks', () => {
  assert.equal(stageFor(1), 0);
  assert.equal(stageFor(2), 0);
  assert.equal(stageFor(3), 1);
  assert.equal(stageFor(7), 3);
  assert.equal(stageFor(99), RANKS.length - 1);
  assert.equal(lookAt(stageFor(3)).scarf, true);
  assert.equal(lookAt(stageFor(6)).medal, 'bronze');
  assert.equal(lookAt(stageFor(25)).medal, 'gold');
  assert.equal(lookAt(stageFor(50)).glow, true);
  assert.equal(lookAt(stageFor(40)).glow, false);
});

test('the next look names the next rank, and a new look shows when a level-up crosses a rank', () => {
  assert.deepEqual(nextLook(5), { stage: 3, rank: 'Rook', level: 7, gain: 'a cape' });
  assert.equal(nextLook(50), null);
  assert.equal(nextLookLine('Pip', 6), 'Reach Rook at level 7 and Pip gets a cape.');
  assert.equal(newLookAt(7, 6), 'a cape');
  assert.equal(newLookAt(8, 7), null);
  assert.equal(newLookAt(9, 6), 'a cape');
  assert.equal(newLookAt(53, 9), 'a golden glow');
});

test('mascots speak on about every other screen, the same words for the same seed, always on a level-up', () => {
  for (const m of MASCOTS) {
    const said = Array.from({ length: 40 }, (_, i) => mascotLine(m.id, 'good', i));
    assert.equal(said.filter(Boolean).length, 20);
    assert.equal(mascotLine(m.id, 'mixed', 4), mascotLine(m.id, 'mixed', 4));
    for (let lv = 1; lv < 60; lv++) assert.ok(mascotLine(m.id, 'level', lv));
    assert.equal(new Set(said.filter(Boolean)).size, m.lines.good.length);
  }
});

test('six distinct companions, every word of them passing the prose rules', () => {
  assert.equal(MASCOTS.length, 6);
  assert.equal(new Set(MASCOTS.map((m) => m.id)).size, 6);
  const words = [
    ...MASCOTS.flatMap((m) => [m.name, m.kind, m.blurb, ...Object.values(m.lines).flat()]),
    ...RANK_LINES,
    ...LOOK_GAINS.filter((g): g is string => !!g),
    ...MASCOTS.map((m) => nextLookLine(m.name, 1)),
  ];
  for (const w of words) {
    for (const r of rules) assert.ok(!r.re.test(w), `"${w}" breaks ${r.id}`);
  }
});
