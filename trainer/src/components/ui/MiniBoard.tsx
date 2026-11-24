'use client';

import { useRef } from 'react';
import { pieceCode, pieceUrl } from '@/lib/pieces';
import { usePieceRaster } from '../usePieceRaster';

/* A static board picture for cards and headers: no interaction. */

const FILES = 'abcdefgh';

export default function MiniBoard({
  fen,
  flipped = false,
  last,
}: {
  fen: string;
  flipped?: boolean;
  last?: { from: string | null; to: string | null } | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // A piece fills 92% of its square (.mini__sq img).
  const raster = usePieceRaster(ref, 0.92 / 8);
  const cells = [];
  for (let k = 0; k < 64; k++) {
    const i = flipped ? 63 - k : k;
    const sq = FILES[i % 8] + (8 - Math.floor(i / 8));
    const ch = fen[i];
    const light = (i % 8) % 2 === Math.floor(i / 8) % 2;
    const cls = `mini__sq ${light ? 'sq--light' : 'sq--dark'}${last && (sq === last.from || sq === last.to) ? ' sq--last' : ''}`;
    cells.push(
      <span key={k} className={cls}>
        {ch !== '.' ? <img src={pieceUrl(pieceCode(ch), raster)} alt="" /> : null}
      </span>,
    );
  }
  return (
    <div ref={ref} className="mini" aria-hidden="true">
      {cells}
    </div>
  );
}
