import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { Chess } from 'chess.js';
import { positionKey, toMove } from '../src/lib/course.ts';
import { baitOf, baitsOf, sparPathValid, trapsInGame } from '../src/lib/gameTraps.ts';
import { buildReport, gameFacts, type ImportedGame } from '../src/lib/games.ts';
import { sparBook, type ClubBook } from '../src/lib/spar.ts';
import type { Catalog, Opening } from '../src/lib/types.ts';

const ROOT = process.env.CONTENT_DIR ?? path.join(import.meta.dirname, '..', 'content');
const read = (f: string) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
const openings = (read('catalog.json') as Catalog).openings.map((o) => read(`openings/${o.id}.json`) as Opening);
const byId = new Map(openings.map((op) => [op.id, op]));
const traps = openings.filter((op) => op.section === 'traps');
const baits = baitsOf(openings);
const START = positionKey(openings[0].lines[0].plies[0]);

/** The start, then the position after each move, keyed as the server's replay keys them. */
function keysOf(moves: string[]) {
  const chess = new Chess();
  return [
    START,
    ...moves.map((san) => {
      chess.move(san);
      return chess.fen().split(' ')[0].replace(/\d/g, (n) => '.'.repeat(Number(n))).replaceAll('/', '') + chess.turn();
    }),
  ];
}

const words = (s: string) => s.split(' ');
const b2 = (rest: string) => words(`d4 d5 Bf4 c5 e3 Qb6 Nc3 ${rest}`);

test('every shipped trap course has a bait: a move by the side it is set against, off a line taught from the setter’s chair', () => {
  assert.ok(traps.length >= 10);
  for (const trap of traps) {
    const bait = baitOf(trap);
    assert.ok(bait, `${trap.id} has a bait`);
    const line = trap.lines.find((l) => l.slug === bait.line)!;
    assert.equal(line.side ?? trap.orientation, trap.orientation, trap.id);
    const i = line.plies.findIndex((p) => positionKey(p) === bait.key);
    assert.ok(i >= 0, trap.id);
    assert.notEqual(toMove(line.plies[i]), trap.orientation === 'white' ? 'w' : 'b', `${trap.id}: the victim moves`);
    assert.equal(positionKey(line.plies[i + 1]), bait.taken, trap.id);
  }
});

test('the baits are the moves the trap courses are about', () => {
  const nums = Object.fromEntries(traps.map((t) => [t.id, baitOf(t)!.num]));
  assert.equal(nums.londonb2, '4...Qxb2');
  assert.equal(nums.scholarsmate, '3...Nf6');
  assert.equal(nums.friedliver, '5...Nxd5');
  assert.equal(nums.elephanttrap, '6.Nxd5');
  assert.equal(nums.londonh5hunt, '3.e3');
  // An inaccuracy the course plays down both chairs (the London's 3...Qb6) is not the trap.
  assert.notEqual(nums.londonb2, '3...Qb6');
});

test('taking the bait is sprung for the setter and caught for the victim; refusing it is dodged', () => {
  const taken = keysOf(b2('Qxb2 Nxd5'));
  const [white] = trapsInGame(baits, 'white', taken);
  assert.deepEqual([white.trapId, white.outcome, white.setter, white.punished, white.ply], ['londonb2', 'sprung', true, true, 7]);
  const [black] = trapsInGame(baits, 'black', taken);
  assert.deepEqual([black.outcome, black.setter], ['caught', false]);

  const missed = trapsInGame(baits, 'white', keysOf(b2('Qxb2 Rb1')));
  assert.equal(missed[0].punished, false);
  assert.equal(trapsInGame(baits, 'white', keysOf(b2('Qxb2')))[0].punished, null);

  const refused = trapsInGame(baits, 'black', keysOf(b2('e6 Nb5')));
  assert.deepEqual([refused[0].outcome, refused[0].punished], ['dodged', null]);
});

test('a game that gets there by another move order still meets the trap', () => {
  const met = trapsInGame(baits, 'white', keysOf(words('d4 c5 Bf4 d5 e3 Qb6 Nc3 Qxb2')));
  assert.equal(met[0].trapId, 'londonb2');
  assert.equal(met[0].outcome, 'sprung');
});

test('a game that never reaches the bait meets nothing', () => {
  assert.deepEqual(trapsInGame(baits, 'white', keysOf(words('d4 d5 Bf4 c5 c3 Qb6 Qb3'))), []);
  // Reaching the bait position on the last move recorded can't say which way it went.
  assert.deepEqual(trapsInGame(baits, 'white', keysOf(words('d4 d5 Bf4 c5 e3 Qb6 Nc3'))), []);
});

function imported(moves: string[], colour: 'white' | 'black'): ImportedGame {
  const chess = new Chess();
  const positions = moves.map((san) => {
    const m = chess.move(san);
    const fen = m.after.split(' ')[0].replace(/\d/g, (n) => '.'.repeat(Number(n))).replaceAll('/', '');
    return { key: fen + chess.turn(), fen, from: m.from, to: m.to, check: chess.inCheck() };
  });
  return {
    site: 'lichess',
    id: moves.join(''),
    url: 'https://lichess.org/x',
    playedAt: new Date('2026-11-20T12:00:00Z'),
    colour,
    result: 'win',
    opponent: 'someone',
    opponentRating: 1500,
    rating: 1500,
    speed: 'blitz',
    openingName: null,
    moves,
    positions,
  };
}

test('the report carries each game’s traps, and a game’s XP facts count only a studied course', () => {
  const game = imported(b2('Qxb2 Nxd5 cxd4 Qxd4 Qxd4 Nc7+'), 'white');
  const { matched } = buildReport([game], openings, new Set(['london']), new Map());
  const m = matched[0];
  assert.equal(m.traps[0].outcome, 'sprung');
  const facts = gameFacts(m, new Set(['london']));
  assert.ok(facts.bookMoves >= 4, `${facts.bookMoves} own book moves`);
  assert.equal(facts.sprung, true);
  assert.equal(gameFacts(m, new Set()).bookMoves, 0, 'no XP for book moves of a course not studied');
  assert.equal(gameFacts(m, new Set()).sprung, true, 'a trap sprung counts whatever is studied');
});

test('a sparring path is believed only when the partner could have played it', () => {
  const london = byId.get('london')!;
  const book = sparBook(london, 'white', read('club/london.json') as ClubBook);
  const bait = baitOf(byId.get('londonb2')!)!;
  const path = keysOf(b2('Qxb2'));
  assert.ok(sparPathValid(book, path), 'the club move that leaves the course may end the game');
  assert.deepEqual(trapsInGame([bait], 'white', path).map((t) => t.outcome), ['sprung']);
  assert.ok(!sparPathValid(book, keysOf(b2('Qxb2 Nxd5'))), 'nothing is played after the game has left the course');
  assert.ok(!sparPathValid(book, keysOf(words('e4 e5'))), 'not the course');
  assert.ok(!sparPathValid(book, [START, bait.taken]), 'steps must follow one another');
});
