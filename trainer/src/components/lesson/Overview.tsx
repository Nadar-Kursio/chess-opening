'use client';

import { useState } from 'react';
import Board from '@/components/Board';
import type { DemoBoard, Lesson, Opening, Seg, Turn } from '@/lib/types';

/* The opening's theory, with every move it names made tappable: a tap shows that position on the
   board beside the text, and the arrows step along the run. Positions come from the build
   (engine/lesson.py replays every move the prose names); nothing is computed here. */

/** Only the theory travels to the browser, not the lines. */
export type OverviewData = Pick<Opening, 'orientation' | 'theory' | 'progression' | 'lesson'>;

type Tab = 'idea' | 'plans' | 'structure' | 'traps' | 'study';

interface Card {
  key: string;
  title?: string;
  paragraphs: Seg[][];
  boards: DemoBoard[];
  hero?: number;
}

function cardsFor(tab: Tab, lesson: Lesson | undefined, op: OverviewData): Card[] {
  if (!lesson) {
    const text = (t: string) => [[t]] as Seg[][];
    if (tab === 'idea') return [{ key: 'idea', paragraphs: text(op.theory.big_idea), boards: [] }];
    if (tab === 'structure') return [{ key: 'structure', paragraphs: text(op.theory.structure), boards: [] }];
    if (tab === 'plans')
      return [
        { key: 'white', title: 'White', paragraphs: op.theory.white_plans.map((t) => [t]), boards: [] },
        { key: 'black', title: 'Black', paragraphs: op.theory.black_plans.map((t) => [t]), boards: [] },
      ];
    return op.theory.traps.map((t, i) => ({ key: `trap${i}`, paragraphs: [[t]], boards: [] }));
  }
  if (tab === 'idea') return [{ key: 'idea', paragraphs: [lesson.idea.seg], boards: lesson.idea.boards ?? [], hero: lesson.idea.hero }];
  if (tab === 'structure')
    return [{ key: 'structure', paragraphs: [lesson.structure.seg], boards: lesson.structure.boards ?? [], hero: lesson.structure.hero }];
  if (tab === 'plans') {
    const boards = lesson.plans.boards ?? [];
    return [
      { key: 'white', title: 'White’s plans', paragraphs: lesson.plans.white, boards, hero: lesson.plans.hero },
      { key: 'black', title: 'Black’s plans', paragraphs: lesson.plans.black, boards, hero: lesson.plans.hero },
    ];
  }
  return lesson.traps.map((t, i) => ({
    key: `trap${i}`,
    title: t.name,
    paragraphs: [t.seg],
    boards: t.boards ?? [],
    hero: t.hero,
  }));
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'idea', label: 'The big idea' },
  { id: 'plans', label: 'Plans' },
  { id: 'structure', label: 'Pawn structure' },
  { id: 'traps', label: 'Traps to know' },
  { id: 'study', label: 'How to study it' },
];

export default function Overview({ op }: { op: OverviewData }) {
  const [tab, setTab] = useState<Tab>('idea');
  const side: Turn = op.orientation === 'white' ? 'w' : 'b';
  const tabs = TABS.filter((t) => t.id !== 'traps' || op.theory.traps.length);

  return (
    <section className="card overview" aria-label="About this opening">
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'tab tab--on' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'study' ? (
        <Study op={op} />
      ) : (
        <Illustrated key={tab} cards={cardsFor(tab, op.lesson, op)} side={side} />
      )}
    </section>
  );
}

function Illustrated({ cards, side }: { cards: Card[]; side: Turn }) {
  const firstWithBoard = cards.findIndex((c) => c.boards.length);
  const [active, setActive] = useState<{ card: number; board: number } | null>(
    firstWithBoard >= 0 ? { card: firstWithBoard, board: cards[firstWithBoard].hero ?? 0 } : null,
  );
  const [flipped, setFlipped] = useState(false);
  const shown = active ? cards[active.card].boards[active.board] : null;
  const orientation: Turn = flipped ? (side === 'w' ? 'b' : 'w') : side;
  const step = (to: number | null | undefined) => {
    if (active && to != null) setActive({ ...active, board: to });
  };
  const hasBoards = firstWithBoard >= 0;

  return (
    <div className={hasBoards ? 'illustrated' : 'illustrated illustrated--text'}>
      <div className="illustrated__text">
        {cards.map((c, ci) => (
          <div key={c.key} className="illustrated__card">
            {c.title ? <h3>{c.title}</h3> : null}
            {c.paragraphs.map((segs, pi) => (
              <p key={pi}>
                {segs.map((seg, si) =>
                  typeof seg === 'string' ? (
                    <span key={si} dangerouslySetInnerHTML={{ __html: seg }} />
                  ) : (
                    <button
                      key={si}
                      type="button"
                      className={
                        active && active.card === ci && active.board === seg.b ? 'move-chip move-chip--on' : 'move-chip'
                      }
                      onClick={() => setActive({ card: ci, board: seg.b })}
                    >
                      {seg.t}
                    </button>
                  ),
                )}
              </p>
            ))}
          </div>
        ))}
        {hasBoards ? <p className="muted small">Tap any move to see it on the board.</p> : null}
      </div>
      {shown ? (
        <div className="illustrated__board">
          <Board
            fen={shown.fen}
            orientation={orientation}
            last={shown.from ? { from: shown.from, to: shown.to } : null}
            checkSide={shown.check ? (shown.turn === 'w' ? 'b' : 'w') : null}
            coordinates
            label={`Position after ${shown.num || 'the start'}`}
          />
          <div className="stepper">
            <button type="button" className="icon-btn" onClick={() => step(shown.p)} disabled={shown.p == null} aria-label="Previous move">
              ‹
            </button>
            <span className="stepper__num">{shown.num || 'Start'}</span>
            <button type="button" className="icon-btn" onClick={() => step(shown.n)} disabled={shown.n == null} aria-label="Next move">
              ›
            </button>
            <button type="button" className="icon-btn" onClick={() => setFlipped(!flipped)} aria-label="Flip the board" title="Flip the board">
              ⇅
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Study({ op }: { op: OverviewData }) {
  const p = op.progression;
  return (
    <div className="study">
      <p className="lead" dangerouslySetInnerHTML={{ __html: p.arc }} />
      <ol className="stages">
        {p.stages.map((s, i) => (
          <li key={i} className="stage">
            <div className="stage__head">
              <span className="stage__num">{i + 1}</span>
              <div>
                <b>{s.tier}</b> <span className="muted small">· {s.when}</span>
                <p dangerouslySetInnerHTML={{ __html: s.goal }} />
              </div>
            </div>
            <dl className="stage__body">
              <dt>Learn</dt>
              <dd>
                <ul>
                  {s.learn.map((l, k) => (
                    <li key={k} dangerouslySetInnerHTML={{ __html: l }} />
                  ))}
                </ul>
              </dd>
              <dt>Practise</dt>
              <dd dangerouslySetInnerHTML={{ __html: s.drill }} />
              <dt>Common mistake</dt>
              <dd dangerouslySetInnerHTML={{ __html: s.mistake }} />
              <dt>You’re ready when</dt>
              <dd dangerouslySetInnerHTML={{ __html: s.ready }} />
            </dl>
          </li>
        ))}
      </ol>
      {p.study ? (
        <p className="muted">
          <b>Going further:</b> <span dangerouslySetInnerHTML={{ __html: p.study }} />
        </p>
      ) : null}
    </div>
  );
}
