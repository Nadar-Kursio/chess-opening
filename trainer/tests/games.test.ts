import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { Chess } from 'chess.js';
import { buildTree, lineSide, positionKey, toMove, turnOf } from '../src/lib/course.ts';
import {
  bareSan,
  buildReport,
  depthOf,
  deviationOf,
  forgot,
  matchGame,
  moveNum,
  practiceKeys,
  resolveSan,
  walkCourse,
  walkPlies,
  type GamePosition,
  type ImportedGame,
} from '../src/lib/games.ts';
import { chesscomOpening, fromChesscom, fromLichess, pgnMoves, usernameFrom, type ChesscomGame, type LichessGame } from '../src/lib/gameSources.ts';
import type { Catalog, MoveScore, Opening, Sidelines } from '../src/lib/types.ts';

const ROOT = process.env.CONTENT_DIR ?? path.join(import.meta.dirname, '..', 'content');
const read = (f: string) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));

/** The course as the server reads it, generated coaching included (content.ts's withCoaching). */
function load(id: string): Opening {
  const op = read(`openings/${id}.json`) as Opening;
  const file = `coaching/${id}.json`;
  if (!existsSync(path.join(ROOT, file))) return op;
  const { verdicts, sidelines } = read(file) as { verdicts?: Record<string, Record<string, MoveScore>>; sidelines?: Sidelines };
  const place = (plies: Opening['lines'][number]['plies']) => {
    for (const p of plies) if (verdicts?.[positionKey(p)]) p.verdicts = verdicts[positionKey(p)];
  };
  for (const line of op.lines) place(line.plies);
  for (const set of op.branchsets ?? []) for (const b of set) place(b.plies);
  for (const s of sidelines?.items ?? []) if (s.line) place(s.line.plies);
  op.engineView = true;
  op.sidelines = sidelines;
  return op;
}

const openings = (read('catalog.json') as Catalog).openings.map((o) => load(o.id));
const byId = new Map(openings.map((op) => [op.id, op]));
const london = byId.get('london')!;
const sans = (line: { plies: { san: string }[] }) => line.plies.slice(1).map((p) => p.san);

/** What gamePositions.ts does on the server (it can't be imported outside Next). */
function replay(moves: string[]): GamePosition[] {
  const chess = new Chess();
  return moves.map((san) => {
    const m = chess.move(san);
    const fen = m.after.split(' ')[0].replace(/\d/g, (n) => '.'.repeat(Number(n))).replaceAll('/', '');
    return { key: fen + chess.turn(), fen, from: m.from, to: m.to, check: chess.inCheck() };
  });
}

function game(moves: string[], colour: 'white' | 'black', extra: Partial<ImportedGame> = {}): ImportedGame {
  return {
    site: 'lichess',
    id: Math.random().toString(36).slice(2),
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
    ...extra,
  };
}

test('SAN read off the shipped legal moves lands on the course’s own squares, for every move in every tree', () => {
  let checked = 0;
  for (const op of openings) {
    for (const side of ['white', 'black'] as const) {
      const tree = buildTree(op, side);
      for (const node of Object.values(tree.nodes)) {
        if (!node.legal) continue;
        for (const e of node.moves) {
          assert.deepEqual(resolveSan(node, e.san), { from: e.from, to: e.to }, `${op.id}: ${e.num}`);
          checked++;
        }
      }
    }
  }
  assert.ok(checked > 500, `only ${checked} moves checked`);
});

test('every engine-scored move resolves to the squares it is scored under', () => {
  for (const line of london.lines) {
    for (const p of line.plies) {
      if (!p.verdicts) continue;
      const node = { fen: p.fen, toMove: toMove(p), legal: p.legal };
      for (const [uci, [san]] of Object.entries(p.verdicts)) {
        assert.deepEqual(resolveSan(node, san), { from: uci.slice(0, 2), to: uci.slice(2, 4) }, `${line.slug}: ${san}`);
      }
    }
  }
});

test('a game that plays a whole chapter stays in its course to the end', () => {
  for (const op of openings) {
    for (const line of op.lines) {
      const side = lineSide(op, line);
      const w = walkCourse(op, side, sans(line));
      assert.equal(depthOf(w), line.plies.length - 1, `${op.id}/${line.slug}`);
      assert.ok(w.outcome === 'over' || w.outcome === 'end');
      assert.equal(w.met, null, `${op.id}/${line.slug}: a chapter move counted as leaving the chapters`);
      const plies = walkPlies(op, w);
      assert.deepEqual(plies.map((p) => p.fen), line.plies.map((p) => p.fen));
    }
  }
});

