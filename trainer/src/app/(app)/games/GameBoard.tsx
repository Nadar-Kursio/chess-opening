'use client';

import type { BoardArrow } from '@/components/Board';
import { MoveTape, SessionBoard, useMoveReview, type BoardStep } from '@/components/session/SessionBoard';
import type { Turn } from '@/lib/types';

/* An imported game up to the position its prep report turns on, with the moves drawn on it, and
   the moves that led there as a tape to step back through. */

const noMove = () => {};

export default function GameBoard({
  plies,
  orientation,
  arrows,
  engine,
  coordinates,
}: {
  plies: BoardStep[];
  orientation: Turn;
  arrows: BoardArrow[];
  engine: boolean;
  coordinates: boolean;
}) {
  const review = useMoveReview(plies);
  return (
    <>
      <SessionBoard
        review={review}
        orientation={orientation}
        movable={null}
        onMove={noMove}
        arrows={arrows}
        coordinates={coordinates}
        engine={engine ? {} : null}
      />
      <MoveTape review={review} marks={engine} />
    </>
  );
}
