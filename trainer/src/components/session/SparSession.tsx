'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { BoardArrow, BoardFlash } from '@/components/Board';
import { colourName, otherTurn, type TreeEdge } from '@/lib/course';
import { verdictOf, verdictWords } from '@/lib/engineView';
import { saveGrade, saveSession } from '@/lib/outbox';
import { play, type SoundSet } from '@/lib/sound';
import { LIVES, leaving, pickOpponent, pickReply, shareOf, type Leave, type Opponent, type SparBook } from '@/lib/spar';
import type { Colour } from '@/lib/types';
import { Coach, SessionFrame, useMessages, usePrimaryKey, type Msg, type Tone } from './Frame';
import { squareIndex } from './LineSession';
import { SessionBoard, useMoveReview, type BoardStep } from './SessionBoard';
import { useFlip } from './useFlip';
import { Face, Hearts } from './SparParts';

/* Sparring: the course against a club opponent. The opponent draws each move from what club
   players really play there, so the learner meets the common lines most and finds out where their
   prep runs out. A wrong move costs a life; the game ends when the course does, when the opponent
   plays something it has no answer to, or when the lives run out. Every first answer is graded
   into Recall, and the game is saved as a session so it counts toward the day. */

interface Props {
  openingId: string;
  course: string;
  side: Colour;
  book: SparBook;
  opponent: Opponent;
  best: number;
  closeHref: string;
  sound: SoundSet;
  coordinates: boolean;
  engineView?: boolean;
  /** Traps this course can set from the learner's chair, by the position their bait reaches. */
  traps?: { id: string; name: string; taken: string; num: string }[];
}

interface Played {
  num: string;
  share: number | null;
  forced?: boolean;
}

type Outcome =
  | { kind: 'book' }
  | { kind: 'left'; leave: Leave; share: number | null }
  | { kind: 'lives'; at: string; answer: TreeEdge };

const SEV_WORD = { playable: 'A sideline the course knows', inaccuracy: 'An inaccuracy', blunder: 'A blunder' } as const;
const THINK_MS = [550, 1200];

