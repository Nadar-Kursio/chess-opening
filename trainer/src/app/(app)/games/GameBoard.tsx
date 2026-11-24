'use client';

import type { BoardArrow } from '@/components/Board';
import { SessionBoard, useMoveReview, type BoardStep } from '@/components/session/SessionBoard';
import type { Turn } from '@/lib/types';

/* An imported game, as far as it followed the course: it opens on the position where it left,
   with the course's move and the move played drawn on it, and steps back through the book moves. */

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
    <SessionBoard
      review={review}
      orientation={orientation}
      movable={null}
      onMove={noMove}
      arrows={arrows}
      coordinates={coordinates}
      engine={engine ? {} : null}
    />
  );
}
