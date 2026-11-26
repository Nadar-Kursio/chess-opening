import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { Rating } from 'ts-fsrs';
import { alternativesAt, lineBySlug, lineSide, positionKey, toMove, turnOf } from '../src/lib/course.ts';
import { MASTERED_DAYS, daysUntil, newCard, ratingFor, review, strengthOf, SLOW_MS } from '../src/lib/memory.ts';
import { buildRuns, courseCards, isCard, judgeTry, learnHref, lineCards, retryRun, ROUND_SIZE, TRIES, type Due } from '../src/lib/recall.ts';
import { withWrongMoves } from '../src/lib/recallMoves.ts';
import type { Opening, Ply } from '../src/lib/types.ts';

const ROOT = process.env.CONTENT_DIR ?? path.join(import.meta.dirname, '..', 'content');
const openings = new Map<string, Opening>(
  readdirSync(path.join(ROOT, 'openings')).map((f) => {
    const op = JSON.parse(readFileSync(path.join(ROOT, 'openings', f), 'utf8')) as Opening;
    return [op.id, op];
  }),
);
const opening = (id: string) => openings.get(id)!;

const isLegal = (p: Ply, uci: string) => {
  const i = p.legal?.indexOf(uci) ?? -1;
  return i >= 0 && i % 4 === 0;
};

test('Learn introduces every position in the line where the learner moves', () => {
  for (const op of openings.values()) {
    for (const line of op.lines) {
      const keys = lineCards(op, line.slug);
      const you = turnOf(lineSide(op, line));
      assert.ok(keys.length > 0, `${op.id}/${line.slug} adds no cards`);
      for (const key of keys) {
        assert.equal(key.at(-1), you, `${op.id}/${line.slug}: a card where the opponent moves`);
        assert.ok(isCard(op, key));
      }
    }
    assert.ok(courseCards(op).size > 0);
  }
});

test('every run replays a real path and asks legal moves from the learner’s chair', () => {
  for (const op of openings.values()) {
    const due: Due[] = [...courseCards(op)].map((key) => ({ openingId: op.id, key }));
    const runs = buildRuns(due, opening, Infinity);
    const asked = runs.flatMap((r) => r.asks.map((a) => a.key));
    assert.equal(new Set(asked).size, asked.length, `${op.id}: a card asked twice`);
    assert.equal(asked.length, due.length, `${op.id}: cards left out`);
    for (const run of runs) {
      for (let i = 1; i < run.plies.length; i++) {
        const before = run.plies[i - 1];
        const move = run.plies[i];
        assert.ok(isLegal(before, move.from! + move.to!), `${op.id}: ${move.num} doesn't follow`);
      }
      for (const ask of run.asks) {
        const at = run.plies[ask.at];
        assert.equal(positionKey(at), ask.key, `${op.id}: ask is off its position`);
        assert.equal(toMove(at), run.side);
        assert.ok(ask.accept.length > 0);
        for (const uci of ask.accept) assert.ok(isLegal(at, uci), `${op.id}: ${uci} illegal at ${at.num}`);
        const answer = run.plies[ask.at + 1];
        assert.ok(ask.accept.includes(answer.from! + answer.to!), `${op.id}: the shown answer isn't accepted`);
      }
      assert.ok(run.start <= run.asks[0].at);
    }
  }
});

test('a round stops at its size, and due cards on one line share a run', () => {
  const op = opening('london');
  const line = op.lines[0];
  const keys = lineCards(op, line.slug);
  const runs = buildRuns(keys.map((key) => ({ openingId: op.id, key })), opening);
  assert.equal(runs.length, 1, 'one line, one replay');
  assert.equal(runs[0].asks.length, Math.min(keys.length, ROUND_SIZE));

  const many = [...openings.values()].flatMap((o) => [...courseCards(o)].map((key) => ({ openingId: o.id, key })));
  const round = buildRuns(many, opening);
  const total = round.reduce((n, r) => n + r.asks.length, 0);
  assert.ok(total <= ROUND_SIZE && total > 0);
});

test('a retry asks only the missed move, with the same answer', () => {
  const op = opening('london');
  const [run] = buildRuns(lineCards(op, op.lines[0].slug).map((key) => ({ openingId: op.id, key })), opening);
  const missed = run.asks[2];
  const again = retryRun(run, missed);
  assert.deepEqual(again.asks, [missed]);
  assert.equal(again.plies.length, missed.at + 2);
  assert.equal(again.plies[missed.at + 1].san, run.plies[missed.at + 1].san);
});

test('grades come from the board: a miss is Again, a slow find is Hard', () => {
  assert.equal(ratingFor(false), Rating.Again);
  assert.equal(ratingFor(true, 2_000), Rating.Good);
  assert.equal(ratingFor(true, SLOW_MS + 1), Rating.Hard);
});

test('right answers stretch the gap; a miss brings the card back tomorrow', () => {
  let now = new Date('2026-10-01T09:00:00Z');
  let card = newCard(now);
  assert.equal(strengthOf(card), 'new');
  const gaps: number[] = [];
  for (let i = 0; i < 4; i++) {
    card = review(card, now, Rating.Good);
    gaps.push(daysUntil(card, now));
    now = card.due;
  }
  for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i] > gaps[i - 1], `gaps should grow: ${gaps}`);
  assert.ok(card.stability >= MASTERED_DAYS, 'four clean recalls reach long-term memory');
  assert.equal(strengthOf(card), 'mastered');

  const lapsed = review(card, now, Rating.Again);
  assert.equal(daysUntil(lapsed, now), 1);
  assert.equal(lapsed.lapses, 1);
});

