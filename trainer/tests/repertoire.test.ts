import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { Rating } from 'ts-fsrs';
import { lineSide, positionKey, sidesTaught, turnOf } from '../src/lib/course.ts';
import { tallyTotal, type PositionMemory } from '../src/lib/mastery.ts';
import { newCard, review } from '../src/lib/memory.ts';
import { courseCards } from '../src/lib/recall.ts';
import {
  branchMap,
  clubIndex,
  clubShares,
  courseShape,
  keyFromFen,
  positionMemory,
  sanPath,
  subtreeTallies,
  walkSans,
} from '../src/lib/repertoire.ts';
import type { Opening, Ply } from '../src/lib/types.ts';

const ROOT = process.env.CONTENT_DIR ?? path.join(import.meta.dirname, '..', 'content');
const openings: Opening[] = readdirSync(path.join(ROOT, 'openings')).map((f) => {
  const op = JSON.parse(readFileSync(path.join(ROOT, 'openings', f), 'utf8')) as Opening;
  const coaching = path.join(ROOT, 'coaching', f);
  if (existsSync(coaching)) op.sidelines = JSON.parse(readFileSync(coaching, 'utf8')).sidelines;
  return op;
});
const london = openings.find((o) => o.id === 'london')!;

const isLegal = (p: Pick<Ply, 'legal'>, uci: string) => {
  const i = p.legal?.indexOf(uci) ?? -1;
  return i >= 0 && i % 4 === 0;
};

test('every position in the explorer is reachable from the start along the course’s own move order', () => {
  for (const op of openings) {
    for (const side of sidesTaught(op)) {
      const shape = courseShape(op, side);
      for (const key of Object.keys(shape.nodes)) {
        const keys = walkSans(shape, sanPath(shape, key));
        assert.equal(keys.at(-1), key, `${op.id}/${side}: no path to a position`);
        assert.equal(shape.nodes[key].depth, keys.length - 1);
      }
    }
  }
});

test('every move the explorer offers is legal where it starts, and taught by something', () => {
  for (const op of openings) {
    for (const side of sidesTaught(op)) {
      const shape = courseShape(op, side);
      for (const n of Object.values(shape.nodes)) {
        for (const m of n.moves) {
          assert.ok(shape.nodes[m.next], `${op.id}: a move to nowhere`);
          assert.ok(m.teach.length > 0, `${op.id}/${side}: ${m.num} taught by nothing`);
        }
        assert.equal(n.moves.filter((m) => m.main).length, n.moves.length ? 1 : 0, `${op.id}: one main move per position`);
      }
    }
  }
  // The board's legality is the compiled position's: check it against the course's own plies.
  const shape = courseShape(london, 'white');
  for (const line of london.lines) {
    for (let i = 1; i < line.plies.length; i++) {
      const from = shape.nodes[positionKey(line.plies[i - 1])];
      const m = from.moves.find((e) => e.next === positionKey(line.plies[i]));
      assert.ok(m, `${line.slug}: ${line.plies[i].num} missing`);
      assert.ok(isLegal(line.plies[i - 1], m.from + m.to));
      assert.ok(m.teach.some((t) => t.slug === line.slug && t.steps.includes('learn')));
    }
  }
});

test('the course’s Recall cards are exactly its chapter positions in the explorer', () => {
  for (const op of openings) {
    const asked = new Set<string>();
    for (const side of sidesTaught(op)) {
      const shape = courseShape(op, side);
      for (const [key, n] of Object.entries(shape.nodes)) {
        if (n.ask) {
          assert.equal(n.toMove, turnOf(side));
          asked.add(key);
        }
      }
    }
    for (const key of courseCards(op)) assert.ok(asked.has(key), `${op.id}: a card the explorer can't show`);
  }
});

test('the branch map shows every learner position once, in column order within a row', () => {
  for (const op of openings) {
    for (const side of sidesTaught(op)) {
      const shape = courseShape(op, side);
      const groups = branchMap(shape, op);
      const cells = groups.flatMap((g) => g.rows.flatMap((r) => r.cells));
      const asks = Object.entries(shape.nodes).filter(([, n]) => n.ask).map(([k]) => k);
      assert.equal(cells.length, new Set(cells.map((c) => c.key)).size, `${op.id}/${side}: a position twice`);
      assert.deepEqual(new Set(cells.map((c) => c.key)), new Set(asks), `${op.id}/${side}: positions missing from the map`);
      for (const g of groups) {
        for (const r of g.rows) {
          for (let i = 1; i < r.cells.length; i++) assert.ok(r.cells[i].col > r.cells[i - 1].col);
        }
      }
      // The first chapter taught from this chair opens the map at move one.
      const first = op.lines.find((l) => lineSide(op, l) === side)!;
      assert.equal(groups[0].id, first.slug);
      assert.equal(groups[0].rows[0].label, 'Start');
    }
  }
});