test('the learner’s own wrong move is where the game left, with the course move and the engine’s verdict', () => {
  const line = london.lines[0];
  const you = turnOf(lineSide(london, line));
  const tree = buildTree(london, lineSide(london, line));
  let tried = 0;
  for (let i = 0; i + 1 < line.plies.length; i++) {
    const at = line.plies[i];
    if (toMove(at) !== you || !at.verdicts) continue;
    const taught = new Set(tree.nodes[positionKey(at)].moves.map((e) => bareSan(e.san)));
    const wrong = Object.values(at.verdicts).find(([san]) => !taught.has(bareSan(san)));
    if (!wrong) continue;
    const moves = [...sans(line).slice(0, i), wrong[0], 'h6'];
    const w = walkCourse(london, 'white', moves);
    assert.equal(w.outcome, 'you');
    assert.equal(depthOf(w), i);
    assert.equal(w.played, wrong[0]);
    const d = deviationOf(london, w)!;
    assert.equal(d.key, positionKey(at));
    const taughtHere = d.course.find((c) => c.num === line.plies[i + 1].num);
    assert.ok(taughtHere, `${line.plies[i + 1].num} missing from the course moves`);
    assert.deepEqual(taughtHere.arrow, { from: line.plies[i + 1].from, to: line.plies[i + 1].to });
    assert.equal(d.played.num, moveNum(i, wrong[0]));
    assert.ok(d.played.arrow, `${wrong[0]} didn’t resolve`);
    assert.ok(d.verdict, `no verdict for ${wrong[0]}`);
    assert.ok(d.teaches.some((t) => t.slug === line.slug));
    tried++;
  }
  assert.ok(tried >= 3);
});

test('an opponent move the course doesn’t have says so; a sideline or authored deviation is named', () => {
  const line = london.lines[0];
  // 1.d4 a5 is in no chapter, deviation or sideline.
  const off = walkCourse(london, 'white', ['d4', 'a5', 'Bf4']);
  assert.equal(off.outcome, 'them');
  assert.equal(off.met?.kind, 'uncovered');
  assert.equal(off.met?.num, '1...a5');

  const s = london.sidelines!.items.find((x) => x.line && x.kind === 'answer')!;
  const w = walkCourse(london, 'white', sans(s.line!));
  assert.equal(w.met?.kind, 'sideline');
  assert.equal(w.met?.slug, s.slug);
  assert.ok(w.sidelines.includes(s.slug));
  assert.ok(w.outcome === 'over' || w.outcome === 'end');

  const chapterMoves = new Set(london.lines.flatMap((l) => l.plies.slice(1).map((p, i) => positionKey(l.plies[i]) + p.san)));
  let branches = 0;
  for (const l of london.lines) {
    l.plies.forEach((p, i) => {
      if (p.bx === undefined || toMove(p) === 'w') return;
      for (const b of london.branchsets![p.bx]) {
        if (chapterMoves.has(positionKey(p) + b.san)) continue;
        const w = walkCourse(london, 'white', [...sans(l).slice(0, i), ...b.plies.map((x) => x.san)]);
        assert.equal(w.met?.ply, i, `${l.slug}: ${b.plies[0].num} not seen as leaving the chapter`);
        assert.ok(w.met.kind === 'branch' || w.met.kind === 'sideline');
        if (w.met.kind === 'branch') {
          assert.equal(w.met.sev, b.sev);
          branches++;
        }
      }
    });
  }
  assert.ok(branches > 0);
});

test('replayed positions agree with the course’s own, so every chapter walks the same either way', () => {
  for (const op of openings) {
    for (const line of op.lines) {
      const moves = sans(line);
      const bySan = walkCourse(op, lineSide(op, line), moves);
      const byPosition = walkCourse(op, lineSide(op, line), moves, replay(moves));
      assert.deepEqual(byPosition.steps.map((s) => s.key), bySan.steps.map((s) => s.key), `${op.id}/${line.slug}`);
      assert.equal(byPosition.detours.length, 0);
    }
  }
});

