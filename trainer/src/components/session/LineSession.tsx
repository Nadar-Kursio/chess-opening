'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { finishSession } from '@/app/actions';
import Board, { type BoardArrow, type BoardFlash } from '@/components/Board';
import { colourName, positionKey } from '@/lib/course';
import { play } from '@/lib/sound';
import type { Line, Severity, Turn } from '@/lib/types';
import { Coach, CoachAvatar, SessionFrame, useMessages, usePrimaryKey, type Msg, type Tone } from './Frame';

/* Learn, Drill and Recall: one line, played from the learner's chair. The opponent's moves play
   themselves; the learner's are asked. What changes between the three is how much help there is:
   Learn shows the move and why, Drill hides it but offers hints and the coach's notes, Recall is
   the line from memory with the commentary held back until the end. */

export interface Alternative {
  san: string;
  from: string;
  to: string;
  sev: Severity;
  why: string;
  name?: string;
}

interface Props {
  mode: 'learn' | 'drill' | 'recall';
  openingId: string;
  title: string;
  line: Line;
  side: Turn;
  /** The authored alternatives to the learner's move, by the ply index the move is played from. */
  alternatives: Record<number, Alternative[]>;
  closeHref: string;
  next: { href: string; label: string } | null;
  sound: boolean;
  coordinates: boolean;
}

const SEV_WORD: Record<Severity, string> = {
  playable: 'a playable move',
  inaccuracy: 'an inaccuracy',
  blunder: 'a mistake',
};

const OPPONENT_DELAY = { learn: 900, drill: 650, recall: 450 } as const;

export default function LineSession(props: Props) {
  const [run, setRun] = useState(0);
  return <Run key={run} {...props} restart={() => setRun((r) => r + 1)} />;
}

