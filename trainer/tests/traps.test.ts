import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import type { LineProgress } from '../src/lib/course.ts';
import { trapChip, trapName, trapTitle, trapView } from '../src/lib/traps.ts';
import type { Opening, Sidelines } from '../src/lib/types.ts';

// Runs against the real compiled course: CONTENT_DIR, else trainer/content (npm run content).
const ROOT = process.env.CONTENT_DIR ?? path.join(import.meta.dirname, '..', 'content');
const read = (name: string) => JSON.parse(readFileSync(path.join(ROOT, name), 'utf8'));
const opening = (id: string): Opening => {
  const op = read(`openings/${id}.json`) as Opening;
  try {
    op.sidelines = (read(`coaching/${id}.json`) as { sidelines?: Sidelines }).sidelines;
  } catch {
    // a course without coaching has no sidelines
  }
  return op;
};

const done = (slug: string, steps: Partial<LineProgress> = {}): [string, LineProgress] => [
  slug,
  {
    line_slug: slug,
    learned_at: null,
    drilled_at: null,
    recalled_at: null,
    quizzed_at: null,
    quiz_best: null,
    clean_runs: 0,
    runs: 0,
    ...steps,
  },
];

const london = opening('london');
const trap = (id: string) => london.traps!.find((t) => t.id === id)!;

test('names read inside the course they belong to', () => {
  assert.equal(trapName('London: the Poisoned b2-Pawn'), 'the Poisoned b2-Pawn');
  assert.equal(trapName('The Englund Gambit Trap'), 'the Englund Gambit Trap');
  assert.equal(trapName("Noah's Ark Trap"), "Noah's Ark Trap");
  assert.equal(trapTitle('London: the ...h5 Bishop Hunt'), 'The ...h5 Bishop Hunt');
  assert.equal(trapChip({ name: 'London: the Poisoned b2-Pawn', group: 'set' }), 'Trap: the Poisoned b2-Pawn');
  assert.equal(trapChip({ name: 'The Englund Gambit Trap', group: 'watch' }), 'Watch for: the Englund Gambit Trap');
});

test('a trap to set leads to its own course, at the next step', () => {
  const b2 = opening('londonb2');
  const fresh = trapView(london, trap('londonb2'), b2, new Map(), new Map());
  assert.equal(fresh.primary.label, 'Learn to set it');
  assert.equal(fresh.primary.href, `/openings/londonb2/${b2.lines[0].slug}/learn`);
  assert.equal(fresh.defence, undefined);

  const started = trapView(london, trap('londonb2'), b2, new Map([done(b2.lines[0].slug, { learned_at: 'x' })]), new Map());
  assert.equal(started.primary.label, 'Continue: Drill');
  assert.equal(started.progress.done, 1);
});

test('a trap to watch for leads with the course sideline that dodges it', () => {
  const hunt = opening('londonh5hunt');
  const view = trapView(london, trap('londonh5hunt'), hunt, new Map(), new Map());
  assert.equal(view.primary.href, '/openings/london/leaves-2-h5/learn');
  assert.equal(view.primary.label, 'Learn your answer');
  assert.equal(view.secondary.href, '/openings/londonh5hunt');
  assert.equal(view.defence?.name, 'Your answer to 2...h5');
  assert.equal(view.defence?.studied, false);

  const studied = trapView(london, trap('londonh5hunt'), hunt, new Map(), new Map([done('leaves-2-h5', { learned_at: 'x' })]));
  assert.equal(studied.primary.href, '/openings/london/leaves-2-h5/drill');
  assert.equal(studied.defence?.studied, true);
});

test('without a sideline, the dodge is the trap course chapter taught from your side', () => {
  const ruy = opening('ruylopez');
  const pole = ruy.traps!.find((t) => t.id === 'fishingpole')!;
  const view = trapView(ruy, pole, opening('fishingpole'), new Map(), new Map());
  assert.equal(view.primary.href, `/openings/fishingpole/${pole.learn}/learn`);
  assert.match(view.defence!.name, /^Sidestepping it/);
});

test('trap progress is the trap course’s own and never the parent’s', () => {
  const b2 = opening('londonb2');
  const all = new Map(b2.lines.map((l) => done(l.slug, { learned_at: 'x', drilled_at: 'x', recalled_at: 'x', quizzed_at: 'x' })));
  const view = trapView(london, trap('londonb2'), b2, all, new Map());
  assert.equal(view.progress.pct, 100);
  assert.equal(view.primary.label, 'Practise it again');
});
