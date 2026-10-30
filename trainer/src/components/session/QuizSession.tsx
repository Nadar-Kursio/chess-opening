'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { finishSession } from '@/app/actions';
import Board, { type BoardArrow, type BoardFlash } from '@/components/Board';
import { positionKey, type Question } from '@/lib/course';
import { play, type SoundSet } from '@/lib/sound';
import type { Severity, Turn } from '@/lib/types';
import { useFlip } from './useFlip';
import { Coach, CoachAvatar, SessionFrame, useMessages, usePrimaryKey, type Msg, type Tone } from './Frame';

/* Questions one at a time: the board plays the opponent's move in, the learner answers. Used by a
   chapter's quiz, by "punish the blunder" and by the review of missed positions. Score is the
   share found first time; a quiz passes at 80%. */

interface Props {
  mode: 'quiz' | 'punish' | 'review';
  openingId: string;
  lineSlug: string | null;
  title: string;
  side: Turn;
  questions: (Question & { accept?: string[] })[];
  closeHref: string;
  next: { href: string; label: string } | null;
  sound: SoundSet;
  coordinates: boolean;
}

const SEV_LABEL: Record<Severity, string> = {
  playable: 'Playable',
  inaccuracy: 'Inaccuracy',
  blunder: 'Blunder: punish it',
};

export default function QuizSession(props: Props) {
  const [run, setRun] = useState(0);
  return <Run key={run} {...props} restart={() => setRun((r) => r + 1)} />;
}

