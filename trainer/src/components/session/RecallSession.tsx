'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { BoardArrow, BoardBadge, BoardFlash } from '@/components/Board';
import { Flame } from '@/components/ui/icons';
import type { Graded } from '@/lib/cards';
import { colourName, otherTurn } from '@/lib/course';
import { verdictOf, verdictWords } from '@/lib/engineView';
import { saveGrade, saveSession } from '@/lib/outbox';
import { judgeTry, learnHref, retryRun, type Run, type Where, type WrongMove } from '@/lib/recall';
import { play, type SoundSet } from '@/lib/sound';
import type { Severity } from '@/lib/types';
import { Coach, CoachAvatar, SessionFrame, useMessages, usePrimaryKey, type Msg, type Tone } from './Frame';
import { squareIndex } from './LineSession';
import { MoveTape, SessionBoard, useMoveReview, type BoardStep } from './SessionBoard';
import '@/app/recall.css';

/* A round of Recall: the board replays the moves leading to each due position and the learner
   finds the move from memory. A right answer is graded and the round flows on. A wrong one is
   played out, crossed, scored where the course ships a score, and taken back for a second try; a
   second miss shows the move and makes the learner play it. Only the first try grades the card,
   and a missed position comes back a few runs later until it's found — the correction is part of
   the learning, not just the score. */

interface Props {
  runs: Run[];
  /** Due cards left for another round after this one. */
  remaining: number;
  title: string;
  closeHref: string;
  againHref: string;
  sound: SoundSet;
  coordinates: boolean;
  /** Shown when the round has nothing to ask. */
  empty?: ReactNode;
}

type Phase = 'replay' | 'ask' | 'tried' | 'reveal' | 'answered' | 'done';
type Queued = Run & { retry?: boolean };

interface Answer {
  openingId: string;
  course: string;
  num: string;
  hit: boolean;
  where: Where | null;
  graded?: Graded | null;
}

/** A wrong move on the board for a beat, before it's taken back. */
interface Tried {
  from: string;
  to: string;
  move: WrongMove;
  then: 'ask' | 'reveal';
}

const REPLAY_MS = 380;
const ANSWERED_MS = 1200;
const TRIED_MS = 1100;
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

/** "the London System", and "the Elephant Trap" rather than "the The Elephant Trap". */
const theCourse = (name: string) => (name.startsWith('The ') ? `the ${name.slice(4)}` : `the ${name}`);

export const whereText = (w: Where) => (w.chapter ? `Chapter ${w.chapter}: ${w.name}` : `Sideline: ${w.name}`);

/** Each run opens with the course it comes from. */
function opening(run: Queued): Omit<Msg, 'id'> {
  if (run.retry) {
    const where = run.asks[0].where;
    return {
      kind: 'hint',
      title: 'One more look',
      text: `The move you missed in ${theCourse(run.course)}${where ? `, in ${where.chapter ? `chapter ${where.chapter}, ` : 'the sideline '}“${where.name}”` : ''}.`,
    };
  }
  return {
    kind: 'intro',
    title: run.course,
    text:
      run.asks.length > 1
        ? `${run.asks.length} moves to find in this line. You play ${colourName(run.side)}.`
        : `Find your move. You play ${colourName(run.side)}.`,
  };
}

