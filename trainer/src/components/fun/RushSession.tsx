'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { BoardArrow, BoardFlash } from '@/components/Board';
import { SessionFrame, usePrimaryKey, type Tone } from '@/components/session/Frame';
import { squareIndex } from '@/components/session/LineSession';
import { SessionBoard, useMoveReview } from '@/components/session/SessionBoard';
import { Flame } from '@/components/ui/icons';
import { colourName, otherTurn } from '@/lib/course';
import { saveSession } from '@/lib/outbox';
import { RUSH_SECONDS, RUSH_STRIKES, multiplier, rushOrder, type RushPosition, type RushStep } from '@/lib/rush';
import { play, type SoundSet } from '@/lib/sound';
import '@/app/fun.css';

/* Opening Rush: three minutes, three strikes. A right move scores (times the combo multiplier) and
   the next position follows at once; a wrong one strikes, shows the move the course plays, then
   moves on. The run is saved once, as a session per course it touched, so the streak and the
   daily goal count it. Speed answers aren't graded into Recall: a slip against the clock isn't
   evidence of forgetting. */

interface Props {
  pool: RushPosition[];
  scope: string;
  title: string;
  /** False when the learner has learned nothing yet and the run asks every position. */
  fromLearned: boolean;
  /** Best score for this course (or 'all') before this visit. */
  best: number;
  sound: SoundSet;
  coordinates: boolean;
  closeHref: string;
}

type Phase = 'ready' | 'countdown' | 'play' | 'shown' | 'over';

interface Answer {
  openingId: string;
  course: string;
  hit: boolean;
  /** The course's move, for the list of misses. */
  num: string;
}

interface RunState {
  score: number;
  combo: number;
  bestCombo: number;
  strikes: number;
  answers: Answer[];
}

const FRESH: RunState = { score: 0, combo: 0, bestCombo: 0, strikes: 0, answers: [] };
const RUN_MS = RUSH_SECONDS * 1000;
const COUNT_MS = 650;
/** How long a right answer stays on the board before the next position. */
const NEXT_MS = 420;
/** After a strike: the arrow, then the move played, then on. */
const ARROW_MS = 650;
const STRIKE_MS = 1500;
const LOW_MS = 15_000;