test('tallies add up the learner positions below each move', () => {
  const shape = courseShape(london, 'white');
  const asks = Object.entries(shape.nodes).filter(([, n]) => n.ask).map(([k]) => k);
  const memory: Record<string, PositionMemory> = {};
  asks.slice(0, 10).forEach((k, i) => {
    memory[k] = { level: i % 2 ? 'mastered' : 'learning', weak: i === 3, odds: 90, misses: 0, hits: 1, dueIn: 4 };
  });
  const tallies = subtreeTallies(shape, memory);
  const root = tallies[shape.root];
  assert.equal(tallyTotal(root), asks.length);
  assert.equal(root.mastered, 5);
  assert.equal(root.learning, 5);
  assert.equal(root.weak, 1);
  assert.equal(root.none, asks.length - 10);
  for (const [key, children] of Object.entries(shape.children)) {
    const sum = children.reduce((n, c) => n + tallyTotal(tallies[c]), shape.nodes[key].ask ? 1 : 0);
    assert.equal(tallyTotal(tallies[key]), sum);
  }
});

test('a position’s memory comes from its card and its misses', () => {
  const now = new Date('2026-11-24T12:00:00Z');
  const end = new Date('2026-11-25T00:00:00Z');
  assert.deepEqual(positionMemory(null, null, now, end), { level: 'none', weak: false, odds: null, misses: 0, hits: 0, dueIn: null });
  assert.equal(positionMemory(null, { misses: 2, hits: 1 }, now, end).weak, true);

  const fresh = newCard(now);
  const m = positionMemory(fresh, null, now, end);
  assert.equal(m.level, 'new');
  assert.equal(m.weak, false, 'a card never answered is new, not weak');
  assert.equal(m.dueIn, 0);

  const good = review(fresh, new Date('2026-11-01T12:00:00Z'), Rating.Good);
  const later = positionMemory(good, { misses: 0, hits: 1 }, now, end);
  assert.equal(later.level, 'learning');
  assert.equal(later.weak, true, 'recalled before and due now');
  assert.ok(later.odds !== null && later.odds < 90);

  const ahead = positionMemory({ ...good, due: new Date('2026-11-28T09:00:00Z') }, null, now, end);
  assert.equal(ahead.weak, false);
  assert.equal(ahead.dueIn, 4);
});

test('club files are read by position key or FEN, and a strange shape gives nothing', () => {
  assert.equal(keyFromFen('rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq -'), 'rnbqkbnrpppppppp...................P............PPP.PPPPRNBQKBNRb');
  assert.equal(keyFromFen('not a fen'), null);
  const shape = courseShape(london, 'white');
  const afterD4 = shape.nodes[shape.root].moves[0].next;
  const index = clubIndex({ positions: { [afterD4]: { d5: 60, 'Nf6': { games: 30 }, e6: 10 }, junk: { x: 1 } } });
  assert.equal(index.size, 1);
  const shares = clubShares(shape, london, index);
  const byMove = Object.fromEntries(shape.nodes[afterD4].moves.map((m) => [m.san, shares[`${afterD4}>${m.next}`]]));
  assert.equal(byMove.d5, 60);
  assert.equal(byMove.Nf6, 30);
  assert.equal(byMove.g6, 0, 'a course move nobody played reads as rare');
  const listed = clubIndex({ positions: { [afterD4]: [['d5', 60, 'd7d5', '', 0], ['Nf6', 30, 'g8f6', '', 0]] } });
  assert.equal(listed.get(afterD4)?.get('d5'), 60);
  assert.equal(listed.get(afterD4)?.get('Nf6'), 30);
  assert.equal(clubIndex({ rows: [] }).size, 0);
  assert.equal(clubIndex(null).size, 0);
});

test('without a club file the London still has club numbers from its sidelines', () => {
  const shape = courseShape(london, 'white');
  const shares = clubShares(shape, london, null);
  assert.ok(Object.keys(shares).length >= london.sidelines!.items.length / 2);
  for (const v of Object.values(shares)) assert.ok(v >= 0 && v <= 100);
});