test('another move order into the course is a detour, not an exit', () => {
  // The London by way of 2.Nf3: the course plays 2.Bf4 and 3.e3 first, then 4.Nf3.
  const moves = ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4', 'c5', 'e3', 'Nc6', 'a3', 'a6'];
  assert.equal(walkCourse(london, 'white', moves).outcome, 'you');
  assert.equal(depthOf(walkCourse(london, 'white', moves)), 2);
  const w = walkCourse(london, 'white', moves, replay(moves));
  assert.ok(depthOf(w) >= 8, `left at ply ${depthOf(w)}`);
  assert.deepEqual(w.detours[0]?.from, 2);
  assert.ok(w.steps.at(-1)!.book);
  const plies = walkPlies(london, w);
  assert.equal(plies.length, w.steps.length);
  assert.deepEqual(plies.map((p) => p.san), ['', ...moves.slice(0, depthOf(w))]);

  // Starting off 1.Nf3 and never reaching a London position stays out.
  const elsewhere = ['Nf3', 'd5', 'g3', 'Nf6', 'Bg2'];
  assert.equal(matchGame([london], new Set(['london']), 'white', elsewhere, replay(elsewhere)), null);
});

test('matching picks the colour played, prefers studied courses and ignores other first moves', () => {
  const sicilian = byId.get('sicilian')!;
  const moves = sans(sicilian.lines[0]);
  const asBlack = matchGame(openings, new Set(), 'black', moves);
  assert.ok(asBlack);
  assert.equal(asBlack.side, 'black');
  const asWhite = matchGame(openings, new Set(), 'white', moves);
  if (asWhite) assert.notEqual(asWhite.openingId, 'sicilian');

  assert.equal(matchGame(openings, new Set(), 'white', ['Nf3', 'd5', 'g3']), null);
  // As Black, choosing another reply to 1.e4 isn't forgetting the Sicilian.
  assert.equal(matchGame([sicilian], new Set(['sicilian']), 'black', ['e4', 'a6', 'd4']), null);

  const b2 = byId.get('londonb2')!;
  const b2line = b2.lines.find((l) => lineSide(b2, l) === 'white')!;
  const deep = matchGame(openings, new Set(), 'white', sans(b2line));
  const mine = matchGame(openings, new Set(['london']), 'white', sans(b2line));
  assert.ok(deep && mine);
  assert.equal(mine.openingId, 'london');
  assert.ok(depthOf(deep) >= depthOf(mine));
});

test('the report counts what was forgotten, what opponents played and how each kind of game went', () => {
  const line = london.lines[0];
  const at = line.plies.findIndex((p, i) => i > 2 && toMove(p) === 'w' && !!p.verdicts);
  const tree = buildTree(london, 'white');
  const taught = new Set(tree.nodes[positionKey(line.plies[at])].moves.map((e) => bareSan(e.san)));
  const wrong = Object.values(line.plies[at].verdicts!).find(([san]) => !taught.has(bareSan(san)))![0];
  const left = [...sans(line).slice(0, at), wrong, 'a6'];
  const games = [
    game(left, 'white', { result: 'loss' }),
    game(left, 'white', { result: 'draw', playedAt: new Date('2026-11-22T12:00:00Z') }),
    game(sans(line), 'white', { result: 'win' }),
    game(['d4', 'a5', 'Bf4'], 'white', { result: 'win' }),
    game(['Nf3', 'd5'], 'white', { openingName: 'Zukertort Opening: Quiet System' }),
  ];
  const learnedAt = new Date('2026-11-21T00:00:00Z');
  const learned = new Map([['london', new Map([[line.slug, learnedAt]])]]);
  const { report, matched } = buildReport(games, openings, new Set(['london']), learned);
  assert.equal(report.games, 5);
  const g = report.courses.find((c) => c.openingId === 'london')!;
  assert.ok(g.studied);
  assert.equal(g.games.length, 4);
  assert.deepEqual([g.left.games, g.left.loss, g.left.draw], [2, 1, 1]);
  assert.deepEqual([g.knew.games, g.knew.win], [2, 2]);
  assert.equal(g.forgotten.length, 1);
  assert.equal(g.forgotten[0].times, 2);
  assert.equal(g.forgotten[0].instead[0].times, 2);
  // Only the game after Learn counts as forgetting.
  assert.ok(g.forgotten[0].forgot);
  assert.equal(forgot(matched[0].deviation!, games[0].playedAt), false);
  assert.equal(forgot(matched[1].deviation!, games[1].playedAt), true);
  assert.ok(g.departures.some((d) => d.num === '1...a5' && d.kind === 'uncovered' && d.times === 1));
  assert.deepEqual(report.elsewhere, [{ name: 'Zukertort Opening', games: 1, white: 1, black: 0 }]);
  assert.deepEqual(practiceKeys(report), [{ openingId: 'london', key: g.forgotten[0].key, times: 2 }]);
  assert.deepEqual(practiceKeys(report, 'sicilian'), []);
});