test('only the first try grades a card, and a second miss shows the move', () => {
  assert.deepEqual(judgeTry(0, true, false), { grade: true, reveal: false });
  assert.deepEqual(judgeTry(0, false, false), { grade: false, reveal: false });
  // Found on the second try: practice, not evidence.
  assert.deepEqual(judgeTry(1, true, false), { grade: null, reveal: false });
  assert.deepEqual(judgeTry(TRIES - 1, false, false), { grade: null, reveal: true });
  // A retry later in the round never grades.
  assert.deepEqual(judgeTry(0, true, true), { grade: null, reveal: false });
  assert.deepEqual(judgeTry(0, false, true), { grade: null, reveal: false });

  // A miss then a find schedules the card as the miss alone would: back tomorrow.
  const now = new Date('2026-10-01T09:00:00Z');
  let card = newCard(now);
  for (const [misses, hit] of [[0, false], [1, true]] as const) {
    const { grade } = judgeTry(misses, hit, false);
    if (grade !== null) card = review(card, now, ratingFor(grade));
  }
  assert.equal(card.reps, 1);
  assert.equal(daysUntil(card, now), 1);
});

test('every card names its chapter, and Rewind opens that chapter just before the move', () => {
  for (const op of openings.values()) {
    const runs = buildRuns([...courseCards(op)].map((key) => ({ openingId: op.id, key })), opening, Infinity);
    for (const run of runs) {
      for (const ask of run.asks) {
        const where = ask.where;
        assert.ok(where, `${op.id}: ${ask.key} has no chapter`);
        const line = lineBySlug(op, where.slug)!;
        assert.ok(line, `${op.id}: ${where.slug} is not a lesson`);
        assert.ok(where.ply >= (line.start ?? 0) && where.ply < line.plies.length - 1, `${op.id}/${where.slug}: ply ${where.ply} is off the lesson`);
        // Learn reaches the card one ply after opening (on it, for a first move), or opens where the
        // opponent's deviation to it leaves the line.
        const own = positionKey(line.plies[where.ply + 1]) === ask.key || (where.ply === 0 && positionKey(line.plies[0]) === ask.key);
        const deviation = alternativesAt(op, line, where.ply).some((b) => b.plies.some((q) => positionKey(q) === ask.key));
        assert.ok(own || deviation, `${op.id}/${where.slug}: Learn opens away from the move`);
        assert.equal(where.chapter, op.lines.includes(line) ? op.lines.indexOf(line) + 1 : null);
        assert.equal(learnHref(op.id, where), `/openings/${op.id}/${where.slug}/learn?at=${where.ply}`);
      }
    }
  }
});

test('a run names a shared position by the chapter it replays', () => {
  const op = opening('london');
  const deep = op.lines.find((l) => l.slug !== op.lines[0].slug && l.plies[1].san === op.lines[0].plies[1].san)!;
  const [run] = buildRuns(lineCards(op, deep.slug).map((key) => ({ openingId: op.id, key })), opening, Infinity);
  assert.ok(run.asks.every((a) => a.where?.slug === deep.slug), 'the first move is named by the chapter being replayed');
});

test('a wrong answer has its board, and only the asked positions carry verdicts', () => {
  for (const op of openings.values()) {
    // The board after each authored alternative is shipped by the build: the replay must agree.
    const shipped = new Map<string, string>();
    for (const line of op.lines) {
      line.plies.forEach((p, i) => {
        for (const b of alternativesAt(op, line, i)) if (b.plies[0].from) shipped.set(positionKey(p) + b.plies[0].from + b.plies[0].to, b.plies[0].fen);
      });
    }
    const due = [...courseCards(op)].map((key) => ({ openingId: op.id, key }));
    const runs = withWrongMoves(buildRuns(due, opening, Infinity), opening);
    let checked = 0;
    for (const run of runs) {
      const asked = new Set(run.asks.map((a) => a.at));
      run.plies.forEach((p, i) => assert.ok(asked.has(i) || !p.verdicts, `${op.id}: verdicts left on ${p.num}`));
      for (const ask of run.asks) {
        const at = run.plies[ask.at];
        assert.ok(ask.wrong, `${op.id}: no wrong moves at ${at.num}`);
        const legal = new Set(at.legal!.match(/.{4}/g));
        for (const uci of ask.accept) legal.delete(uci);
        assert.deepEqual(new Set(Object.keys(ask.wrong)), legal, `${op.id}: wrong moves at ${ask.key} aren't the other legal moves`);
        for (const [uci, w] of Object.entries(ask.wrong)) {
          assert.match(w.fen, /^[.pnbrqkPNBRQK]{64}$/);
          const fen = shipped.get(ask.key + uci);
          if (fen) {
            assert.equal(w.fen, fen, `${op.id}: ${w.san} lands somewhere else than the course has it`);
            assert.ok(w.ev !== undefined, `${op.id}: ${w.san} is shipped with a score the replay lost`);
            checked++;
          }
        }
      }
    }
    if (op.id === 'london') assert.ok(checked > 0, 'the London has alternatives to check against');
  }
});
