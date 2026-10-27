'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Turn } from '@/lib/types';

/* An 8x8 grid of squares with SVG pieces. It knows no chess: which moves exist is the packed
   `legal` string the build shipped for this position, and the board only reports what the hand
   did. Click a piece then a square, or drag it — both end in onMove. */

const FILES = 'abcdefgh';

export interface BoardArrow {
  from: string;
  to: string;
  kind: 'hint' | 'good' | 'bad';
}

export interface BoardFlash {
  sq: string;
  kind: 'good' | 'bad';
}

interface Props {
  fen: string;
  orientation: Turn;
  last?: { from: string | null; to: string | null } | null;
  /** Fixed-width 4-char UCI records for the side to move. */
  legal?: string;
  /** Whose pieces the hand may pick up; null makes the board a picture. */
  movable?: Turn | null;
  onMove?: (from: string, to: string) => void;
  arrows?: BoardArrow[];
  flash?: BoardFlash | null;
  /** The side to move is in check: its king's square glows. */
  checkSide?: Turn | null;
  coordinates?: boolean;
  animate?: boolean;
  label?: string;
}

function squareName(index: number) {
  return FILES[index % 8] + (8 - Math.floor(index / 8));
}

function pieceSrc(ch: string) {
  const colour = ch === ch.toUpperCase() ? 'w' : 'b';
  return `/pieces/${colour}${ch.toUpperCase()}.svg`;
}

const PIECE_NAME: Record<string, string> = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn',
};

function targetsFrom(legal: string | undefined, from: string) {
  const out: string[] = [];
  if (!legal) return out;
  for (let i = 0; i < legal.length; i += 4) {
    if (legal.slice(i, i + 2) === from) out.push(legal.slice(i + 2, i + 4));
  }
  return out;
}

/** Grid column/row of a square as drawn, given which way the board faces. */
function cell(sq: string, orientation: Turn) {
  const file = FILES.indexOf(sq[0]);
  const rank = Number(sq[1]) - 1;
  return orientation === 'w' ? { col: file, row: 7 - rank } : { col: 7 - file, row: rank };
}