test('imports read both sites, from the learner’s side of the board', () => {
  const li: LichessGame = {
    id: 'rBRo2im9',
    rated: true,
    variant: 'standard',
    speed: 'blitz',
    createdAt: 1795458521054,
    lastMoveAt: 1795459355640,
    status: 'outoftime',
    players: {
      white: { user: { name: 'Thibault', id: 'thibault' }, rating: 1762 },
      black: { user: { name: 'Vladimir23_38', id: 'vladimir23_38' }, rating: 1813 },
    },
    winner: 'white',
    opening: { name: 'Sicilian Defense: Dragon Variation, Accelerated Dragon' },
    moves: 'e4 c5 Nf3 d6 d4 cxd4',
  };
  const a = fromLichess(li, 'VLADIMIR23_38')!;
  assert.equal(a.colour, 'black');
  assert.equal(a.result, 'loss');
  assert.equal(a.opponent, 'Thibault');
  assert.equal(a.url, 'https://lichess.org/rBRo2im9/black');
  assert.deepEqual(a.moves, ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4']);
  assert.equal(fromLichess({ ...li, variant: 'chess960' }, 'thibault'), null);
  assert.equal(fromLichess({ ...li, rated: false }, 'thibault'), null);
  assert.equal(fromLichess({ ...li, winner: undefined, status: 'draw' }, 'thibault')!.result, 'draw');

  const pgn = `[Event "Live Chess"]\n[White "WiktorGolis"]\n[Black "Hikaru"]\n\n1. e4 {[%clk 0:03:00]} 1... d5 {[%clk 0:03:00]} 2. Nc3 $1 (2. exd5 Qxd5 (2... Nf6)) 2... d4 3. Nce2 c5 4. O-O-O+ 0-1`;
  assert.deepEqual(pgnMoves(pgn), ['e4', 'd5', 'Nc3', 'd4', 'Nce2', 'c5', 'O-O-O+']);
  const cc: ChesscomGame = {
    url: 'https://www.chess.com/game/live/187870750042',
    uuid: '361f307a-e78b-11f1-99c9-00282801000f',
    pgn,
    rated: true,
    rules: 'chess',
    time_class: 'blitz',
    end_time: 1795472200,
    initial_setup: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    white: { username: 'WiktorGolis', rating: 3062, result: 'resigned' },
    black: { username: 'Hikaru', rating: 3442, result: 'win' },
    eco: 'https://www.chess.com/openings/Scandinavian-Defense-Closed-2...d4-3.Nce2-c5',
  };
  const b = fromChesscom(cc, 'hikaru')!;
  assert.equal(b.colour, 'black');
  assert.equal(b.result, 'win');
  assert.equal(b.openingName, 'Scandinavian Defense Closed');
  assert.equal(fromChesscom({ ...cc, white: { ...cc.white, result: 'repetition' } }, 'wiktorgolis')!.result, 'draw');
  assert.equal(fromChesscom({ ...cc, rules: 'chess960' }, 'hikaru'), null);
  assert.equal(fromChesscom(cc, 'someoneelse'), null);
  assert.equal(chesscomOpening(undefined), null);

  assert.equal(usernameFrom('  thibault '), 'thibault');
  assert.equal(usernameFrom('https://lichess.org/@/DrNykterstein'), 'DrNykterstein');
  assert.equal(usernameFrom('https://www.chess.com/member/Hikaru'), 'Hikaru');
  assert.equal(usernameFrom('@hikaru'), 'hikaru');
  assert.equal(usernameFrom('no spaces please'), null);
  assert.equal(usernameFrom('../etc'), null);
});
