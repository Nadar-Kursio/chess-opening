'use client';

import { useEffect, useRef, useState } from 'react';
import { finishSession } from '@/app/actions';
import Board, { type BoardArrow, type BoardFlash } from '@/components/Board';
import { play, type SoundSet } from '@/lib/sound';
import type { Game, Turn } from '@/lib/types';
import { Coach, CoachAvatar, SessionFrame, useMessages, type Msg, type Tone } from './Frame';
import { useFlip } from './useFlip';

/* A model game, two ways. Watch steps through it with the annotations. Guess stops before every
   move by your side and asks what the master played — prediction, not reading, is what makes a
   game's plan stick. Only the master's move counts; nothing is judged beyond that. */

interface Props {
  openingId: string;
  game: Game;
  side: Turn;
  closeHref: string;
  sound: SoundSet;
  coordinates: boolean;
}

export default function GameSession({ openingId, game, side, closeHref, sound, coordinates }: Props) {
  const make = useMessages();
  const plies = game.plies;
  const last = plies.length - 1;
  const [mode, setMode] = useState<'watch' | 'guess'>('guess');
  const [guessSide, setGuessSide] = useState<Turn>(side);
  const { orientation, flip } = useFlip(guessSide);
  const [ply, setPly] = useState(0);
  const [msgs, setMsgs] = useState<Msg[]>(() => [make({ kind: 'intro', title: game.name, html: game.note })]);
  const [tone, setTone] = useState<Tone>('idle');
  const [flash, setFlash] = useState<BoardFlash | null>(null);
  const [tries, setTries] = useState(0);
  const [score, setScore] = useState({ found: 0, asked: 0 });
  const saved = useRef(false);
  const say = (m: Omit<Msg, 'id'>) => setMsgs((list) => [...list, make(m)]);

  const next = plies[ply + 1];
  const asking = mode === 'guess' && !!next && next.turn === guessSide;

  const advance = () => {
    if (!next) return;
    play(plies[ply].fen[sq(next.to!)] !== '.' ? 'capture' : 'move', sound);
    setPly(ply + 1);
    setTries(0);
    setFlash(null);
    setTone('idle');
    // Only annotated moves earn a bubble; the rest would bury the ones that matter.
    if (next.note) say({ kind: next.turn === guessSide ? 'yours' : 'theirs', title: next.num, html: next.note });
  };

  // In Guess, the other side's moves play themselves.
  useEffect(() => {
    if (mode !== 'guess' || !next || next.turn === guessSide) return;
    const t = setTimeout(advance, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ply, mode, guessSide]);

  // The finished game counts the moves found toward the daily goal.
  useEffect(() => {
    if (ply !== last || mode !== 'guess' || saved.current || !score.asked) return;
    saved.current = true;
    play('done', sound);
    setTone('done');
    void finishSession({
      openingId,
      lineSlug: null,
      mode: 'free',
      correct: score.found,
      wrong: score.asked - score.found,
      hints: 0,
      score: null,
      positions: [],
    }).catch(() => {});
  }, [ply, last, mode, score, openingId, sound]);

  const onMove = (from: string, to: string) => {
    if (!asking) return;
    if (from === next.from && to === next.to) {
      if (tries === 0) setScore((s) => ({ found: s.found + 1, asked: s.asked + 1 }));
      play('good', sound);
      setFlash({ sq: to, kind: 'good' });
      setTone('good');
      advance();
      setTone('good');
      return;
    }
    if (tries === 0) setScore((s) => ({ ...s, asked: s.asked + 1 }));
    setTries(tries + 1);
    play('bad', sound);
    setFlash({ sq: to, kind: 'bad' });
    setTone('bad');
    if (tries === 0) say({ kind: 'oops', text: 'Not the master’s move. One more try, then it’s shown.' });
  };

  const arrows: BoardArrow[] = asking && tries >= 2 && next.from && next.to ? [{ from: next.from, to: next.to, kind: 'hint' }] : [];
  const current = plies[ply];

  // Watch mode: arrow keys step through the game.
  useEffect(() => {
    if (mode !== 'watch') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') advance();
      if (e.key === 'ArrowLeft' && ply > 0) setPly(ply - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const restart = (m: 'watch' | 'guess', s: Turn = guessSide) => {
    setMode(m);
    setGuessSide(s);
    setPly(0);
    setTries(0);
    setScore({ found: 0, asked: 0 });
    setTone('idle');
    setFlash(null);
    saved.current = false;
    setMsgs([make({ kind: 'intro', title: game.name, html: game.note })]);
  };

  const finished = ply === last;
  return (
    <SessionFrame
      onFlip={flip}
      closeHref={closeHref}
      title={game.name}
      progress={ply / last}
      counter={mode === 'guess' ? `${score.found}/${score.asked}` : `${Math.ceil(ply / 2)}/${Math.ceil(last / 2)}`}
      tone={tone}
      board={
        <Board
          fen={current.fen}
          orientation={orientation}
          last={current.from ? { from: current.from, to: current.to } : null}
          legal={asking ? plies[ply].legal : undefined}
          movable={asking ? guessSide : null}
          onMove={onMove}
          arrows={arrows}
          flash={flash}
          checkSide={current.check ? (current.turn === 'w' ? 'b' : 'w') : null}
          coordinates={coordinates}
        />
      }
      side={
        <>
          <div className="segmented" role="group" aria-label="How to play through the game">
            <button type="button" className={mode === 'guess' ? 'segmented__on' : ''} onClick={() => restart('guess')}>
              Guess the moves
            </button>
            <button type="button" className={mode === 'watch' ? 'segmented__on' : ''} onClick={() => restart('watch')}>
              Watch
            </button>
          </div>
          {mode === 'guess' ? (
            <div className="segmented segmented--small" role="group" aria-label="Which side to guess">
              {(['w', 'b'] as Turn[]).map((t) => (
                <button key={t} type="button" className={guessSide === t ? 'segmented__on' : ''} onClick={() => restart('guess', t)}>
                  Guess {t === 'w' ? 'White' : 'Black'}
                </button>
              ))}
            </div>
          ) : null}
          <CoachAvatar />
          <Coach msgs={msgs} />
        </>
      }
      footer={
        <>
          <div className="foot__text">
            <strong>
              {finished
                ? mode === 'guess'
                  ? `Found ${score.found} of ${score.asked}`
                  : 'End of the game'
                : asking
                  ? tone === 'bad'
                    ? 'Not quite'
                    : 'What did the master play?'
                  : mode === 'watch'
                    ? next?.num ?? ''
                    : 'Watching…'}
            </strong>
            <span>{mode === 'watch' ? 'Use ← → or the buttons.' : asking ? `Move ${next.num.split('.')[0]}` : ' '}</span>
          </div>
          <div className="foot__actions">
            {mode === 'watch' ? (
              <>
                <button type="button" className="btn btn--ghost" onClick={() => setPly(Math.max(0, ply - 1))} disabled={ply === 0}>
                  Back
                </button>
                <button type="button" className="btn btn--primary" onClick={advance} disabled={finished}>
                  Next
                </button>
              </>
            ) : finished ? (
              <button type="button" className="btn btn--primary" onClick={() => restart('guess')}>
                Again
              </button>
            ) : tries >= 2 ? (
              <button type="button" className="btn btn--ghost" onClick={advance}>
                Show and continue
              </button>
            ) : null}
          </div>
        </>
      }
    />
  );
}

function sq(s: string) {
  return (8 - Number(s[1])) * 8 + 'abcdefgh'.indexOf(s[0]);
}
