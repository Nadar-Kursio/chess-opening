import type { ReactNode } from 'react';
import { LIVES } from '@/lib/spar';

/* The sparring partner's face and the learner's lives, drawn inline so the colours come from
   tokens. Each face is the same few shapes with its own hair and colours. */

const HAIR: Record<string, ReactNode> = {
  marta: <path className="spar-face__hair" d="M12 22c0-9 5-14 12-14s12 5 12 14v14h-4V22c-3-1-6-4-8-7-2 4-6 6-8 7v14h-4z" />,
  kofi: <path className="spar-face__hair" d="M13.5 18c1-5 5-8 10.5-8s9.5 3 10.5 8c-3-2-7-3-10.5-3s-7.5 1-10.5 3z" />,
  ines: (
    <>
      <circle className="spar-face__hair" cx="24" cy="7" r="4.5" />
      <path className="spar-face__hair" d="M13 20c0-7 5-11 11-11s11 4 11 11c-2-3-6-5-11-5s-9 2-11 5z" />
    </>
  ),
  raj: (
    <>
      <path className="spar-face__hair" d="M13 20c0-7 4-11 11-11s11 4 11 11l-2-1c-2-3-5-4-8-4l-3 3-1-3c-3 0-5 2-6 5z" />
      <path className="spar-face__hair" d="M14.5 24c1 7 5 9 9.5 9s8.5-2 9.5-9c-1 3-3 4-4 4h-11c-1 0-3-1-4-4z" />
    </>
  ),
  olek: (
    <>
      <path className="spar-face__hair" d="M13 21c0-3 1-5 2-6v7zM35 21c0-3-1-5-2-6v7z" />
      <path className="spar-face__hair" d="M19 27.5c2-1.5 8-1.5 10 0-2 .5-8 .5-10 0z" />
      <g className="spar-face__glasses">
        <circle cx="20" cy="21" r="3.2" />
        <circle cx="28" cy="21" r="3.2" />
        <path d="M23.2 21h1.6" />
      </g>
    </>
  ),
  sunny: (
    <g className="spar-face__hair">
      <circle cx="15" cy="16" r="4" />
      <circle cx="19" cy="11" r="4.5" />
      <circle cx="25" cy="9.5" r="4.5" />
      <circle cx="31" cy="12" r="4.5" />
      <circle cx="34" cy="17" r="3.5" />
    </g>
  ),
};

export function Face({ id, size = 'md' }: { id: string; size?: 'md' | 'lg' }) {
  return (
    <svg viewBox="0 0 48 48" className={`spar-face spar-face--${id} spar-face--${size}`} aria-hidden="true">
      <circle className="spar-face__bg" cx="24" cy="24" r="24" />
      <path className="spar-face__shirt" d="M8 48c2-9 8-13 16-13s14 4 16 13z" />
      <circle className="spar-face__skin" cx="24" cy="21" r="11" />
      {HAIR[id]}
      <circle className="spar-face__ink" cx="20" cy="21" r="1.4" />
      <circle className="spar-face__ink" cx="28" cy="21" r="1.4" />
      <path className="spar-face__smile" d="M20.5 25.5q3.5 2.5 7 0" />
    </svg>
  );
}

export function Hearts({ lives }: { lives: number }) {
  return (
    <span className="spar-hearts" role="img" aria-label={`${lives} of ${LIVES} lives left`}>
      {Array.from({ length: LIVES }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={i < lives ? 'spar-heart' : 'spar-heart spar-heart--lost'} aria-hidden="true">
          <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.9 4.5 6.6 4.5c2.3 0 3.9 1.3 5.4 3.2 1.5-1.9 3.1-3.2 5.4-3.2 3.7 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z" />
        </svg>
      ))}
    </span>
  );
}