function Run({
  mode,
  openingId,
  title,
  line,
  side,
  alternatives,
  closeHref,
  next,
  sound,
  coordinates,
  restart,
}: Props & { restart: () => void }) {
  const plies = line.plies;
  const last = plies.length - 1;
  const mine = plies.map((p, i) => i > 0 && p.turn === side);
  const asked = mine.filter(Boolean).length;
  const opponent = colourName(side === 'w' ? 'b' : 'w');

  const make = useMessages();
  const [ply, setPly] = useState(0);
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    make({ kind: 'intro', title: line.name, html: line.note }),
    make({
      kind: 'info',
      text:
        mode === 'learn'
          ? `You play ${colourName(side)}. Follow the arrows: every move comes with the reason for it.`
          : mode === 'drill'
            ? `You play ${colourName(side)}. Find each move yourself — tap Hint if you get stuck.`
            : `You play ${colourName(side)}. The whole line from memory: no hints, and the notes wait until the end.`,
    }),
  ]);
  const [tone, setTone] = useState<Tone>('idle');
  const [flash, setFlash] = useState<BoardFlash | null>(null);
  const [wrongHere, setWrongHere] = useState(0);
  const [hinted, setHinted] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, hints: 0 });
  const [done, setDone] = useState<null | { passed: boolean | null }>(null);
  const positions = useRef(new Map<string, boolean>());
  const say = (m: Omit<Msg, 'id'>) => setMsgs((list) => [...list, make(m)]);

  const yourTurn = ply < last && mine[ply + 1];
  const expected = plies[ply + 1];

  const finish = useCallback(
    async (final: typeof stats) => {
      setDone({ passed: null });
      setTone('done');
      play('done', sound);
      try {
        const { passed } = await finishSession({
          openingId,
          lineSlug: line.slug,
          mode,
          ...final,
          score: null,
          positions:
            mode === 'learn'
              ? []
              : [...positions.current].map(([key, hit]) => ({ key, hit })),
        });
        setDone({ passed });
      } catch {
        setDone({ passed: false });
        say({ kind: 'oops', text: 'Couldn’t save this run — check your connection and try again.' });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openingId, line.slug, mode, sound],
  );

  // The opponent's moves play themselves; the end of the line ends the session.
  useEffect(() => {
    if (done) return;
    if (ply === last) {
      if (mode === 'recall') {
        setMsgs((list) => [
          ...list,
          make({ kind: 'info', title: 'Why each of your moves is played' }),
          ...plies
            .filter((p, i) => mine[i] && p.note)
            .map((p) => make({ kind: 'yours', title: p.num, html: p.note })),
        ]);
      }
      void finish(stats);
      return;
    }
    if (mine[ply + 1]) return;
    const t = setTimeout(() => {
      const move = plies[ply + 1];
      play(plies[ply].fen[squareIndex(move.to!)] !== '.' ? 'capture' : 'move', sound);
      setFlash(null);
      setTone('idle');
      setPly(ply + 1);
      say({
        kind: 'theirs',
        title: `${opponent} plays ${move.num}`,
        html: mode === 'recall' ? null : move.note,
      });
    }, ply === 0 ? 700 : OPPONENT_DELAY[mode]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ply, done]);

  const onMove = (from: string, to: string) => {
    if (!yourTurn || done) return;
    if (from === expected.from && to === expected.to) {
      const clean = wrongHere === 0 && !hinted;
      positions.current.set(positionKey(plies[ply]), clean);
      const nextStats = { ...stats, correct: stats.correct + 1 };
      setStats(nextStats);
      play(plies[ply].fen[squareIndex(to)] !== '.' ? 'capture' : 'move', sound);
      if (mode !== 'learn') play('good', sound);
      setFlash({ sq: to, kind: 'good' });
      setTone('good');
      say({
        kind: 'yours',
        title: `${expected.num} ✓`,
        html: mode === 'recall' || mode === 'learn' ? null : expected.note,
      });
      setWrongHere(0);
      setHinted(false);
      setPly(ply + 1);
      return;
    }
    play('bad', sound);
    setFlash({ sq: to, kind: 'bad' });
    setTone('bad');
    if (mode === 'learn') {
      say({ kind: 'oops', text: `Follow the arrow: this line plays ${expected.num}.` });
      return;
    }
    if (wrongHere === 0) setStats((s) => ({ ...s, wrong: s.wrong + 1 }));
    setWrongHere((n) => n + 1);
    const alt = alternatives[ply]?.find((a) => a.from === from && a.to === to);
    if (mode === 'recall') {
      say({ kind: 'oops', title: 'Not this time', text: `The move here is ${expected.num}. Play it to carry on.` });
      return;
    }
    if (alt) {
      say({
        kind: 'oops',
        title: `${alt.san} is ${SEV_WORD[alt.sev]}${alt.name ? ` — ${alt.name}` : ''}`,
        html: `${alt.why} <em>The course plays something else here. Try again.</em>`,
      });
    } else {
      say({
        kind: 'oops',
        text: wrongHere >= 1 ? 'Still not it — follow the arrow.' : 'Not the course move. Try again.',
      });
    }
  };

  const hint = () => {
    if (!yourTurn || hinted || mode !== 'drill') return;
    setHinted(true);
    setStats((s) => ({ ...s, hints: s.hints + 1 }));
    say({ kind: 'hint', text: 'Here’s the idea — the arrow shows the move.' });
  };

  const showAnswer =
    yourTurn && (mode === 'learn' || hinted || (mode === 'drill' && wrongHere >= 2) || (mode === 'recall' && wrongHere > 0));
  const arrows: BoardArrow[] =
    showAnswer && expected.from && expected.to
      ? [{ from: expected.from, to: expected.to, kind: mode === 'recall' ? 'bad' : 'hint' }]
      : [];

  // Learn reveals the coming move's reason before it's played: that's the lesson.
  const prompt =
    mode === 'learn' && yourTurn
      ? { title: `Your move: ${expected.num}`, html: expected.note }
      : null;

  usePrimaryKey(done && done.passed !== null ? () => (window.location.href = done.passed && next ? next.href : closeHref) : null);

  const youDone = stats.correct;
  const current = plies[ply];
  const footer = done ? (
    <Summary mode={mode} passed={done.passed} stats={stats} asked={asked} next={next} closeHref={closeHref} restart={restart} />
  ) : (
    <>
      <div className="foot__text">
        <strong>
          {tone === 'good'
            ? pick(['Nice!', 'Correct!', 'Good move!', 'That’s it!'], ply)
            : tone === 'bad'
              ? mode === 'learn'
                ? 'Follow the arrow'
                : 'Not quite'
              : yourTurn
                ? 'Your move'
                : `${opponent} to move…`}
        </strong>
        <span>
          {yourTurn
            ? mode === 'learn'
              ? `Play ${expected.num}`
              : mode === 'drill'
                ? 'What does the course play here?'
                : 'From memory.'
            : `${youDone} of ${asked} moves`}
        </span>
      </div>
      {mode === 'drill' ? (
        <button type="button" className="btn btn--ghost" onClick={hint} disabled={!yourTurn || hinted}>
          Hint
        </button>
      ) : null}
    </>
  );

  return (
    <SessionFrame
      closeHref={closeHref}
      title={title}
      progress={asked ? youDone / asked : 0}
      counter={`${youDone}/${asked}`}
      tone={tone}
      board={
        <Board
          fen={current.fen}
          orientation={side}
          last={current.from ? { from: current.from, to: current.to } : null}
          legal={current.legal}
          movable={yourTurn && !done ? side : null}
          onMove={onMove}
          arrows={arrows}
          flash={flash}
          checkSide={current.check ? (current.turn === 'w' ? 'b' : 'w') : null}
          coordinates={coordinates}
        />
      }
      side={
        <>
          <CoachAvatar />
          <Coach msgs={msgs}>
            {prompt ? (
              <div className="bubble bubble--prompt">
                <div className="bubble__title">{prompt.title}</div>
                {prompt.html ? <p className="bubble__text" dangerouslySetInnerHTML={{ __html: prompt.html }} /> : null}
              </div>
            ) : null}
          </Coach>
          <MoveTape plies={plies} upTo={ply} />
        </>
      }
      footer={footer}
    />
  );
}

function Summary({
  mode,
  passed,
  stats,
  asked,
  next,
  closeHref,
  restart,
}: {
  mode: Props['mode'];
  passed: boolean | null;
  stats: { correct: number; wrong: number; hints: number };
  asked: number;
  next: Props['next'];
  closeHref: string;
  restart: () => void;
}) {
  const clean = stats.wrong === 0 && stats.hints === 0;
  const headline =
    mode === 'learn'
      ? 'Line learned!'
      : mode === 'drill'
        ? clean
          ? 'Flawless drill!'
          : 'Drill complete'
        : clean
          ? 'Perfect recall!'
          : 'Almost — one clean run passes';
  const detail =
    mode === 'learn'
      ? `${asked} moves, every one explained. Next, play them yourself.`
      : `${stats.correct} moves · ${stats.wrong} mistake${stats.wrong === 1 ? '' : 's'}${mode === 'drill' ? ` · ${stats.hints} hint${stats.hints === 1 ? '' : 's'}` : ''}`;
  return (
    <>
      <div className="foot__text">
        <strong>{headline}</strong>
        <span>{passed === null ? 'Saving…' : detail}</span>
      </div>
      <div className="foot__actions">
        {passed === false || (mode !== 'learn' && !clean) ? (
          <button type="button" className="btn btn--ghost" onClick={restart}>
            Again
          </button>
        ) : (
          <Link className="btn btn--ghost" href={closeHref}>
            Course
          </Link>
        )}
        {passed && next ? (
          <Link className="btn btn--primary" href={next.href}>
            {next.label}
          </Link>
        ) : passed === false ? (
          <Link className="btn btn--primary" href={closeHref}>
            Back to course
          </Link>
        ) : (
          <Link className="btn btn--primary" href={closeHref}>
            Done
          </Link>
        )}
      </div>
    </>
  );
}

/** The moves so far, as a scoresheet the learner can glance at. */
function MoveTape({ plies, upTo }: { plies: Line['plies']; upTo: number }) {
  return (
    <ol className="tape" aria-label="Moves so far">
      {plies.slice(1, upTo + 1).map((p, i) => (
        <li key={i} className={i + 1 === upTo ? 'tape__move tape__move--now' : 'tape__move'}>
          {p.turn === 'w' ? <span className="tape__num">{p.num.split('.')[0]}.</span> : null}
          {p.san}
        </li>
      ))}
    </ol>
  );
}

function squareIndex(sq: string) {
  return (8 - Number(sq[1])) * 8 + 'abcdefgh'.indexOf(sq[0]);
}

function pick<T>(items: T[], seed: number) {
  return items[seed % items.length];
}
