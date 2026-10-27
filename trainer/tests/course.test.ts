import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import {
  buildTree,
  chapters,
  courseProgress,
  lineSide,
  positionKey,
  punishQuestions,
  quizFor,
  sidesTaught,
  toMove,
  turnOf,
  type LineProgress,
} from '../src/lib/course.ts';
import type { Opening, Ply } from '../src/lib/types.ts';

// Runs against the real compiled course: CONTENT_DIR, else trainer/content (npm run content).
const ROOT = process.env.CONTENT_DIR ?? path.join(import.meta.dirname, '..', 'content');
const openings: Opening[] = readdirSync(path.join(ROOT, 'openings')).map(
  (f) => JSON.parse(readFileSync(path.join(ROOT, 'openings', f), 'utf8')) as Opening,
);

const isLegal = (p: Ply, from: string, to: string) => {
  const i = p.legal?.indexOf(from + to) ?? -1;
  return i >= 0 && i % 4 === 0;
};

test('every chapter has a slug and something for the learner to play', () => {
  for (const op of openings) {
    for (const ch of chapters(op)) {
      assert.match(ch.slug, /^[a-z0-9-]+$/, `${op.id}: ${ch.name}`);
      assert.ok(ch.yourMoves > 0, `${op.id}/${ch.slug} asks nothing`);
    }
  }
});

test('every quiz answer is a legal move by the learner in the position shown', () => {
  for (const op of openings) {
    for (const line of op.lines) {
      const you = turnOf(lineSide(op, line));
      const qs = quizFor(op, line);
      assert.ok(qs.length > 0, `${op.id}/${line.slug} has no quiz`);
      for (const q of qs) {
        const where = `${op.id}/${line.slug} ${q.id}`;
        assert.equal(toMove(q.position), you, where);
        assert.equal(q.answer.turn, you, where);
        assert.ok(isLegal(q.position, q.answer.from!, q.answer.to!), `${where}: answer not legal`);
      }
      assert.equal(new Set(qs.map((q) => q.id)).size, qs.length, `${op.id}/${line.slug} repeats`);
    }
  }
});

test('the free-practice tree is connected, and every edge is legal where it starts', () => {
  for (const op of openings) {
    for (const side of sidesTaught(op)) {
      const tree = buildTree(op, side);
      assert.ok(tree.nodes[tree.root], `${op.id} ${side}: no root`);
      const seen = new Set([tree.root]);
      const queue = [tree.root];
      while (queue.length) {
        const key = queue.shift()!;
        const n = tree.nodes[key];
        for (const e of n.moves) {
          assert.ok(tree.nodes[e.next], `${op.id}: dangling edge ${e.num}`);
          if (n.legal) assert.ok(n.legal.includes(e.from + e.to), `${op.id}: ${e.num} illegal`);
          if (!seen.has(e.next)) {
            seen.add(e.next);
            queue.push(e.next);
          }
        }
      }
      assert.equal(seen.size, Object.keys(tree.nodes).length, `${op.id} ${side}: unreachable nodes`);
    }
  }
});

test('punish questions are only opponent blunders', () => {
  for (const op of openings) {
    for (const q of punishQuestions(op, op.orientation)) {
      assert.equal(q.sev, 'blunder');
      assert.notEqual(toMove(q.before!), turnOf(op.orientation));
    }
  }
});

test('course progress counts four steps a chapter and points at the first gap', () => {
  const op = openings[0];
  const chs = chapters(op);
  const first: LineProgress = {
    line_slug: chs[0].slug,
    learned_at: '2026-10-01',
    drilled_at: '2026-10-01',
    recalled_at: null,
    quizzed_at: null,
    quiz_best: null,
    clean_runs: 0,
    runs: 1,
  };
  const p = courseProgress(chs, new Map([[chs[0].slug, first]]));
  assert.equal(p.total, chs.length * 4);
  assert.equal(p.done, 2);
  assert.deepEqual(p.next, { slug: chs[0].slug, step: 'recall', name: chs[0].name });
});

test('position keys separate the side to move', () => {
  const start = openings[0].lines[0].plies[0];
  assert.equal(positionKey(start).at(-1), 'w');
});
