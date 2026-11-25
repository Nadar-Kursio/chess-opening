import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { positionKey, sidesTaught } from '../src/lib/course.ts';
import type { Tree } from '../src/lib/course.ts';
import { OPPONENTS, THIN, answerTo, choiceAt, leaving, nextNumber, pickOpponent, pickReply, shareOf, sparBook, type ClubBook, type ClubMove, type Drawn } from '../src/lib/spar.ts';
import type { Opening, Sidelines } from '../src/lib/types.ts';

/* ---------- the opponent's choice, on a tree small enough to read ---------- */

const board = (c: string) => c.repeat(64);
// After 1.d4 (Black to move): 1...d5 and 1...Nf6 go on, 1...e6 is named with no answer.
const tree: Tree = {
  root: 'start',
  side: 'w',
  nodes: {
    start: { fen: board('.'), toMove: 'w', from: null, to: null, num: '', moves: [{ san: 'd4', num: '1.d4', from: 'd2', to: 'd4', next: 'd4', w: 3 }] },
    d4: {
      fen: board('a'),
      toMove: 'b',
      from: 'd2',
      to: 'd4',
      num: '1.d4',
      moves: [
        { san: 'd5', num: '1...d5', from: 'd7', to: 'd5', next: 'd5', w: 6 },
        { san: 'Nf6', num: '1...Nf6', from: 'g8', to: 'f6', next: 'nf6', w: 3 },
        { san: 'e6', num: '1...e6', from: 'e7', to: 'e6', next: 'e6', w: 1, sev: 'playable', why: 'Fine.' },
      ],
    },
    d5: { fen: board('b'), toMove: 'w', from: 'd7', to: 'd5', num: '1...d5', moves: [{ san: 'Bf4', num: '2.Bf4', from: 'c1', to: 'f4', next: 'end', w: 3 }] },
    nf6: { fen: board('c'), toMove: 'w', from: 'g8', to: 'f6', num: '1...Nf6', moves: [{ san: 'Bf4', num: '2.Bf4', from: 'c1', to: 'f4', next: 'end', w: 3 }] },
    e6: { fen: board('d'), toMove: 'w', from: 'e7', to: 'e6', num: '1...e6', moves: [] },
    end: { fen: board('e'), toMove: 'b', from: 'c1', to: 'f4', num: '2.Bf4', moves: [] },
  },
};

const club: ClubMove[] = [
  ['d5', 60, 'd7d5', 'd7.d5p', 0],
  ['Nf6', 30, 'g8f6', 'g8.f6n', 0],
  ['e6', 6, 'e7e6', 'e7.e6p', 0],
  ['c5', 4, 'c7c5', 'c7.c5p', 0],
];

const always = (r: number) => () => r;

test('the opponent weighs every club move, the ones the course has no answer to included', () => {
  const choice = choiceAt(tree, 'd4', club, new Set());
  assert.equal(choice.total, 100);
  assert.ok(!choice.forced && !choice.thin);
  assert.deepEqual(
    choice.replies.map((r) => [r.san, r.w, r.next]),
    [
      ['d5', 60, 'd5'],
      ['Nf6', 30, 'nf6'],
    ],
  );
  assert.deepEqual(
    choice.out.map((m) => m[0]),
    ['e6', 'c5'],
    'a named deviation with no answer is out of prep too',
  );
  const e6 = leaving(tree, 'd4', choice.out[0]);
  assert.equal(e6.known, true);
  assert.equal(e6.sev, 'playable');
  const c5 = leaving(tree, 'd4', choice.out[1]);
  assert.equal(c5.known, false);
  assert.equal(c5.num, '1...c5');
  assert.deepEqual([c5.from, c5.to, c5.check, c5.games], ['c7', 'c5', false, 4]);
  assert.equal(c5.fen, 'a'.repeat(10) + '.' + 'a'.repeat(15) + 'p' + 'a'.repeat(37), 'the shipped squares lay out the board it reaches');
});