function Run({
  mode,
  openingId,
  lineSlug,
  title,
  side,
  questions: shipped,
  closeHref,
  next,
  sound,
  coordinates,
  restart,
}: Props & { restart: () => void }) {
  // Saving a result revalidates the page, and the server shuffles again: hold the order this run
  // started with, or the question under the learner's hand changes mid-quiz.
  const [questions] = useState(shipped);
  const make = useMessages();
  const { orientation, flip } = useFlip(side);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState<'before' | 'position'>('before');
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [tone, setTone] = useState<Tone>('idle');
  const [flash, setFlash] = useState<BoardFlash | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [score, setScore] = useState({ first: 0, wrong: 0 });
  const [done, setDone] = useState<null | { passed: boolean | null; pct: number }>(null);
  const positions = useRef(new Map<string, boolean>());

  const q = questions[index];
  const total = questions.length;

  // Each question opens on the position before the opponent's move, then plays it in.
  useEffect(() => {
    if (!q) return;
    setMsgs([
      make({
        kind: 'intro',
        title: q.kind === 'deviation' ? q.prompt : 'Your move',
        text:
          q.kind === 'deviation'
            ? q.name
              ? `${q.name}. What do you play?`
              : 'They’ve left the main line. What do you play?'
            : 'Find the move from your repertoire.',
      }),
    ]);
    setShown(q.before ? 'before' : 'position');
    if (!q.before) return;
    const t = setTimeout(() => {
      setShown('position');
      play('move', sound);
    }, 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const isAnswer = (from: string, to: string) =>
    (from === q.answer.from && to === q.answer.to) || !!q.accept?.includes(from + to);

  const onMove = (from: string, to: string) => {
    if (solved || shown !== 'position') return;
    if (isAnswer(from, to)) {
      const first = attempts === 0;
      positions.current.set(positionKey(q.position), first);
      setScore((s) => ({ ...s, first: s.first + (first ? 1 : 0) }));
      setSolved(true);
      setTone('good');
      setFlash({ sq: to, kind: 'good' });
      play('good', sound);
      setMsgs((list) => [
        ...list,
        make({ kind: 'yours', title: `${q.answer.num} ✓`, html: q.explain }),
        ...(q.kind === 'deviation' && q.why
          ? [make({ kind: 'info', title: `About ${q.position.num}`, html: q.why })]
          : []),
      ]);
      return;
    }
    play('bad', sound);
    setFlash({ sq: to, kind: 'bad' });
    setTone('bad');
    if (attempts === 0) setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
    setAttempts((a) => a + 1);
    setMsgs((list) => [
      ...list,
      make({
        kind: 'oops',
        text: attempts === 0 ? 'Not that one. Have another look.' : `The answer is ${q.answer.num} — play it to continue.`,
      }),
    ]);
  };

  const advance = async () => {
    if (index + 1 < total) {
      setIndex(index + 1);
      setAttempts(0);
      setSolved(false);
      setTone('idle');
      setFlash(null);
      return;
    }
    const pct = Math.round((score.first / total) * 100);
    setDone({ passed: null, pct });
    setTone('done');
    play('done', sound);
    try {
      const { passed } = await finishSession({
        openingId,
        lineSlug,
        mode: mode === 'review' ? 'review' : 'quiz',
        correct: total,
        wrong: score.wrong,
        hints: 0,
        score: pct,
        positions: [...positions.current].map(([key, hit]) => ({ key, hit })),
      });
      setDone({ passed: mode === 'quiz' ? passed : true, pct });
    } catch {
      setDone({ passed: false, pct });
    }
  };

  usePrimaryKey(solved && !done ? advance : null);

  if (!q) {
    return (
      <div className="empty-state">
        <h1>Nothing to review</h1>
        <p>No positions here yet. Practise a line first.</p>
        <Link className="btn btn--primary" href={closeHref}>
          Back
        </Link>
      </div>
    );
  }

  const board = shown === 'before' && q.before ? q.before : q.position;
  const arrows: BoardArrow[] =
    attempts >= 2 && !solved && q.answer.from && q.answer.to
      ? [{ from: q.answer.from, to: q.answer.to, kind: 'hint' }]
      : [];
  const solvedBoard = solved ? q.answer : board;

  const footer = done ? (
    <>
      <div className="foot__text">
        <strong>
          {mode !== 'quiz'
            ? 'Session complete'
            : done.pct >= 80
              ? 'Quiz passed!'
              : 'Not quite. 80% passes'}
        </strong>
        <span>
          {done.passed === null ? 'Saving…' : `${score.first} of ${total} first time · ${done.pct}%`}
        </span>
      </div>
      <div className="foot__actions">
        <button type="button" className="btn btn--ghost" onClick={restart}>
          Again
        </button>
        <Link className="btn btn--primary" href={done.passed && next ? next.href : closeHref}>
          {done.passed && next ? next.label : 'Back to course'}
        </Link>
      </div>
    </>
  ) : (
    <>
      <div className="foot__text">
        <strong>{solved ? (attempts === 0 ? 'Correct!' : 'Got there') : tone === 'bad' ? 'Not quite' : 'Your move'}</strong>
        <span>{solved ? `Question ${index + 1} of ${total}` : q.kind === 'deviation' ? q.prompt : 'From memory.'}</span>
      </div>
      {solved ? (
        <button type="button" className="btn btn--primary" onClick={advance}>
          {index + 1 < total ? 'Continue' : 'Finish'}
        </button>
      ) : null}
    </>
  );

  return (
    <SessionFrame
      onFlip={flip}
      closeHref={closeHref}
      title={title}
      progress={(index + (solved ? 1 : 0)) / total}
      counter={`${index + 1}/${total}`}
      tone={tone}
      board={
        <Board
          fen={solvedBoard.fen}
          orientation={orientation}
          last={solvedBoard.from ? { from: solvedBoard.from, to: solvedBoard.to } : null}
          legal={q.position.legal}
          movable={!solved && !done && shown === 'position' ? side : null}
          onMove={onMove}
          arrows={arrows}
          flash={flash}
          checkSide={solvedBoard.check ? (solvedBoard.turn === 'w' ? 'b' : 'w') : null}
          coordinates={coordinates}
        />
      }
      side={
        <>
          <CoachAvatar />
          {q.sev ? <span className={`chip chip--${q.sev}`}>{SEV_LABEL[q.sev]}</span> : null}
          <Coach msgs={msgs} />
        </>
      }
      footer={footer}
    />
  );
}
