'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { finishSession } from '@/app/actions';
import Board, { type BoardArrow, type BoardFlash } from '@/components/Board';
import { colourName, otherTurn, type Tree, type TreeEdge } from '@/lib/course';
import { play, type SoundSet } from '@/lib/sound';
import { useFlip } from './useFlip';
import { Coach, CoachAvatar, SessionFrame, useMessages, usePrimaryKey, type Msg, type Tone } from './Frame';

/* Free practice: the opponent picks any reply the course knows — main lines more often, the
   authored deviations sometimes — and the learner answers from the whole repertoire. Nothing is
   gated on it; each finished game is logged so the daily goal and "review mistakes" see it. */

interface Props {
  openingId: string;
  title: string;
  tree: Tree;
  closeHref: string;
  sound: SoundSet;
  coordinates: boolean;
}

function choose(moves: TreeEdge[]) {
  const total = moves.reduce((n, e) => n + e.w, 0);
  let r = Math.random() * total;
  for (const e of moves) {
    r -= e.w;
    if (r <= 0) return e;
  }
  return moves[moves.length - 1];
}

const SEV_WORD = { playable: 'A sideline', inaccuracy: 'An inaccuracy', blunder: 'A blunder' } as const;

export default function FreeSession({ openingId, title, tree, closeHref, sound, coordinates }: Props) {
  const make = useMessages();
  const you = tree.side;
  const { orientation, flip } = useFlip(you);
  const [key, setKey] = useState(tree.root);
  const [games, setGames] = useState(0);
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    make({
      kind: 'intro',
      title: 'Free practice',
      text: `You play ${colourName(you)}. Your opponent can choose any move this course covers — including the sidelines. Answer from your repertoire. Nothing is scored.`,
    }),
  ]);
  const [tone, setTone] = useState<Tone>('idle');
  const [flash, setFlash] = useState<BoardFlash | null>(null);
  const [wrongHere, setWrongHere] = useState(0);
  const [over, setOver] = useState(false);
  const [tally, setTally] = useState({ correct: 0, wrong: 0, hints: 0 });
  const positions = useRef(new Map<string, boolean>());

  const node = tree.nodes[key];
  const yourTurn = node.toMove === you && node.moves.length > 0;
  const say = (m: Omit<Msg, 'id'>) => setMsgs((list) => [...list, make(m)]);

  const save = (t: typeof tally) => {
    if (t.correct + t.wrong === 0) return;
    void finishSession({
      openingId,
      lineSlug: null,
      mode: 'free',
      ...t,
      score: null,
      positions: [...positions.current].map(([k, hit]) => ({ key: k, hit })),
    }).catch(() => {});
    positions.current = new Map();
  };

  // The opponent's turn plays itself; a position the course goes no further from ends the game.
  useEffect(() => {
    if (over) return;
    if (!node.moves.length) {
      setOver(true);
      setTone('done');
      play('done', sound);
      say({
        kind: 'done',
        title: 'End of the course’s theory here',
        text: 'You’ve played as far as the course goes in this line. Start a new game to get a different one.',
      });
      save(tally);
      return;
    }
    if (node.toMove === you) return;
    const t = setTimeout(() => {
      const e = choose(node.moves);
      play(node.fen[sqIndex(e.to)] !== '.' ? 'capture' : 'move', sound);
      setFlash(null);
      setTone('idle');
      setKey(e.next);
      say({
        kind: 'theirs',
        title: `${colourName(otherTurn(you))} plays ${e.num}`,
        html: e.sev
          ? `<b>${SEV_WORD[e.sev]}${e.name ? ` — ${e.name}` : ''}.</b> ${e.why ?? ''}`
          : tree.nodes[e.next].note,
      });
    }, key === tree.root ? 700 : 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, over]);

  const onMove = (from: string, to: string) => {
    if (!yourTurn || over) return;
    const hit = node.moves.find((e) => e.from === from && e.to === to);
    if (hit) {
      positions.current.set(key, wrongHere === 0);
      setTally((t) => ({ ...t, correct: t.correct + 1 }));
      play(node.fen[sqIndex(to)] !== '.' ? 'capture' : 'move', sound);
      setFlash({ sq: to, kind: 'good' });
      setTone('good');
      say({ kind: 'yours', title: `${hit.num} ✓`, html: tree.nodes[hit.next].note });
      setWrongHere(0);
      setKey(hit.next);
      return;
    }
    play('bad', sound);
    setFlash({ sq: to, kind: 'bad' });
    setTone('bad');
    if (wrongHere === 0) setTally((t) => ({ ...t, wrong: t.wrong + 1 }));
    setWrongHere((n) => n + 1);
    say({ kind: 'oops', text: wrongHere >= 1 ? 'The arrow shows your repertoire move.' : 'Not your repertoire move here. Try again.' });
  };

  const newGame = () => {
    if (!over) save(tally);
    setTally({ correct: 0, wrong: 0, hints: 0 });
    setGames((g) => g + 1);
    setOver(false);
    setWrongHere(0);
    setTone('idle');
    setFlash(null);
    setMsgs([make({ kind: 'intro', title: `Game ${games + 2}`, text: 'New game — a different line this time, maybe.' })]);
    setKey(tree.root);
  };

  usePrimaryKey(over ? newGame : null);

  const best = node.moves.reduce<TreeEdge | null>((b, e) => (!b || e.w > b.w ? e : b), null);
  const arrows: BoardArrow[] =
    yourTurn && wrongHere >= 2 && best ? [{ from: best.from, to: best.to, kind: 'hint' }] : [];

  return (
    <SessionFrame
      onFlip={flip}
      closeHref={closeHref}
      title={title}
      progress={over ? 1 : Math.min(0.95, tally.correct / 12)}
      counter={`${tally.correct} ✓`}
      tone={tone}
      board={
        <Board
          fen={node.fen}
          orientation={orientation}
          last={node.from ? { from: node.from, to: node.to } : null}
          legal={node.legal}
          movable={yourTurn && !over ? you : null}
          onMove={onMove}
          arrows={arrows}
          flash={flash}
          checkSide={node.check ? node.toMove : null}
          coordinates={coordinates}
        />
      }
      side={
        <>
          <CoachAvatar />
          <Coach msgs={msgs} />
        </>
      }
      footer={
        <>
          <div className="foot__text">
            <strong>
              {over ? 'Game over' : tone === 'good' ? 'Good' : tone === 'bad' ? 'Not quite' : yourTurn ? 'Your move' : 'Opponent to move…'}
            </strong>
            <span>
              {tally.correct} right · {tally.wrong} wrong this game
            </span>
          </div>
          <div className="foot__actions">
            <Link className="btn btn--ghost" href={closeHref} onClick={() => !over && save(tally)}>
              Finish
            </Link>
            <button type="button" className={over ? 'btn btn--primary' : 'btn btn--ghost'} onClick={newGame}>
              New game
            </button>
          </div>
        </>
      }
    />
  );
}

function sqIndex(sq: string) {
  return (8 - Number(sq[1])) * 8 + 'abcdefgh'.indexOf(sq[0]);
}