test('the draw lands in proportion to the counts', () => {
  const choice = choiceAt(tree, 'd4', club, new Set());
  const san = (d: Drawn) => (d.kind === 'on' ? d.reply.san : d.move[0]);
  assert.equal(san(pickReply(choice, always(0))), 'd5');
  assert.equal(san(pickReply(choice, always(0.599))), 'd5');
  assert.equal(san(pickReply(choice, always(0.6))), 'Nf6');
  assert.equal(pickReply(choice, always(0.9)).kind, 'off');
  assert.equal(san(pickReply(choice, always(0.9))), 'e6');
  assert.equal(san(pickReply(choice, always(0.96))), 'c5');
  assert.equal(san(pickReply(choice, always(0.999999))), 'c5');

  const seen = new Map<string, number>();
  let seed = 7;
  const lcg = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  for (let i = 0; i < 10_000; i++) {
    const s = san(pickReply(choice, lcg));
    seen.set(s, (seen.get(s) ?? 0) + 1);
  }
  assert.ok(Math.abs(seen.get('d5')! / 10_000 - 0.6) < 0.03);
  assert.ok(Math.abs(seen.get('c5')! / 10_000 - 0.04) < 0.015);
});

test('a move order the course never wrote down still counts when it reaches a position the course teaches', () => {
  const c6 = 'a'.repeat(10) + '.' + 'a'.repeat(7) + 'p' + 'a'.repeat(45);
  const transposed: Tree = {
    ...tree,
    nodes: {
      ...tree.nodes,
      [`${c6}w`]: { fen: c6, toMove: 'w', from: 'c7', to: 'c6', num: '1...c6', moves: [{ san: 'Bf4', num: '2.Bf4', from: 'c1', to: 'f4', next: 'end', w: 3 }] },
    },
  };
  const choice = choiceAt(transposed, 'd4', [...club, ['c6', 8, 'c7c6', 'c7.c6p', 0]], new Set());
  const reply = choice.replies.find((r) => r.san === 'c6');
  assert.ok(reply, 'played on, not out of prep');
  assert.equal(reply.next, `${c6}w`);
  assert.equal(reply.num, '1...c6');
  assert.equal(reply.w, 8);
  assert.ok(!choice.out.some((m) => m[0] === 'c6'));
});

test('too few club games and the opponent follows the course instead', () => {
  const few: ClubMove[] = [['c5', THIN - 1, 'c7c5', 'c7.c5p', 0]];
  const choice = choiceAt(tree, 'd4', few, new Set());
  assert.equal(choice.thin, true);
  assert.deepEqual(
    choice.replies.map((r) => [r.san, r.w]),
    [
      ['d5', 6],
      ['Nf6', 3],
    ],
  );
  assert.deepEqual(choice.out, [], 'never leaves the course on noise');
  assert.equal(choiceAt(tree, 'd4', undefined, new Set()).thin, true);
});

test('the opening the learner chose is played, not sampled', () => {
  const single: Tree = { ...tree, nodes: { ...tree.nodes, d4: { ...tree.nodes.d4, moves: [tree.nodes.d4.moves[0]] } } };
  const choice = choiceAt(single, 'd4', club, new Set(['d4']));
  assert.equal(choice.forced, true);
  assert.deepEqual(choice.replies.map((r) => r.san), ['d5']);
  assert.deepEqual(choice.out, []);
  assert.equal(choice.replies[0].games, 60);
  // Off the shared opening the same position is sampled, so the opponent can leave.
  assert.ok(!choiceAt(single, 'd4', club, new Set()).forced);
});

test('shares and move numbers read as a player would say them', () => {
  assert.equal(shareOf({ games: 4 }, { total: 100 }), 4);
  assert.equal(shareOf({ games: 1 }, { total: 5000 }), 1, 'a move that was played never shows as 0%');
  assert.equal(shareOf({ games: 0 }, { total: 100 }), null);
  assert.equal(nextNumber('1.d4', 'b'), '1...');
  assert.equal(nextNumber('3...c5', 'w'), '4.');
  assert.equal(nextNumber('', 'w'), '1.');
});