function clock(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The next lap of the pool, not starting with the position the last one ended on. */
function lap(pool: RushPosition[], last?: RushPosition) {
  const order = rushOrder(pool);
  if (last && order.length > 1 && order[0].id === last.id) order.push(order.shift()!);
  return order;
}

export default function RushSession({ pool, scope, title, fromLearned, best: bestBefore, sound, coordinates, closeHref }: Props) {
  // Saving revalidates the page with a fresh pool: keep the one this visit started with.
  const [positions] = useState(pool);
  const [queue, setQueue] = useState<RushPosition[]>(positions);
  const [index, setIndex] = useState(0);
  const pos = queue[index] ?? positions[0];
  const [played, setPlayed] = useState<RushStep | null>(null);
  const history = useMemo(() => (played ? [...pos.history, played] : pos.history), [pos, played]);
  const review = useMoveReview(history);
  const [phase, setPhase] = useState<Phase>('ready');
  const [count, setCount] = useState(3);
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(0);
  const [run, setRun] = useState<RunState>(FRESH);
  const [gain, setGain] = useState<{ n: number; key: number } | null>(null);
  const [tone, setTone] = useState<Tone>('idle');
  const [flash, setFlash] = useState<BoardFlash | null>(null);
  const [arrows, setArrows] = useState<BoardArrow[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [ending, setEnding] = useState<'time' | 'strikes'>('time');
  const [best, setBest] = useState(bestBefore);
  const [record, setRecord] = useState(false);
  const runId = useRef(0);
  const savedRun = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const clearTimers = () => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const start = () => {
    clearTimers();
    runId.current++;
    setQueue(lap(positions));
    setIndex(0);
    setPlayed(null);
    setRun(FRESH);
    setGain(null);
    setFlash(null);
    setArrows([]);
    setTone('idle');
    setRecord(false);
    setCount(3);
    setPhase('countdown');
    play('move', sound);
    later(COUNT_MS, () => {
      setCount(2);
      play('move', sound);
    });
    later(COUNT_MS * 2, () => {
      setCount(1);
      play('move', sound);
    });
    later(COUNT_MS * 3, () => {
      const t = performance.now();
      setEndsAt(t + RUN_MS);
      setNow(t);
      setPhase('play');
      play('good', sound);
    });
  };

  const next = () => {
    setPlayed(null);
    setFlash(null);
    setArrows([]);
    setTone('idle');
    setPhase('play');
    // Called from a timer set during this render's move, so `index` and `queue` are still current.
    if (index + 2 > queue.length) setQueue([...queue, ...lap(positions, queue.at(-1))]);
    setIndex(index + 1);
  };

  const end = (why: 'time' | 'strikes') => {
    clearTimers();
    setEnding(why);
    setArrows([]);
    setPhase('over');
    setTone('done');
    play('done', sound);
  };

  // The clock runs through answers and strikes alike: there is no pause in a rush.
  const running = phase === 'play' || phase === 'shown';
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (running && now >= endsAt) end('time');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, running, endsAt]);

  // The run is saved once it ends, a session per course it touched; the first carries the score.
  useEffect(() => {
    if (phase !== 'over' || savedRun.current === runId.current) return;
    savedRun.current = runId.current;
    if (!run.answers.length) return;
    const byCourse = new Map<string, { correct: number; wrong: number }>();
    for (const a of run.answers) {
      const c = byCourse.get(a.openingId) ?? { correct: 0, wrong: 0 };
      if (a.hit) c.correct++;
      else c.wrong++;
      byCourse.set(a.openingId, c);
    }
    const found = run.answers.filter((a) => a.hit).length;
    [...byCourse].forEach(([openingId, c], i) => {
      saveSession({
        openingId,
        lineSlug: null,
        mode: 'rush',
        ...c,
        hints: 0,
        score: null,
        positions: [],
        ...(i === 0 ? { rush: { scope, score: run.score, found, strikes: run.strikes, bestCombo: run.bestCombo } } : {}),
      });
    });
    if (run.score > best) {
      setRecord(true);
      setBest(run.score);
    }
  }, [phase, run, scope, best]);

  const onMove = (from: string, to: string) => {
    if (phase !== 'play') return;
    const here = pos.history.at(-1)!;
    const capture = here.fen[squareIndex(to)] !== '.';
    const hit = pos.accept.find((a) => a.uci === from + to);
    const answer = { openingId: pos.openingId, course: pos.course, num: pos.answer.num };
    if (hit) {
      const points = multiplier(run.combo);
      const combo = run.combo + 1;
      play(capture ? 'capture' : 'move', sound);
      play(multiplier(combo) > points ? 'done' : 'good', sound);
      setRun((r) => ({
        ...r,
        score: r.score + points,
        combo,
        bestCombo: Math.max(r.bestCombo, combo),
        answers: [...r.answers, { ...answer, hit: true }],
      }));
      setGain({ n: points, key: run.answers.length });
      setPlayed(hit.step);
      setFlash({ sq: to, kind: 'good' });
      setTone('good');
      setPhase('shown');
      later(NEXT_MS, next);
      return;
    }
    const strikes = run.strikes + 1;
    const main = pos.accept.find((a) => a.uci === pos.answer.uci) ?? pos.accept[0];
    play('bad', sound);
    setRun((r) => ({ ...r, combo: 0, strikes, answers: [...r.answers, { ...answer, hit: false }] }));
    setFlash({ sq: to, kind: 'bad' });
    setArrows([{ from: main.step.from!, to: main.step.to!, kind: 'hint' }]);
    setTone('bad');
    setPhase('shown');
    later(ARROW_MS, () => {
      setArrows([]);
      setPlayed(main.step);
      setFlash({ sq: main.step.to!, kind: 'hint' });
      play(here.fen[squareIndex(main.step.to!)] !== '.' ? 'capture' : 'move', sound);
    });
    later(STRIKE_MS, strikes >= RUSH_STRIKES ? () => end('strikes') : next);
  };

  usePrimaryKey(phase === 'ready' || phase === 'over' ? start : null);

  const left = phase === 'ready' || phase === 'countdown' ? RUN_MS : Math.max(0, endsAt - now);
  const found = run.answers.filter((a) => a.hit).length;
  const lastAnswer = run.answers.at(-1);
  const orientation = flipped ? otherTurn(pos.side) : pos.side;

  const footer =
    phase === 'over' ? (
      <>
        <div className="foot__text">
          <strong>{record ? 'New personal best!' : ending === 'time' ? 'Time!' : 'Three strikes'}</strong>
          <span>
            {run.score} point{run.score === 1 ? '' : 's'} · {found} move{found === 1 ? '' : 's'} found
          </span>
        </div>
        <div className="foot__actions">
          <Link className="btn btn--ghost" href={closeHref}>
            Done
          </Link>
          <button type="button" className="btn btn--primary" onClick={start}>
            Play again
          </button>
        </div>
      </>
    ) : phase === 'ready' || phase === 'countdown' ? (
      <>
        <div className="foot__text">
          <strong>{phase === 'ready' ? 'Ready?' : 'Get set'}</strong>
          <span>{fromLearned ? 'Positions from the chapters you’ve learned.' : 'Positions from every chapter of the course.'}</span>
        </div>
        {phase === 'ready' ? (
          <button type="button" className="btn btn--primary" onClick={start}>
            Start
          </button>
        ) : null}
      </>
    ) : (
      <div className="foot__text">
        <strong>
          {tone === 'good'
            ? `Correct! +${gain?.n ?? 1}`
            : tone === 'bad'
              ? `Strike ${run.strikes} of ${RUSH_STRIKES}`
              : `Your move as ${colourName(pos.side)}`}
        </strong>
        <span>{tone === 'bad' && lastAnswer ? `The move was ${lastAnswer.num}` : pos.course}</span>
      </div>
    );

  return (
    <SessionFrame
      onFlip={() => setFlipped((f) => !f)}
      closeHref={closeHref}
      title={`Opening Rush · ${title}`}
      progress={left / RUN_MS}
      counter={clock(left)}
      tone={tone}
      cheer={phase === 'over' ? (ending === 'time' ? 'good' : 'mixed') : undefined}
      board={
        <div className="rush-board">
          <SessionBoard
            review={review}
            orientation={orientation}
            movable={phase === 'play' ? pos.side : null}
            onMove={onMove}
            arrows={arrows}
            flash={flash}
            coordinates={coordinates}
          />
          {phase === 'ready' || phase === 'countdown' ? (
            <div className="rush-cover">
              {phase === 'countdown' ? (
                <b key={count} className="rush-cover__count">
                  {count}
                </b>
              ) : (
                <div className="rush-cover__card">
                  <b>Opening Rush</b>
                  <span>
                    {RUSH_SECONDS / 60} minutes, {RUSH_STRIKES} strikes. Find your move in as many positions as you can.
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      }
      side={
        phase === 'over' ? (
          <Summary run={run} found={found} best={best} record={record} />
        ) : (
          <Scoreboard run={run} left={left} gain={gain} />
        )
      }
      footer={footer}
    />
  );
}

function Scoreboard({ run, left, gain }: { run: RunState; left: number; gain: { n: number; key: number } | null }) {
  const mult = multiplier(run.combo);
  return (
    <section className="rush-panel" aria-label="Score">
      <div className="rush-panel__row">
        <span className={`rush-clock${left <= LOW_MS ? ' rush-clock--low' : ''}`} role="timer" aria-label={`${clock(left)} left`}>
          {clock(left)}
        </span>
        <span className="strikes" aria-label={`${run.strikes} of ${RUSH_STRIKES} strikes`}>
          {Array.from({ length: RUSH_STRIKES }, (_, i) => (
            <span key={i} className={`strike${i < run.strikes ? ' strike--on' : ''}`} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
              </svg>
            </span>
          ))}
        </span>
      </div>
      <div className="rush-panel__row rush-panel__score">
        <span className="rush-score">
          <b key={`score-${run.score}`} className="rush-score__n">
            {run.score}
          </b>
          <span className="muted small">points</span>
          {gain ? (
            <span key={`gain-${gain.key}`} className="rush-score__gain" aria-hidden="true">
              +{gain.n}
            </span>
          ) : null}
        </span>
        <span className={`rush-mult rush-mult--${mult}`} aria-label={`Points times ${mult}`}>
          <b key={mult}>×{mult}</b>
          {run.combo >= 2 ? (
            <span className="rush-mult__combo">
              <Flame size={14} /> {run.combo} in a row
            </span>
          ) : (
            <span className="rush-mult__combo">5 in a row for ×2</span>
          )}
        </span>
      </div>
      <ol className="rush-trail" aria-label="Answers so far">
        {run.answers.slice(-12).map((a, i) => (
          <li key={run.answers.length - 12 + i} className={a.hit ? 'rush-trail__hit' : 'rush-trail__miss'} />
        ))}
      </ol>
    </section>
  );
}

function Summary({ run, found, best, record }: { run: RunState; found: number; best: number; record: boolean }) {
  const misses = run.answers.filter((a) => !a.hit);
  const accuracy = run.answers.length ? Math.round((found / run.answers.length) * 100) : 0;
  return (
    <section className="recap rush-recap" aria-label="Run summary">
      <div className={`rush-final${record ? ' rush-final--record' : ''}`}>
        <span className="muted small">{record ? 'New personal best' : 'Score'}</span>
        <b>{run.score}</b>
        <span className="muted small">{record ? 'Your best yet.' : `Personal best: ${best}`}</span>
      </div>
      <div className="recap__tiles">
        <div className="recap__tile recap__tile--green">
          <b>{found}</b>
          <span>moves found</span>
        </div>
        <div className="recap__tile recap__tile--gold">
          <b>{run.bestCombo}</b>
          <span>best combo</span>
        </div>
        <div className="recap__tile recap__tile--purple">
          <b>{accuracy}%</b>
          <span>accuracy</span>
        </div>
      </div>
      {misses.length ? (
        <div className="recap__missed">
          <h3>Worth another look</h3>
          <ul>
            {misses.map((a, i) => (
              <li key={i}>
                <b>{a.num}</b> <span className="muted">· {a.course}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : run.answers.length ? (
        <p className="recap__clean">No strikes. The clock was the only thing that stopped you.</p>
      ) : null}
    </section>
  );
}