export default function Board({
  fen,
  orientation,
  last,
  legal,
  movable = null,
  onMove,
  arrows = [],
  flash,
  checkSide,
  coordinates = true,
  animate = true,
  label,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLImageElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ from: string; moved: boolean } | null>(null);
  const start = useRef({ x: 0, y: 0 });
  const [prevFen, setPrevFen] = useState(fen);

  // A new position clears any half-made move.
  if (prevFen !== fen) {
    setPrevFen(fen);
    setSelected(null);
    setDrag(null);
  }

  const at = (sq: string) => {
    const ch = fen[(8 - Number(sq[1])) * 8 + FILES.indexOf(sq[0])];
    return ch === '.' ? '' : ch;
  };
  const isMine = (sq: string) => {
    const ch = at(sq);
    return !!ch && !!movable && (ch === ch.toUpperCase() ? 'w' : 'b') === movable;
  };
  const targets = selected ? targetsFrom(legal, selected) : [];

  /* Castling can be entered king-onto-rook as well as king two squares; the data records the
     king's two-square move. */
  const normalise = (from: string, to: string) => {
    const piece = at(from);
    const target = at(to);
    if (piece.toLowerCase() === 'k' && target.toLowerCase() === 'r' && isMine(to)) {
      return to[0] === 'h' ? 'g' + from[1] : 'c' + from[1];
    }
    return to;
  };

  const tryMove = (from: string, to: string) => {
    const dest = normalise(from, to);
    setSelected(null);
    if (targetsFrom(legal, from).includes(dest)) onMove?.(from, dest);
  };

  const squareAt = (x: number, y: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const col = Math.floor(((x - rect.left) / rect.width) * 8);
    const row = Math.floor(((y - rect.top) / rect.height) * 8);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    const file = orientation === 'w' ? col : 7 - col;
    const rank = orientation === 'w' ? 7 - row : row;
    return FILES[file] + (rank + 1);
  };

  const moveGhost = (x: number, y: number) => {
    const ghost = ghostRef.current;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!ghost || !rect) return;
    const size = rect.width / 8;
    ghost.style.width = `${size}px`;
    ghost.style.height = `${size}px`;
    ghost.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px)`;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!movable || e.button !== 0) return;
    const sq = squareAt(e.clientX, e.clientY);
    if (!sq) return;
    if (selected && sq !== selected && (!isMine(sq) || targets.includes(normalise(selected, sq)))) {
      tryMove(selected, sq);
      return;
    }
    if (!isMine(sq)) {
      setSelected(null);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setSelected(sq);
    setDrag({ from: sq, moved: false });
    moveGhost(e.clientX, e.clientY);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    moveGhost(e.clientX, e.clientY);
    if (!drag.moved && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 6) {
      setDrag({ ...drag, moved: true });
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const sq = squareAt(e.clientX, e.clientY);
    const { from, moved } = drag;
    setDrag(null);
    // A press and release on the same square is a click: the piece stays picked up.
    if (moved && sq && sq !== from) tryMove(from, sq);
  };

  const squares = [];
  for (let i = 0; i < 64; i++) {
    const sq = squareName(i);
    const { col, row } = cell(sq, orientation);
    const ch = fen[i] === '.' ? '' : fen[i];
    // a1 is dark: file index 0 plus rank 1 is odd.
    const light = (FILES.indexOf(sq[0]) + Number(sq[1])) % 2 === 0;
    const cls = ['sq', light ? 'sq--light' : 'sq--dark'];
    if (last && (sq === last.from || sq === last.to)) cls.push('sq--last');
    if (sq === selected) cls.push('sq--picked');
    if (flash?.sq === sq) cls.push(`sq--${flash.kind}`);
    if (checkSide && ch && ch.toLowerCase() === 'k' && (ch === 'K' ? 'w' : 'b') === checkSide) {
      cls.push('sq--check');
    }
    const isTarget = targets.includes(sq);
    const arriving = animate && last?.to === sq && last.from;
    let slide;
    if (arriving && last?.from) {
      const from = cell(last.from, orientation);
      slide = {
        '--dx': `${(from.col - col) * 100}%`,
        '--dy': `${(from.row - row) * 100}%`,
      } as React.CSSProperties;
    }
    squares.push(
      <div
        key={sq}
        className={cls.join(' ')}
        style={{ gridColumn: col + 1, gridRow: row + 1 }}
        data-sq={sq}
      >
        {coordinates && row === 7 ? <span className="coord coord--file">{sq[0]}</span> : null}
        {coordinates && col === 0 ? <span className="coord coord--rank">{sq[1]}</span> : null}
        {ch ? (
          <img
            // Remounting on each new position replays the slide from the origin square.
            key={arriving ? `${fen}-${sq}` : sq}
            src={pieceSrc(ch)}
            alt=""
            draggable={false}
            className={`piece${arriving ? ' piece--arriving' : ''}${drag?.moved && drag.from === sq ? ' piece--lifted' : ''}${isMine(sq) ? ' piece--mine' : ''}`}
            style={slide}
          />
        ) : null}
        {isTarget ? <span className={ch ? 'target target--capture' : 'target'} /> : null}
      </div>,
    );
  }

  return (
    <div className="board-frame">
      <div
        ref={boardRef}
        className={`board${movable ? ' board--live' : ''}`}
        role="img"
        aria-label={label ?? describe(fen)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        {squares}
        <Arrows arrows={arrows} orientation={orientation} />
      </div>
      <img
        ref={ghostRef}
        className={drag?.moved ? 'ghost' : 'ghost ghost--hidden'}
        src={pieceSrc((drag && at(drag.from)) || 'P')}
        alt=""
      />
    </div>
  );
}

function Arrows({ arrows, orientation }: { arrows: BoardArrow[]; orientation: Turn }) {
  if (!arrows.length) return null;
  const centre = (sq: string) => {
    const { col, row } = cell(sq, orientation);
    return { x: col * 12.5 + 6.25, y: row * 12.5 + 6.25 };
  };
  return (
    <svg className="arrows" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        {(['hint', 'good', 'bad'] as const).map((k) => (
          <marker key={k} id={`head-${k}`} markerWidth="4" markerHeight="4" refX="2.2" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 z" className={`arrow-head arrow-head--${k}`} />
          </marker>
        ))}
      </defs>
      {arrows.map((a, i) => {
        const f = centre(a.from);
        const t = centre(a.to);
        const len = Math.hypot(t.x - f.x, t.y - f.y);
        const trim = 4.2;
        const x2 = t.x - ((t.x - f.x) / len) * trim;
        const y2 = t.y - ((t.y - f.y) / len) * trim;
        return (
          <line
            key={i}
            x1={f.x}
            y1={f.y}
            x2={x2}
            y2={y2}
            className={`arrow arrow--${a.kind}`}
            markerEnd={`url(#head-${a.kind})`}
          />
        );
      })}
    </svg>
  );
}

/** A screen reader gets the pieces, not 64 squares. */
function describe(fen: string) {
  const parts: string[] = [];
  for (let i = 0; i < 64; i++) {
    const ch = fen[i];
    if (ch === '.') continue;
    parts.push(`${ch === ch.toUpperCase() ? 'white' : 'black'} ${PIECE_NAME[ch.toLowerCase()]} ${squareName(i)}`);
  }
  return `Chess board: ${parts.join(', ')}`;
}