test('a new opponent is someone else', () => {
  for (const o of OPPONENTS) {
    for (const r of [0, 0.5, 0.999]) assert.notEqual(pickOpponent(always(r), o.id).id, o.id);
  }
  assert.equal(pickOpponent(always(0)).id, OPPONENTS[0].id);
});

/* ---------- the shipped data, against the real compiled course ---------- */

const ROOT = process.env.CONTENT_DIR ?? path.join(import.meta.dirname, '..', 'content');
const KEY = /^[.pnbrqkPNBRQK]{64}[wb]$/;
const squareAt = (sq: string) => (8 - Number(sq[1])) * 8 + 'abcdefgh'.indexOf(sq[0]);

function load(id: string): Opening {
  const op = JSON.parse(readFileSync(path.join(ROOT, 'openings', `${id}.json`), 'utf8')) as Opening;
  const coaching = path.join(ROOT, 'coaching', `${id}.json`);
  if (existsSync(coaching)) op.sidelines = (JSON.parse(readFileSync(coaching, 'utf8')) as { sidelines?: Sidelines }).sidelines;
  return op;
}

const clubDir = path.join(ROOT, 'club');
const clubs = existsSync(clubDir) ? readdirSync(clubDir).map((f) => f.replace(/\.json$/, '')) : [];

test('the repertoire courses ship club data in their own file', () => {
  for (const id of ['london', 'queensgambit', 'ruylopez', 'sicilian', 'scandinavian']) assert.ok(clubs.includes(id), id);
  for (const id of clubs) {
    const coaching = path.join(ROOT, 'coaching', `${id}.json`);
    if (existsSync(coaching)) assert.ok(!('positions' in JSON.parse(readFileSync(coaching, 'utf8'))), id);
  }
});

test('every club file loads into a game the opponent can play', () => {
  for (const id of clubs) {
    const book = JSON.parse(readFileSync(path.join(clubDir, `${id}.json`), 'utf8')) as ClubBook;
    assert.ok(book.scanned >= book.games && book.games > 0, `${id}: sample size`);
    assert.deepEqual(book.elo, [1200, 2000]);
    for (const [key, moves] of Object.entries(book.positions)) {
      assert.match(key, KEY, id);
      for (const [san, games, uci, diff] of moves) {
        assert.ok(games > 0 && /^[a-h][1-8][a-h][1-8]$/.test(uci) && /^([a-h][1-8].){2,4}$/.test(diff), `${id}: ${san}`);
      }
    }
    const op = load(id);
    for (const side of sidesTaught(op)) {
      const spar = sparBook(op, side, book);
      const choices = Object.entries(spar.choices);
      assert.ok(choices.length > 0, id);
      let sampled = 0;
      for (const [key, choice] of choices) {
        const goesOn = spar.tree.nodes[key].moves.some((e) => spar.tree.nodes[e.next].moves.length);
        assert.ok(choice.replies.length + choice.out.length > 0 || !goesOn, `${id}: ${key}`);
        if (!choice.forced && !choice.thin) {
          sampled++;
          const weighed = choice.replies.reduce((n, r) => n + r.games, 0) + choice.out.reduce((n, m) => n + m[1], 0);
          assert.equal(weighed, choice.total, `${id}: every club game is weighed`);
        }
        for (const r of choice.replies) {
          assert.ok(r.w > 0, `${id}: ${r.num}`);
          assert.ok(spar.tree.nodes[r.next].moves.length > 0, `${id}: ${r.num} goes on`);
        }
        for (const m of choice.out) {
          const leave = leaving(spar.tree, key, m);
          assert.equal(leave.fen.length, 64, `${id}: ${leave.num}`);
          assert.equal(leave.fen[squareAt(leave.from)], '.', `${id}: ${leave.num} leaves ${leave.from}`);
          assert.notEqual(leave.fen[squareAt(leave.to)], '.', `${id}: ${leave.num} lands on ${leave.to}`);
        }
      }
      assert.ok(sampled > 10, `${id}: club data drives the opponent`);
      for (const line of op.lines) assert.ok(line.plies.every((p) => positionKey(p) in spar.study), `${id}: ${line.slug} is somewhere to study`);
      assert.ok(spar.longest > 3, id);
    }
  }
});

