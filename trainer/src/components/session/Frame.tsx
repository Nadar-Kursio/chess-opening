'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';

/* The session screen every mode shares: a top bar with the way out and the progress, the board,
   the coach's running commentary beside it, and a footer that turns green or red with the
   verdict — the shape learners already know from Chessly and Duolingo. */

export type Tone = 'idle' | 'good' | 'bad' | 'info' | 'done';

export interface Msg {
  id: number;
  kind: 'intro' | 'theirs' | 'yours' | 'oops' | 'hint' | 'info' | 'done';
  title?: string;
  /** Authored course prose: compiled from the repo, already HTML-escaped by the author. */
  html?: string | null;
  text?: string;
}

export function SessionFrame({
  closeHref,
  title,
  progress,
  counter,
  board,
  side,
  footer,
  tone,
}: {
  closeHref: string;
  title: string;
  progress: number;
  counter?: string;
  board: ReactNode;
  side: ReactNode;
  footer: ReactNode;
  tone: Tone;
}) {
  return (
    <div className="session">
      <header className="session__top">
        <Link href={closeHref} className="icon-btn" aria-label="Leave this session">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </Link>
        <div className="session__title">{title}</div>
        <div
          className="bar bar--session"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span style={{ width: `${Math.max(2, progress * 100)}%` }} />
        </div>
        {counter ? <span className="session__counter">{counter}</span> : null}
      </header>
      <main className="session__body">
        <div className="session__board">{board}</div>
        <aside className="session__side">{side}</aside>
      </main>
      <footer className={`session__foot session__foot--${tone}`} aria-live="polite">
        <div className="session__foot-inner">{footer}</div>
      </footer>
    </div>
  );
}

export function Coach({ msgs, children }: { msgs: Msg[]; children?: ReactNode }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [msgs.length]);
  return (
    <section className="coach" aria-label="Coach">
      <div className="coach__feed">
        {msgs.map((m) => (
          <div key={m.id} className={`bubble bubble--${m.kind}`}>
            {m.title ? <div className="bubble__title">{m.title}</div> : null}
            {m.html ? <p className="bubble__text" dangerouslySetInnerHTML={{ __html: m.html }} /> : null}
            {m.text ? <p className="bubble__text">{m.text}</p> : null}
          </div>
        ))}
        <div ref={end} />
      </div>
      {children}
    </section>
  );
}

export function CoachAvatar() {
  return (
    <div className="coach__who">
      <span className="coach__avatar" aria-hidden="true">
        <img src="/pieces/wN.svg" alt="" />
      </span>
      <span className="coach__name">Coach</span>
    </div>
  );
}

/** Enter/Space presses the footer's main button, so a session runs from the keyboard. */
export function usePrimaryKey(action: (() => void) | null) {
  const ref = useRef(action);
  useEffect(() => {
    ref.current = action;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !ref.current) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT') return;
      e.preventDefault();
      ref.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function useMessages() {
  const next = useRef(1);
  return (m: Omit<Msg, 'id'>): Msg => ({ ...m, id: next.current++ });
}