export default function RecallSession({ runs, remaining: left, title, closeHref, againHref, sound, coordinates, empty = null }: Props) {
  // Saving the round revalidates the page with a fresh one: hold the round this one started with.
  const [queue, setQueue] = useState<Queued[]>(runs);
  const [remaining] = useState(left);
  const [total] = useState(() => runs.reduce((n, run) => n + run.asks.length, 0));
  const [r, setR] = useState(0);
  const run = queue[r] as Queued | undefined;
  const [ply, setPly] = useState(run?.start ?? 0);
  const [k, setK] = useState(0);
  const [phase, setPhase] = useState<Phase>('replay');
  /** Wrong tries at the question being asked. */
  const [misses, setMisses] = useState(0);
  const [tried, setTried] = useState<Tried | null>(null);
  const [undo, setUndo] = useState<{ from: string; to: string } | null>(null);
  /** A try at this question has moved the bar, so it no longer hides the position's score. */
  const [barShown, setBarShown] = useState(false);
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
  const played: BoardStep[] = run ? run.plies.slice(0, ply + 1) : [];
  const review = useMoveReview(
    tried && run
      ? [
          ...played,
          {
            fen: tried.move.fen,
            from: tried.from,
            to: tried.to,
            check: tried.move.check,
            turn: run.side,
            san: tried.move.san,
            num: `${expected?.num.match(/^\d+\.+/)?.[0] ?? ''}${tried.move.san}`,
            ev: tried.move.ev,
            mate: tried.move.mate,
          },
        ]
      : played,
  );
  const rewind = ask?.where && run ? { href: learnHref(run.openingId, ask.where), label: 'Rewind in Learn' } : undefined;

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

  // Grades read how long the answer took, and checking the line isn't hesitating over the move.
  useEffect(() => {
    if (phase !== 'ask' || !review.isReviewing) return;
    const startedAt = performance.now();
    return () => {
      askedAt.current += performance.now() - startedAt;
    };
  }, [phase, review.isReviewing]);

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
      for (const c of byCourse.values()) {
        saveSession({ ...c, lineSlug: null, mode: 'review', hints: 0, score: null, positions: [] });
      }
    },
    [sound],
  );

  const advance = useCallback(() => {
    if (!run) return;
    setAuto(false);
    setFlash(null);
    setTone('idle');
    setMisses(0);
    setTried(null);
    setUndo(null);
    setBarShown(false);
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
    if (phase !== 'answered' || !auto || review.isReviewing) return;
    const t = setTimeout(advance, ANSWERED_MS);
    return () => clearTimeout(t);
  }, [phase, auto, advance, review.isReviewing]);

  // The wrong move stays a beat, then slides back for the next try or the answer.
  useEffect(() => {
    if (phase !== 'tried' || !tried) return;
    const t = setTimeout(() => {
      play('move', sound);
      setUndo({ from: tried.to, to: tried.from });
      setTried(null);
      setFlash(null);
      setTone(tried.then === 'reveal' ? 'bad' : 'idle');
      setPhase(tried.then);
    }, TRIED_MS);
    return () => clearTimeout(t);
  }, [phase, tried, sound]);

  /** Saves a first attempt and tags the coach's message with when the move comes back. */
  const grade = (hit: boolean, msgId: number) => {
    if (!run || !ask || !expected) return;
    const answer: Answer = { openingId: run.openingId, course: run.course, num: expected.num, hit, where: ask.where };
    setAnswers((list) => [...list, answer]);
    const ms = Math.round(performance.now() - askedAt.current);
    saveGrade({ openingId: run.openingId, key: ask.key, hit, ms }, (state) => {
      if (state.status !== 'saved') {
        answer.graded = null;
        tag(msgId, { badge: state.status === 'queued' ? 'Will sync' : 'Not saved' });
        return;
      }
      const g = state.result.graded;
      answer.graded = g;
      tag(msgId, { badge: badgeFor(g) });
      if (g?.mastered) {
        say({ kind: 'done', title: '★ In long-term memory', text: `${expected.num} in ${theCourse(run.course)} won’t need asking for weeks.` });
        play('done', sound);
      }
    });
  };

  /** The first miss at a question: graded unless this is already a retry, and asked again later. */
  const missed = (msgId: number) => {
    if (!run || !ask) return;
    if (judgeTry(misses, false, !!run.retry).grade !== null) grade(false, msgId);
    if (misses > 0) return;
    setCombo(0);
    // Found again later in the round, a miss is relearned while the correction is fresh.
    const again: Queued = { ...retryRun(run, ask), retry: true };
    setQueue((q) => {
      const at = Math.min(q.length, r + 1 + RETRY_GAP);
      return [...q.slice(0, at), again, ...q.slice(at)];
    });
  };

  const wrongTry = (from: string, to: string, capture: boolean) => {
    if (!run || !ask || !expected) return;
    const { reveal } = judgeTry(misses, false, !!run.retry);
    const position = run.plies[ask.at];
    const alt = ask.alternatives.find((a) => a.from === from && a.to === to);
    const verdict = verdictOf(position, from, to, alt?.sev);
    const words = verdict && verdictWords(verdict, position, expected.num);
    const then = reveal ? `The move here is ${expected.num}. Play it to lock it in.` : 'Taking it back. Have another go.';
    const move = ask.wrong?.[from + to];
    play(capture ? 'capture' : 'move', sound);
    play('bad', sound);
    setTone('bad');
    setUndo(null);
    const id = say({
      ...(alt
        ? { kind: 'oops', title: `${alt.san} is ${SEV_WORD[alt.sev]}${alt.name ? ` (${alt.name})` : ''}`, html: `${alt.why} <em>${then}</em>` }
        : { kind: 'oops', title: words?.title ?? 'Not this time', text: `${words ? `${words.text} ` : ''}${then}` }),
      link: reveal ? rewind : undefined,
    });
    missed(id);
    setMisses(misses + 1);
    if (move) {
      if (move.ev !== undefined) setBarShown(true);
      setTried({ from, to, move, then: reveal ? 'reveal' : 'ask' });
      setFlash({ sq: to, kind: 'bad' });
      setPhase('tried');
    } else {
      setFlash({ sq: to, kind: 'bad', verdict });
      setPhase(reveal ? 'reveal' : 'ask');
    }
  };

  const onMove = (from: string, to: string) => {
    if (!run || !ask || !expected) return;
    const capture = run.plies[ask.at].fen[squareIndex(to)] !== '.';
    if (phase === 'ask' && ask.accept.includes(from + to)) {
      const { grade: first } = judgeTry(misses, true, !!run.retry);
      play(capture ? 'capture' : 'move', sound);
      play('good', sound);
      setUndo(null);
      setFlash({ sq: expected.to!, kind: 'good' });
      setTone('good');
      setPly(ask.at + 1);
      if (first === null) {
        say({
          kind: 'yours',
          title: `${expected.num} ✓`,
          text: misses ? 'Found it on the second try. It comes back once more this round.' : 'Found it this time.',
          link: misses ? rewind : undefined,
        });
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
      setUndo(null);
      setFlash({ sq: to, kind: 'good' });
      setTone('info');
      setPly(ask.at + 1);
      say({ kind: 'yours', title: expected.num, html: expected.note ?? undefined, text: expected.note ? undefined : 'It comes back in a moment.' });
      setAuto(false);
      setPhase('answered');
      return;
    }
    if (phase === 'ask') {
      wrongTry(from, to, capture);
      return;
    }
    if (phase === 'reveal') {
      play('bad', sound);
      setFlash({ sq: to, kind: 'bad' });
    }
  };

  const showMe = () => {
    if (phase !== 'ask' || !expected) return;
    play('bad', sound);
    setTone('bad');
    setUndo(null);
    setFlash(null);
    const id = say({ kind: 'hint', title: `The move is ${expected.num}`, text: 'Play it to lock it in.', link: rewind });
    missed(id);
    setPhase('reveal');
  };

  usePrimaryKey(phase === 'answered' ? advance : phase === 'done' && remaining > 0 ? () => (window.location.href = againHref) : null);

  if (!run) return empty;
  const hits = answers.filter((a) => a.hit).length;
  const orientation = flipped ? otherTurn(run.side) : run.side;
  const arrows: BoardArrow[] =
    phase === 'reveal' && expected?.from && expected.to ? [{ from: expected.from, to: expected.to, kind: 'hint' }] : [];
  const cross: BoardBadge | null = tried ? { sq: tried.to, glyph: '✕', mark: 'wrong' } : null;
  const barOn = barShown || phase === 'reveal' || phase === 'answered' || phase === 'done';
  // A wrong move the course has no score for leaves the bar where it was.
  const engine = run.engineView ? { hidden: !barOn, upTo: tried && tried.move.ev === undefined ? ask?.at : undefined } : null;

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
                ? misses
                  ? 'Got there'
                  : PRAISE[answers.length % PRAISE.length]
                : 'Locked in'
              : phase === 'tried'
                ? 'Not this one'
                : phase === 'reveal'
                  ? 'Play the arrow'
                  : phase === 'ask'
                    ? misses
                      ? 'One more try'
                      : 'Your move'
                    : 'Watch the line'}
          </strong>
          <span>
            {phase === 'ask'
              ? 'From memory.'
              : phase === 'tried'
                ? tried?.then === 'reveal'
                  ? 'The answer is next.'
                  : 'Taking it back.'
                : phase === 'reveal'
                  ? `The move is ${expected?.num}`
                  : phase === 'answered' && (tone !== 'good' || misses)
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
        <SessionBoard
          review={review}
          orientation={orientation}
          movable={phase === 'ask' || phase === 'reveal' ? run.side : null}
          onMove={onMove}
          arrows={arrows}
          flash={flash}
          badge={cross}
          undo={undo}
          coordinates={coordinates}
          engine={engine}
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
            <p className="recall-where">
              <b>{run.course}</b>
              {ask?.where ? <span>{whereText(ask.where)}</span> : null}
            </p>
            <Coach msgs={msgs} />
            <MoveTape review={review} marks={run.engineView} />
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
                <span>
                  <b>{a.num}</b> <span className="muted">· {a.course}</span>
                  {a.where ? <span className="recap__where">{whereText(a.where)}</span> : null}
                </span>
                {a.where ? (
                  <Link className="btn btn--secondary btn--sm recap__rewind" href={learnHref(a.openingId, a.where)}>
                    Rewind in Learn
                  </Link>
                ) : null}
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
