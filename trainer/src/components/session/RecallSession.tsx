'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { finishRecall, gradeRecall } from '@/app/actions';
import Board, { type BoardArrow, type BoardFlash } from '@/components/Board';
import { Flame } from '@/components/ui/icons';
import type { Graded } from '@/lib/cards';
import { colourName, otherTurn } from '@/lib/course';
import { retryRun, type Run } from '@/lib/recall';
import { play, type SoundSet } from '@/lib/sound';
import type { Severity } from '@/lib/types';
import { Coach, CoachAvatar, SessionFrame, useMessages, usePrimaryKey, type Msg, type Tone } from './Frame';
import { MoveTape, squareIndex } from './LineSession';

/* A round of Recall: the board replays the moves leading to each due position and the learner
   finds the move from memory. A right answer is graded and the round flows on; a miss shows the
   move, makes the learner play it, and brings the position back a few runs later until it's found
   — the correction is part of the learning, not just the score. */

interface Props {
  runs: Run[];
  /** Due cards left for another round after this one. */
  remaining: number;
  title: string;
  closeHref: string;
  againHref: string;
  sound: SoundSet;
  coordinates: boolean;
}

type Phase = 'replay' | 'ask' | 'reveal' | 'answered' | 'done';
type Queued = Run & { retry?: boolean };

interface Answer {
  openingId: string;
  course: string;
  num: string;
  hit: boolean;
  graded?: Graded | null;
}

const REPLAY_MS = 380;
const ANSWERED_MS = 1200;
/** Runs later that a missed move is asked again. */
const RETRY_GAP = 2;

const SEV_WORD: Record<Severity, string> = {
  playable: 'playable',
  inaccuracy: 'an inaccuracy',
  blunder: 'a mistake',
};

const PRAISE = ['Nice!', 'Correct!', 'Remembered!', 'That’s it!', 'Sharp!'];

export function interval(days: number) {
  if (days <= 1) return 'tomorrow';
  if (days < 14) return `in ${days} days`;
  if (days < 60) return `in ${Math.round(days / 7)} weeks`;
  if (days < 365) return `in ${Math.round(days / 30)} months`;
  return 'in a year';
}

function badgeFor(g: Graded | null) {
  if (!g) return 'Not saved';
  if (g.repeat) return 'Practised today';
  return `Next ${interval(g.days)}`;
}

/** Each run opens with the course it comes from. */
function opening(run: Queued): Omit<Msg, 'id'> {
  if (run.retry) return { kind: 'hint', title: 'One more look', text: `The move you missed in the ${run.course}.` };
  return {
    kind: 'intro',
    title: run.course,
    text:
      run.asks.length > 1
        ? `${run.asks.length} moves to find in this line. You play ${colourName(run.side)}.`
        : `Find your move. You play ${colourName(run.side)}.`,
  };
}