export default function SparSession({ openingId, course, side, book, opponent: first, best: startBest, closeHref, sound, coordinates, engineView = false, traps = [] }: Props) {
  const { tree, choices } = book;
  const make = useMessages();
  const you = tree.side;
  const { orientation, flip } = useFlip(you);
  const [opponent, setOpponent] = useState(first);
  const [path, setPath] = useState([{ key: tree.root, san: '' }]);
  const [left, setLeft] = useState<Leave | null>(null);
  const [lives, setLives] = useState(LIVES);
  const [depth, setDepth] = useState(0);
  const [played, setPlayed] = useState<Played[]>([]);
  const [wrongHere, setWrongHere] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [tone, setTone] = useState<Tone>('idle');
  const [flash, setFlash] = useState<BoardFlash | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [best, setBest] = useState(startBest);
  const [isNewBest, setIsNewBest] = useState(false);
  const [tally, setTally] = useState({ correct: 0, wrong: 0, hints: 0 });
  const [msgs, setMsgs] = useState<Msg[]>(() => [make(intro(first, course, you, book.elo))]);
  const asked = useRef({ key: '', at: 0, graded: false });
  // Every position the game reached, the leaving move's included: the server looks for traps in it.
  const trail = useRef([tree.root]);

  const key = path[path.length - 1].key;
  const node = tree.nodes[key];
  const over = !!outcome;
  const yourTurn = !over && node.toMove === you && node.moves.length > 0;
  const say = (m: Omit<Msg, 'id'>) => setMsgs((list) => [...list, make(m)]);

  const steps: BoardStep[] = path.map((step) => ({ ...tree.nodes[step.key], san: step.san, turn: otherTurn(tree.nodes[step.key].toMove) }));
  if (left) {
    steps.push({ fen: left.fen, from: left.from, to: left.to, san: left.san, num: left.num, turn: otherTurn(you), check: left.check });
  }
  const review = useMoveReview(steps);

  const finish = (end: Outcome, t: typeof tally, reached: number) => {
    setOutcome(end);
    setTone(end.kind === 'lives' ? 'bad' : 'done');
    play(end.kind === 'lives' ? 'bad' : 'done', sound);
    if (reached > best) {
      setBest(reached);
      setIsNewBest(true);
    }
    store(t, reached);
  };

  const store = (t: typeof tally, reached: number) => {
    if (t.correct + t.wrong === 0) return;
    saveSession({ openingId, lineSlug: null, mode: 'spar', ...t, score: null, positions: [], spar: { side, depth: reached, keys: trail.current } });
  };

  // A game left half way still counts the moves found in it, whether by the close button or the tab.
  const unfinished = useRef<(() => void) | null>(null);
  useEffect(() => {
    unfinished.current = over ? null : () => store(tally, depth);
  });
  useEffect(() => {
    const bail = () => {
      unfinished.current?.();
      unfinished.current = null;
    };
    window.addEventListener('pagehide', bail);
    return () => {
      window.removeEventListener('pagehide', bail);
      bail();
    };
  }, []);

  // The opponent's turn plays itself, after a moment to think.
  useEffect(() => {
    if (over || node.toMove === you) return;
    const choice = choices[key];
    if (!choice || (!choice.replies.length && !choice.out.length)) {
      finish({ kind: 'book' }, tally, depth);
      return;
    }
    const wait = THINK_MS[0] + Math.random() * (THINK_MS[1] - THINK_MS[0]);
    const t = setTimeout(() => {
      const drawn = pickReply(choice, Math.random);
      const move = drawn.kind === 'on' ? drawn.reply : leaving(tree, key, drawn.move);
      const share = choice.forced || choice.thin ? null : shareOf(move, choice);
      play(node.fen[squareIndex(move.to)] !== '.' ? 'capture' : 'move', sound);
      setFlash(null);
      setTone('idle');
      setPlayed((list) => [...list, { num: move.num, share, forced: choice.forced }]);
      const sprung = traps.find((t) => t.taken === ('fen' in move ? move.fen + you : move.next));
      const bait = () => {
        if (sprung) say({ kind: 'info', title: 'They took the bait', text: `${move.num} walks into ${sprung.name}. It goes into your trap collection.` });
      };
      if ('fen' in move) {
        trail.current = [...trail.current, move.fen + you];
        setLeft(move);
        say({
          kind: 'theirs',
          title: `${opponent.name} plays ${move.num}`,
          text: `${share !== null ? `${share}% of club players choose it here. ` : ''}${move.known ? 'The course mentions it but has no answer yet.' : 'Your course has nothing for it yet.'}`,
        });
        bait();
        finish({ kind: 'left', leave: move, share }, tally, depth);
        return;
      }
      trail.current = [...trail.current, move.next];
      setPath((list) => [...list, { key: move.next, san: move.san }]);
      const intoSideline = book.lines[book.study[move.next]]?.sideline && !book.lines[book.study[key]]?.sideline;
      say({
        kind: 'theirs',
        title: `${opponent.name} plays ${move.num}`,
        html: move.sev ? `<b>${SEV_WORD[move.sev]}${move.name ? ` (${move.name})` : ''}.</b>` : undefined,
        text: `${
          choice.forced
            ? 'The opening you came to play.'
            : choice.thin
              ? `Few club games get this far, so ${opponent.name} sticks to the course.`
              : share !== null && share < 5
                ? `A rare one: ${share}% of club games.`
                : `${share}% of club players choose it here.`
        }${intoSideline ? ' Your course covers it as a sideline.' : ''}`,
      });
      bait();
    }, wait);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, over, opponent]);

  useEffect(() => {
    if (yourTurn && asked.current.key !== key) asked.current = { key, at: performance.now(), graded: false };
  }, [yourTurn, key]);

  /** The first try at a position is the one Recall hears about. */
  const grade = (hit: boolean) => {
    if (asked.current.key !== key || asked.current.graded) return;
    asked.current.graded = true;
    saveGrade({ openingId, key, hit, ms: Math.round(performance.now() - asked.current.at) });
  };

  const expected = node.moves.reduce<TreeEdge | null>((b, e) => (!b || e.w > b.w ? e : b), null);

  const onMove = (from: string, to: string) => {
    if (!yourTurn || !expected) return;
    const hit = node.moves.find((e) => e.from === from && e.to === to);
    if (hit) {
      grade(wrongHere === 0 && hintLevel === 0);
      const t = { ...tally, correct: tally.correct + 1 };
      const reached = depth + 1;
      setTally(t);
      setDepth(reached);
      play(node.fen[squareIndex(to)] !== '.' ? 'capture' : 'move', sound);
      play('good', sound);
      setFlash({ sq: to, kind: 'good' });
      setTone('good');
      setWrongHere(0);
      setHintLevel(0);
      trail.current = [...trail.current, hit.next];
      setPath((list) => [...list, { key: hit.next, san: hit.san }]);
      say({ kind: 'yours', title: `${hit.num} ✓`, html: tree.nodes[hit.next].note });
      if (!tree.nodes[hit.next].moves.length) finish({ kind: 'book' }, t, reached);
      return;
    }

    grade(false);
    const verdict = verdictOf(node, from, to);
    const words = verdict && verdictWords(verdict, node, expected.num);
    const fine = verdict?.sev === 'good';
    const lost = fine ? 0 : 1;
    const remaining = lives - lost;
    const t = wrongHere === 0 ? { ...tally, wrong: tally.wrong + 1 } : tally;
    setTally(t);
    setLives(remaining);
    setWrongHere((n) => n + 1);
    play('bad', sound);
    setFlash({ sq: to, kind: fine ? 'hint' : 'bad', verdict });
    if (remaining === 0) {
      say({ kind: 'oops', title: words?.title ?? 'Out of lives', text: `${words ? `${words.text} ` : ''}The course plays ${expected.num} here.` });
      finish({ kind: 'lives', at: key, answer: expected }, t, depth);
      return;
    }
    setTone(fine ? 'info' : 'bad');
    say({
      kind: fine ? 'info' : 'oops',
      title: words?.title ?? 'Not the course’s move',
      text: `${words ? `${words.text} ` : ''}${fine ? 'No life lost. ' : `${remaining} ${remaining === 1 ? 'life' : 'lives'} left. `}Try again, or take a hint.`,
    });
  };

  const hint = () => {
    if (!yourTurn || !expected || hintLevel >= 2) return;
    if (hintLevel === 0) {
      setTally((t) => ({ ...t, hints: t.hints + 1 }));
      setFlash({ sq: expected.from, kind: 'hint' });
      say({ kind: 'hint', text: 'This piece moves. Where to?' });
    } else {
      say({ kind: 'hint', text: 'The arrow shows the course’s move.' });
    }
    setHintLevel(hintLevel + 1);
  };

  const again = () => {
    const next = pickOpponent(Math.random, opponent.id);
    setOpponent(next);
    setPath([{ key: tree.root, san: '' }]);
    trail.current = [tree.root];
    setLeft(null);
    setLives(LIVES);
    setDepth(0);
    setPlayed([]);
    setWrongHere(0);
    setHintLevel(0);
    setTone('idle');
    setFlash(null);
    setOutcome(null);
    setIsNewBest(false);
    setTally({ correct: 0, wrong: 0, hints: 0 });
    asked.current = { key: '', at: 0, graded: false };
    setMsgs([make(intro(next, course, you, book.elo))]);
  };

  usePrimaryKey(over ? again : null);

  const answerArrow = outcome?.kind === 'lives' ? outcome.answer : yourTurn && hintLevel >= 2 ? expected : null;
  const arrows: BoardArrow[] = answerArrow ? [{ from: answerArrow.from, to: answerArrow.to, kind: 'hint' }] : [];
  const canHint = yourTurn && wrongHere > 0 && hintLevel < 2;

  return (
    <SessionFrame
      onFlip={flip}
      closeHref={closeHref}
      title={`Sparring · ${course}`}
      progress={over ? 1 : Math.min(0.95, depth / book.longest)}
      counter={`${depth} in book`}
      tone={tone}
      board={
        <SessionBoard
          review={review}
          orientation={orientation}
          movable={yourTurn ? you : null}
          onMove={onMove}
          arrows={arrows}
          flash={flash}
          coordinates={coordinates}
          engine={engineView ? (over ? { upTo: path.length - 1 } : { upTo: path.findLastIndex((step) => tree.nodes[step.key].toMove !== you && step.san !== '') }) : null}
        />
      }
      side={
        <>
          <div className="spar-rival">
            <Face id={opponent.id} />
            <div className="spar-rival__who">
              <b>{opponent.name}</b>
              <span>
                Club · {book.elo[0]}–{book.elo[1]}
              </span>
            </div>
            <span className={`spar-rival__state${!over && !yourTurn ? ' spar-rival__state--thinking' : ''}`} role="status">
              {over ? '' : yourTurn ? 'Your move' : 'Thinking'}
            </span>
            <Hearts lives={lives} />
          </div>
          {outcome ? (
            <Recap
              outcome={outcome}
              opponent={opponent}
              book={book}
              openingId={openingId}
              depth={depth}
              best={best}
              isNewBest={isNewBest}
              lives={lives}
              played={played}
              lastKey={key}
            />
          ) : (
            <Coach msgs={msgs} />
          )}
        </>
      }
      footer={
        over ? (
          <>
            <div className="foot__text">
              <strong>{outcome.kind === 'book' ? 'Book complete' : outcome.kind === 'left' ? 'Out of your prep' : 'Out of lives'}</strong>
              <span>
                {depth} {depth === 1 ? 'move' : 'moves'} in book{isNewBest ? ' · new personal best' : best ? ` · best ${best}` : ''}
              </span>
            </div>
            <div className="foot__actions">
              <Link className="btn btn--ghost" href={closeHref}>
                Courses
              </Link>
              <button type="button" className="btn btn--primary" onClick={again}>
                Play again
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="foot__text">
              <strong>
                {tone === 'good' ? 'In book' : tone === 'bad' ? 'Not quite' : yourTurn ? 'Your move' : `${opponent.name} is thinking`}
              </strong>
              <span>
                {depth} in book · {lives} {lives === 1 ? 'life' : 'lives'} left
              </span>
            </div>
            {canHint ? (
              <div className="foot__actions">
                <button type="button" className="btn btn--ghost" onClick={hint}>
                  {hintLevel === 1 ? 'Show move' : 'Hint'}
                </button>
              </div>
            ) : null}
          </>
        )
      }
    />
  );
}