test('a Black course opens with the move it answers', () => {
  for (const id of clubs.filter((c) => load(c).orientation === 'black')) {
    const op = load(id);
    const spar = sparBook(op, 'black', JSON.parse(readFileSync(path.join(clubDir, `${id}.json`), 'utf8')) as ClubBook);
    const root = spar.choices[spar.tree.root];
    assert.equal(root.forced, true, id);
    assert.deepEqual(root.replies.map((r) => r.san), [op.lines[0].plies[1].san], id);
  }
});

test('where a common club move leaves the course, the end screen has the engine’s reply', () => {
  for (const id of clubs) {
    const book = JSON.parse(readFileSync(path.join(clubDir, `${id}.json`), 'utf8')) as ClubBook;
    assert.ok(book.answers, `${id}: run exits.py`);
    const op = load(id);
    for (const side of sidesTaught(op)) {
      const spar = sparBook(op, side, book);
      const you = spar.tree.side;
      let common = 0;
      let answered = 0;
      for (const [key, choice] of Object.entries(spar.choices)) {
        if (choice.thin || choice.forced) continue;
        for (const m of choice.out) {
          const leave = leaving(spar.tree, key, m);
          const answer = answerTo(spar, leave, you);
          if (m[1] >= 10) common++;
          if (!answer) continue;
          answered += m[1] >= 10 ? 1 : 0;
          const piece = leave.fen[squareAt(answer.from)];
          assert.ok(piece !== '.' && (piece === piece.toUpperCase()) === (you === 'w'), `${id}: ${answer.num} moves the learner's piece`);
          assert.match(answer.num, /^\d+\.(\.\.)?\S+$/, id);
          assert.ok(answer.line.startsWith(answer.num), `${id}: ${answer.line} starts with ${answer.num}`);
        }
      }
      assert.ok(common > 0 && answered / common > 0.95, `${id}: ${answered} of ${common} common exits answered`);
    }
  }
});

test('a game that ends in a deviation’s continuation points at the chapter’s Quiz', () => {
  const op = load('queensgambit');
  const spar = sparBook(op, 'white', JSON.parse(readFileSync(path.join(clubDir, 'queensgambit.json'), 'utf8')) as ClubBook);
  const devs = Object.values(spar.study).filter((i) => spar.lines[i].deviation);
  assert.ok(devs.length > 0);
  for (const i of devs) assert.ok(op.lines.some((l) => l.slug === spar.lines[i].slug && !spar.lines[i].sideline));
  // A chapter's own positions keep the chapter, not its deviations.
  for (const line of op.lines) for (const p of line.plies) assert.ok(!spar.lines[spar.study[positionKey(p)]]?.deviation, line.slug);
});

test('a sideline’s own moves point at it, not at a later sideline leaving from the same place', () => {
  const op = load('london');
  const spar = sparBook(op, 'white', JSON.parse(readFileSync(path.join(clubDir, 'london.json'), 'utf8')) as ClubBook);
  const f5 = op.sidelines!.items.find((s) => s.slug === 'leaves-1-f5')!.line!;
  // 1.d4 f5 2.Bf4: the 1...f5 sideline's move, and where a grown 2...e6 sideline leaves from.
  const after = f5.plies[(f5.start ?? 0) + 2];
  assert.equal(spar.lines[spar.study[positionKey(after)]].slug, 'leaves-1-f5');
});
