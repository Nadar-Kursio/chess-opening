import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { spoken, utterances } from '../src/lib/speech.ts';
import type { Opening } from '../src/lib/types.ts';

const ROOT = process.env.CONTENT_DIR ?? path.join(import.meta.dirname, '..', 'content');
const openings: Opening[] = readdirSync(path.join(ROOT, 'openings')).map(
  (f) => JSON.parse(readFileSync(path.join(ROOT, 'openings', f), 'utf8')) as Opening,
);

test('moves are read as words', () => {
  const cases: [string, string][] = [
    ['2.Bf4', 'bishop f4'],
    ['Nbd2', 'knight b d2'],
    ['R1e2', 'rook 1 e2'],
    ['exd5', 'e takes d5'],
    ['12...O-O', 'castles'],
    ['O-O-O', 'castles queenside'],
    ['bxc2+', 'b takes c2, check'],
    ['Qf4#', 'queen f4, checkmate'],
    ['e8=Q+', 'e8, promoting to a queen, check'],
    ['8...cxd5??', 'c takes d5'],
    ['...Nb4–d5', 'knight b4 to d5'],
  ];
  for (const [san, words] of cases) assert.equal(spoken(san), words, san);
});

test('prose keeps squares and reads notation inside it', () => {
  assert.equal(spoken('Unlike 1.e4 it is defended'), 'Unlike e4 it is defended');
  assert.equal(spoken('the b8–h2 diagonal and the f8-bishop'), 'the b8 to h2 diagonal and the f8 bishop');
  assert.equal(spoken('London vs ...c5'), 'London versus c5');
  assert.equal(spoken('<p>One.</p><ul><li>Two</li></ul>'), 'One. Two.');
});

test('every narrated line has a clip per ply, and no notation survives into speech', () => {
  for (const op of openings) {
    for (const line of op.lines) {
      const said = utterances(line, line.side ?? op.orientation);
      assert.equal(said.filter((u) => /^p\d+$/.test(u.key)).length, line.plies.length - 1, `${op.id}/${line.slug}`);
      for (const u of said) {
        assert.doesNotMatch(u.text, /\b\d+\.(\.\.)?[a-hKQRBNO]|\b[KQRBN]x?[a-h][1-8]|O-O/, `${op.id}/${line.slug} ${u.key}`);
        assert.ok(u.text.length < 3000, `${op.id}/${line.slug} ${u.key} is over Polly's limit`);
      }
    }
  }
});
