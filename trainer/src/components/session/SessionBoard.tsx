'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Board, { type BoardArrow, type BoardBadge, type BoardFlash } from '@/components/Board';
import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { otherTurn } from '@/lib/course';
import { MARK_GLYPH, evalShare, evalText } from '@/lib/engineView';
import type { Ply, Turn } from '@/lib/types';

/* Looking back over the moves played, the same in every session: ← → or the buttons under the
   board, or a click on a move in the tape. A session hands over only the positions already
   reached, so stepping forward can never show the move it is about to ask for. Scoring and saving
   don't know any of this happened: they follow the live position, and any change to it brings the
   board back there. */

export type BoardStep = Pick<Ply, 'fen' | 'from' | 'to' | 'check' | 'turn' | 'legal' | 'san' | 'num' | 'ev' | 'mate' | 'mark'>;

/** How much of the engine's opinion this moment of a session may show. `upTo` holds the bar at a
    position so it can't hint at a move still being asked for; `hidden` is for answering from memory. */
export interface EvalShown {
  hidden?: boolean;
  upTo?: number;
}

export type MoveReview = ReturnType<typeof useMoveReview>;

/** `onPastLive` is what → does from the live position: a game being watched plays its next move. */
export function useMoveReview(history: BoardStep[], onPastLive?: () => void) {
  const [back, setBack] = useState(0);
  const head = history.length - 1;
  const liveKey = `${head}|${history[head]?.fen}`;
  const [prevLiveKey, setPrevLiveKey] = useState(liveKey);
  if (prevLiveKey !== liveKey) {
    setPrevLiveKey(liveKey);
    setBack(0);
  }

  const toLive = useCallback(() => setBack(0), []);
  const at = Math.max(0, head - back);
  const canGoBack = at > 0;
  const canGoForward = at < head || !!onPastLive;
  const goBack = () => {
    if (canGoBack) setBack(head - at + 1);
  };
  const goForward = () => {
    if (at < head) setBack(head - at - 1);
    else onPastLive?.();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      e.preventDefault();
      if (e.key === 'ArrowLeft') goBack();
      else goForward();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return {
    history,
    at,
    isReviewing: at < head,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    goTo: (index: number) => setBack(head - index),
    toLive,
  };
}

export function SessionBoard({
  review,
  orientation,
  movable,
  onMove,
  arrows = [],
  flash,
  coordinates,
  engine,
}: {
  review: MoveReview;
  orientation: Turn;
  movable: Turn | null;
  onMove: (from: string, to: string) => void;
  arrows?: BoardArrow[];
  flash?: BoardFlash | null;
  coordinates: boolean;
  /** The eval bar and marks, for a course that has them. */
  engine?: EvalShown | null;
}) {
  const { toLive } = review;
  const shown = review.history[review.at];
  const verdict = review.isReviewing ? null : flash?.verdict;
  const help = JSON.stringify([arrows, flash]);

  // A hint or an arrow appearing is about the live position, so that's where the learner needs to be.
  useEffect(() => {
    if (arrows.length || flash) toLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [help, toLive]);

  const scored = verdict ?? (engine?.upTo !== undefined ? review.history[Math.min(review.at, engine.upTo)] : shown);
  const hasScore = !!engine && (!!verdict || !engine.hidden) && scored?.ev !== undefined;
  const tried: BoardArrow[] = verdict ? [{ from: verdict.from, to: verdict.to, kind: verdict.sev === 'good' ? 'good' : 'bad' }] : [];
  const badge: BoardBadge | null = !engine
    ? null
    : verdict
      ? verdict.sev === 'good'
        ? null
        : { sq: verdict.to, glyph: verdict.glyph, mark: verdict.sev }
      : shown.mark && shown.to && !engine.hidden
        ? { sq: shown.to, glyph: MARK_GLYPH[shown.mark], mark: shown.mark }
        : null;

  return (
    <div className={review.isReviewing ? 'review-board review-board--back' : 'review-board'}>
      <div className="review-board__row">
        {engine ? <EvalBar score={hasScore ? scored! : null} orientation={orientation} /> : null}
        <div className="review-board__board">
          <Board
            fen={shown.fen}
            orientation={orientation}
            last={shown.from ? { from: shown.from, to: shown.to } : null}
            legal={shown.legal}
            movable={review.isReviewing ? null : movable}
            onMove={onMove}
            arrows={review.isReviewing ? [] : [...arrows, ...tried]}
            flash={review.isReviewing ? null : flash}
            badge={badge}
            checkSide={shown.check ? otherTurn(shown.turn) : null}
            coordinates={coordinates}
          />
        </div>
      </div>
      <div className="review-bar">
        <button
          type="button"
          className="icon-btn"
          onClick={review.goBack}
          disabled={!review.canGoBack}
          aria-label="Previous move"
          title="Previous move (←)"
        >
          <ChevronLeft />
        </button>
        <span className="review-bar__label" role="status">
          {review.isReviewing ? `Looking back: ${review.at > 0 ? shown.num : 'the start'}` : ''}
        </span>
        <MoveTape review={review} strip marks={!!engine} />
        {engine && hasScore ? <b className="review-bar__score">{evalText(scored!)}</b> : null}
        <button
          type="button"
          className="icon-btn"
          onClick={review.goForward}
          disabled={!review.canGoForward}
          aria-label="Next move"
          title="Next move (→)"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}

/** White's share of the position, drawn from the side of the board White sits on. */
function EvalBar({ score, orientation }: { score: Pick<Ply, 'ev' | 'mate'> | null; orientation: Turn }) {
  const share = score ? evalShare(score) : 50;
  return (
    <div
      className={`eval-bar eval-bar--${orientation}${score ? '' : ' eval-bar--hidden'}`}
      role="img"
      aria-label={score ? `Engine score ${evalText(score)}` : 'Engine score hidden until you answer'}
    >
      <span className="eval-bar__white" style={{ height: `${share}%` }} />
    </div>
  );
}

/** The moves so far, as a scoresheet the learner can read and jump around in. */
export function MoveTape({ review, strip = false, marks = false }: { review: MoveReview; strip?: boolean; marks?: boolean }) {
  const listRef = useRef<HTMLOListElement>(null);
  const { history, at } = review;

  useEffect(() => {
    const list = listRef.current;
    const now = list?.querySelector<HTMLElement>('.tape__move--now');
    if (list && now) {
      list.scrollTo({
        left: now.offsetLeft - (list.clientWidth - now.offsetWidth) / 2,
        top: now.offsetTop - (list.clientHeight - now.offsetHeight) / 2,
      });
    }
  }, [at, history.length]);

  return (
    <ol ref={listRef} className={strip ? 'tape tape--strip' : 'tape'} aria-label="Moves so far">
      {history.slice(1).map((step, i) => (
        <li key={i} className={i + 1 === at ? 'tape__move tape__move--now' : 'tape__move'}>
          <button type="button" className="tape__jump" onClick={() => review.goTo(i + 1)} aria-current={i + 1 === at ? 'step' : undefined}>
            {step.turn === 'w' ? <span className="tape__num">{step.num.split('.')[0]}.</span> : null}
            {step.san}
            {marks && step.mark ? <i className={`tape__mark tape__mark--${step.mark}`}>{MARK_GLYPH[step.mark]}</i> : null}
          </button>
        </li>
      ))}
    </ol>
  );
}
