import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { PIECE_SIZES, pieceCode, pieceRaster, pieceUrl } from '../src/lib/pieces.ts';

test('a 1x board gets a PNG 10-33% larger than its pieces', () => {
  for (let px = 15; px <= 125; px += 0.5) {
    const size = pieceRaster(px, 1);
    assert.ok(size, `${px}px`);
    const ratio = size / px;
    assert.ok(ratio >= 1.1 && ratio <= 1.1 * 1.21, `${px}px drew from ${size}`);
  }
});

test('the ratio counts device pixels', () => {
  assert.equal(pieceRaster(70.5, 1), 91);
  assert.equal(pieceRaster(70.5, 1.5), 128);
});

test('2x and up, and sizes off the ladder, keep the SVG', () => {
  assert.equal(pieceRaster(70.5, 2), null);
  assert.equal(pieceRaster(40, 3), null);
  assert.equal(pieceRaster(10, 1), null);
  assert.equal(pieceRaster(0, 1), null);
  assert.equal(pieceRaster(200, 1), null);
});

test('every size on the ladder has all twelve pieces committed', () => {
  const dir = path.join(import.meta.dirname, '..', 'public', 'pieces');
  for (const size of PIECE_SIZES) {
    for (const ch of 'KQRBNPkqrbnp') {
      assert.ok(existsSync(path.join(dir, pieceUrl(pieceCode(ch), size).replace('/pieces/', ''))), `${size}/${pieceCode(ch)}`);
    }
  }
});

test('names', () => {
  assert.equal(pieceCode('N'), 'wN');
  assert.equal(pieceCode('p'), 'bP');
  assert.equal(pieceUrl('wN', null), '/pieces/wN.svg');
  assert.equal(pieceUrl('bQ', 54), '/pieces/54/bQ.png');
});
