import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { pack, unpack } from '../src/lib/pack.ts';
import { forBrowser, sparBook, type ClubBook } from '../src/lib/spar.ts';
import type { Opening } from '../src/lib/types.ts';

const ROOT = process.env.CONTENT_DIR ?? path.join(import.meta.dirname, '..', 'content');
const read = (name: string) => JSON.parse(readFileSync(path.join(ROOT, name), 'utf8'));

/** What JSON would carry, less the false and undefined fields pack leaves out. */
const plain = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(plain)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined && x !== false).map(([k, x]) => [k, plain(x)]))
      : v;

test('a packed tree unpacks to the same tree, boards and keys included', () => {
  const small = { root: 'rnbqkbnrpppppppp' + '.'.repeat(32) + 'PPPPPPPPRNBQKBNRw', nodes: { ['.'.repeat(64) + 'b']: { fen: '.'.repeat(64), check: false, from: null, note: '§x' } } };
  assert.deepEqual(unpack(pack(small)), plain(small));
  assert.deepEqual(pack(small).boards, ['rnbqkbnrpppppppp8888PPPPPPPPRNBQKBNRw', '88888888b', '88888888']);
});

test('the London’s sparring book reaches the browser whole, and smaller', () => {
  const op = read('openings/london.json') as Opening;
  op.sidelines = read('coaching/london.json').sidelines;
  const book = forBrowser(sparBook(op, 'white', read('club/london.json') as ClubBook));
  const packed = pack(book);
  assert.deepEqual(unpack(packed), plain(book));
  assert.ok(JSON.stringify(packed).length < JSON.stringify(book).length * 0.75, 'packing saves a quarter');
  for (const node of Object.values(book.tree.nodes)) {
    if (node.toMove === book.tree.side) assert.ok(node.legal || !node.moves.length, 'the learner’s positions keep their legal moves');
    else assert.equal(node.legal, undefined);
  }
});