export default function RecallSession({ runs, remaining: left, title, closeHref, againHref, sound, coordinates }: Props) {
  // Saving the round revalidates the page with a fresh one: hold the round this one started with.
  const [queue, setQueue] = useState<Queued[]>(runs);
  const [remaining] = useState(left);
  const [total] = useState(() => runs.reduce((n, run) => n + run.asks.length, 0));
  const [r, setR] = useState(0);
  const run = queue[r] as Queued | undefined;
  const [ply, setPly] = useState(run?.start ?? 0);
  const [k, setK] = useState(0);
  const [phase, setPhase] = useState<Phase>('replay');
  const [auto, setAuto] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [tone, setTone] = useState<Tone>('idle');
  const [flash, setFlash] = useState<BoardFlash | null>(null);
  const make = useMessages();
  const [msgs, setMsgs] = useState<Msg[]>(() => (run ? [make(opening(run))] : []));
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const askedAt = useRef(0);
  const say = (m: Omit<Msg, 'id'>) => {
    const msg = make(m);
    setMsgs((list) => [...list, msg]);
    return msg.id;
  };
  const tag = (id: number, patch: Partial<Msg>) =>
    setMsgs((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const ask = run?.asks[k];
  const expected = ask && run ? run.plies[ask.at + 1] : undefined;

  // The replay: the line plays itself up to the next question.
  useEffect(() => {
    if (phase !== 'replay' || !run || !ask) return;
    if (ply >= ask.at) {
      setPhase('ask');
      askedAt.current = performance.now();
      return;
    }
    const t = setTimeout(
      () => {
        const move = run.plies[ply + 1];
        play(run.plies[ply].fen[squareIndex(move.to!)] !== '.' ? 'capture' : 'move', sound);
        setPly(ply + 1);
      },
      ply === run.start ? 650 : REPLAY_MS,
    );
    return () => clearTimeout(t);
  }, [phase, ply, run, ask, sound]);

  const finish = useCallback(
    (all: Answer[]) => {
      setPhase('done');
      setTone('done');
      play('done', sound);
      const byCourse = new Map<string, { openingId: string; correct: number; wrong: number }>();
      for (const a of all) {
        const c = byCourse.get(a.openingId) ?? { openingId: a.openingId, correct: 0, wrong: 0 };
        if (a.hit) c.correct++;
        else c.wrong++;
        byCourse.set(a.openingId, c);
      }
      void finishRecall([...byCourse.values()]).catch(() => undefined);
    },
    [sound],
  );

  const advance = useCallback(() => {
    if (!run) return;
    setAuto(false);
    setFlash(null);
    setTone('idle');
    if (k + 1 < run.asks.length) {
      setK(k + 1);
      setPhase('replay');
    } else if (r + 1 < queue.length) {
      // Moved together, so no render pairs the next run with this one's position.
      setR(r + 1);
      setPly(queue[r + 1].start);
      setK(0);
      setPhase('replay');
      say(opening(queue[r + 1]));
    } else {
      finish(answers);
    }
  }, [run, k, r, queue, finish, answers]);

  useEffect(() => {
    if (phase !== 'answered' || !auto) return;
    const t = setTimeout(advance, ANSWERED_MS);
    return () => clearTimeout(t);
  }, [phase, auto, advance]);

  /** Saves a first attempt and tags the coach's message with when the move comes back. */
  const grade = (hit: boolean, msgId: number) => {
    if (!run || !ask || !expected) return;
    const answer: Answer = { openingId: run.openingId, course: run.course, num: expected.num, hit };
    setAnswers((list) => [...list, answer]);
    const ms = Math.round(performance.now() - askedAt.current);
    gradeRecall({ openingId: run.openingId, key: ask.key, hit, ms })
      .catch(() => null)
      .then((g) => {
        answer.graded = g;
        tag(msgId, { badge: badgeFor(g) });
        if (g?.mastered) {
          say({ kind: 'done', title: '★ In long-term memory', text: `${expected.num} in the ${run.course} won’t need asking for weeks.` });
          play('done', sound);
        }
      });
  };

  const miss = (from: string | null, to: string | null) => {
    if (!run || !ask || !expected) return;
    play('bad', sound);
    setTone('bad');
    setFlash(from && to ? { sq: to, kind: 'bad' } : null);
    setCombo(0);
    const alt = from ? ask.alternatives.find((a) => a.from === from && a.to === to) : undefined;
    const id = say(
      !from
        ? { kind: 'hint', title: `The move is ${expected.num}`, text: 'Play it to lock it in.' }
        : alt
          ? {
              kind: 'oops',
              title: `${alt.san} is ${SEV_WORD[alt.sev]}${alt.name ? ` — ${alt.name}` : ''}`,
              html: `${alt.why} <em>The course plays ${expected.num}: play it.</em>`,
            }
          : { kind: 'oops', title: 'Not this time', text: `The move here is ${expected.num}. Play it to carry on.` },
    );
    if (!run.retry) grade(false, id);
    // Found again later in the round, a miss is relearned while the correction is fresh.
    const again: Queued = { ...retryRun(run, ask), retry: true };
    setQueue((q) => {
      const at = Math.min(q.length, r + 1 + RETRY_GAP);
      return [...q.slice(0, at), again, ...q.slice(at)];
    });
    setPhase('reveal');
  };

  const onMove = (from: string, to: string) => {
    if (!run || !ask || !expected) return;
    const capture = run.plies[ask.at].fen[squareIndex(to)] !== '.';
    if (phase === 'ask' && ask.accept.includes(from + to)) {
      play(capture ? 'capture' : 'move', sound);
      play('good', sound);
      setFlash({ sq: expected.to!, kind: 'good' });
      setTone('good');
      setPly(ask.at + 1);
      if (run.retry) {
        say({ kind: 'yours', title: `${expected.num} ✓`, text: 'Found it this time.' });
      } else {
        const streak = combo + 1;
        setCombo(streak);
        setBest((b) => Math.max(b, streak));
        const id = say({ kind: 'yours', title: `${expected.num} ✓`, html: expected.note, badge: 'Saving…' });
        grade(true, id);
        if (streak % 5 === 0) say({ kind: 'info', title: `${streak} in a row!`, text: streak >= 15 ? 'Unstoppable.' : streak >= 10 ? 'On fire.' : 'Keep it going.' });
      }
      setAuto(true);
      setPhase('answered');
      return;
    }
    if (phase === 'reveal' && from === expected.from && to === expected.to) {
      play(capture ? 'capture' : 'move', sound);
      setFlash({ sq: to, kind: 'good' });
      setTone('info');
      setPly(ask.at + 1);
      say({ kind: 'yours', title: expected.num, html: expected.note ?? undefined, text: expected.note ? undefined : 'It comes back in a moment.' });
      setAuto(false);
      setPhase('answered');
      return;
    }
    if (phase === 'ask') {
      miss(from, to);
      return;
    }
    if (phase === 'reveal') {
      play('bad', sound);
      setFlash({ sq: to, kind: 'bad' });
    }
  };

  const showMe = () => {
    if (phase === 'ask') miss(null, null);
  };

  usePrimaryKey(phase === 'answered' ? advance : phase === 'done' && remaining > 0 ? () => (window.location.href = againHref) : null);

  if (!run) return null;
  const hits = answers.filter((a) => a.hit).length;
  const current = run.plies[ply];
  const orientation = flipped ? otherTurn(run.side) : run.side;
  const arrows: BoardArrow[] =
    phase === 'reveal' && expected?.from && expected.to ? [{ from: expected.from, to: expected.to, kind: 'hint' }] : [];

  const footer =
    phase === 'done' ? (
      <>
        <div className="foot__text">
          <strong>{hits === answers.length ? 'Flawless round!' : hits / Math.max(1, answers.length) >= 0.7 ? 'Good round' : 'Round complete'}</strong>
          <span>
            {hits} of {answers.length} found first time
            {remaining > 0 ? ` · ${remaining} more due` : ' · all caught up'}
          </span>
        </div>
        <div className="foot__actions">
          <Link className="btn btn--ghost" href={closeHref}>
            Done
          </Link>
          {remaining > 0 ? (
            <a className="btn btn--primary" href={againHref}>
              Next round
            </a>
          ) : null}
        </div>
      </>
    ) : (
      <>
        <div className="foot__text">
          <strong>
            {phase === 'answered'
              ? tone === 'good'
                ? PRAISE[answers.length % PRAISE.length]
                : 'Locked in'
              : phase === 'reveal'
                ? 'Play the arrow'
                : phase === 'ask'
                  ? 'Your move'
                  : 'Watch the line'}
          </strong>
          <span>
            {phase === 'ask'
              ? 'From memory.'
              : phase === 'reveal'
                ? `The move is ${expected?.num}`
                : phase === 'answered' && tone !== 'good'
                  ? 'You’ll get it again this round.'
                  : run.course}
          </span>
        </div>
        {phase === 'ask' ? (
          <button type="button" className="btn btn--ghost" onClick={showMe}>
            Show me
          </button>
        ) : null}
        {phase === 'answered' ? (
          <button type="button" className="btn btn--primary" onClick={advance}>
            Continue
          </button>
        ) : null}
      </>
    );

  return (
    <SessionFrame
      onFlip={() => setFlipped((f) => !f)}
      closeHref={closeHref}
      title={title}
      progress={total ? answers.length / total : 0}
      counter={`${answers.length}/${total}`}
      tone={tone}
      board={
        <Board
          fen={current.fen}
          orientation={orientation}
          last={current.from ? { from: current.from, to: current.to } : null}
          legal={current.legal}
          movable={phase === 'ask' || phase === 'reveal' ? run.side : null}
          onMove={onMove}
          arrows={arrows}
          flash={flash}
          checkSide={current.check ? otherTurn(current.turn) : null}
          coordinates={coordinates}
        />
      }
      side={
        phase === 'done' ? (
          <Summary answers={answers} best={best} />
        ) : (
          <>
            <div className="recall-head">
              <CoachAvatar />
              <Combo combo={combo} />
            </div>
            <Coach msgs={msgs} />
            <MoveTape plies={run.plies} upTo={ply} />
          </>
        )
      }
      footer={footer}
    />
  );
}

/** The run of moves found first time without a miss. */
function Combo({ combo }: { combo: number }) {
  if (combo < 2) return null;
  return (
    <span className={`combo${combo >= 10 ? ' combo--blazing' : combo >= 5 ? ' combo--hot' : ''}`} aria-label={`${combo} in a row`}>
      <Flame size={18} />
      <b key={combo} className="combo__n">
        {combo}
      </b>
      in a row
    </span>
  );
}

function Summary({ answers, best }: { answers: Answer[]; best: number }) {
  const hits = answers.filter((a) => a.hit);
  const missed = answers.filter((a) => !a.hit);
  const mastered = answers.filter((a) => a.graded?.mastered).length;
  const furthest = hits.reduce((d, a) => Math.max(d, a.graded && !a.graded.repeat ? a.graded.days : 0), 0);
  return (
    <section className="recap" aria-label="Round summary">
      <h2 className="recap__title">Round summary</h2>
      <div className="recap__tiles">
        <div className="recap__tile recap__tile--green">
          <b>
            {hits.length}/{answers.length}
          </b>
          <span>found first time</span>
        </div>
        <div className="recap__tile recap__tile--gold">
          <b>{best}</b>
          <span>best streak</span>
        </div>
        <div className="recap__tile recap__tile--purple">
          <b>{mastered}</b>
          <span>into long-term memory</span>
        </div>
      </div>
      {furthest > 1 ? (
        <p className="muted small">
          Your strongest answer won’t be asked again until {interval(furthest).replace(/^in /, '')} from now. Each right answer
          stretches the gap; each miss brings the move back tomorrow.
        </p>
      ) : null}
      {missed.length ? (
        <div className="recap__missed">
          <h3>Back tomorrow</h3>
          <ul>
            {missed.map((a, i) => (
              <li key={i}>
                <b>{a.num}</b> <span className="muted">· {a.course}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="recap__clean">No misses. Every move this round will wait longer next time.</p>
      )}
    </section>
  );
}