function intro(o: Opponent, course: string, you: 'w' | 'b', elo: [number, number]): Omit<Msg, 'id'> {
  return {
    kind: 'intro',
    title: `${o.name} wants a game`,
    text: `${o.blurb} You play ${colourName(you)} in the ${course}. ${o.name} picks moves the way Lichess players rated ${elo[0]} to ${elo[1]} do. Three lives: stay in book as long as you can.`,
  };
}

/** How the game went, and where to go from here. */
function Recap({
  outcome,
  opponent,
  book,
  openingId,
  depth,
  best,
  isNewBest,
  lives,
  played,
  lastKey,
}: {
  outcome: Outcome;
  opponent: Opponent;
  book: SparBook;
  openingId: string;
  depth: number;
  best: number;
  isNewBest: boolean;
  lives: number;
  played: Played[];
  lastKey: string;
}) {
  const at = outcome.kind === 'lives' ? outcome.at : lastKey;
  const line = book.lines[book.study[at]];
  const counted = played.filter((p) => p.share !== null);
  const path = counted.reduce((p, m) => (p * m.share!) / 100, 1);

  const head =
    outcome.kind === 'book'
      ? { title: 'Book complete!', text: `You played every move the course has here, and ${opponent.name} never got you out of it.` }
      : outcome.kind === 'left'
        ? {
            title: `${opponent.name} left your prep`,
            text: `${outcome.leave.num}${outcome.share !== null ? ` comes up in ${outcome.share}% of club games here` : ' is rare at club level'}. ${
              outcome.leave.known ? 'The course names it but has no answer yet.' : 'Nothing in the course for this yet.'
            }`,
          }
        : { title: 'Out of lives', text: `The course plays ${outcome.answer.num} here. The arrow shows it.` };

  const study = line
    ? outcome.kind === 'lives'
      ? { href: `/openings/${openingId}/${line.slug}/drill`, label: `Drill ${line.name}`, why: 'The chapter with the move you missed.' }
      : line.sideline
        ? { href: `/openings/${openingId}/${line.slug}/learn`, label: `Learn ${line.name}`, why: 'You ended in a sideline. Its lesson shows the ideas.' }
        : outcome.kind === 'book'
          ? { href: `/openings/${openingId}/${line.slug}/recall`, label: `Test ${line.name}`, why: 'You know it over the board. Now from memory, start to finish.' }
          : { href: `/openings/${openingId}/${line.slug}/drill`, label: `Drill ${line.name}`, why: 'The chapter this game followed until it left.' }
    : null;

  return (
    <section className={`spar-recap spar-recap--${outcome.kind}`} aria-label="How the game went">
      <div className="spar-recap__head">
        <h2>{head.title}</h2>
        <p>{head.text}</p>
      </div>
      <div className="recap__tiles">
        <div className="recap__tile recap__tile--green">
          <b>{depth}</b>
          <span>moves in book</span>
        </div>
        <div className={`recap__tile recap__tile--gold${isNewBest ? ' spar-recap__best' : ''}`}>
          <b>{best}</b>
          <span>{isNewBest ? 'new best!' : 'personal best'}</span>
        </div>
        <div className="recap__tile recap__tile--purple">
          <b>{lives}</b>
          <span>{lives === 1 ? 'life left' : 'lives left'}</span>
        </div>
      </div>
      {study ? (
        <Link className="spar-next" href={study.href}>
          <span className="eyebrow">Study next</span>
          <b>{study.label}</b>
          <span className="muted small">{study.why}</span>
        </Link>
      ) : null}
      {counted.length ? (
        <div className="spar-recap__path">
          <h3>What {opponent.name} played</h3>
          <ol className="spar-moves">
            {played.map((p, i) => (
              <li key={i} className={p.share === null ? 'spar-move spar-move--plain' : p.share < 10 ? 'spar-move spar-move--rare' : 'spar-move'}>
                <b>{p.num}</b>
                {p.share !== null ? <span>{p.share}%</span> : null}
              </li>
            ))}
          </ol>
          <p className="muted small">
            {path < 0.1 ? `About 1 in ${Math.round(1 / path).toLocaleString('en-GB')}` : `${Math.round(path * 100)}%`} of club games
            follow every one of those choices.
          </p>
        </div>
      ) : null}
    </section>
  );
}
