'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { Speaker, SpeakerOff } from '@/components/ui/icons';

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
  /** The narration clip that reads this message aloud, by utterance key. */
  clip?: string;
}

/** What the coach panel needs from useNarration to show and control the voice. */
export interface Voice {
  on: boolean;
  speaking: string | null;
  blocked: boolean;
  toggle: () => void;
  replay: (clip: string) => void;
  resume: () => void;
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
  onFlip,
}: {
  onFlip: () => void;
  closeHref: string;
  title: string;
  progress: number;
  counter?: string;
  board: ReactNode;
  side: ReactNode;
  footer: ReactNode;
  tone: Tone;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'f' || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      onFlip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onFlip]);
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
        <button type="button" className="icon-btn" onClick={onFlip} aria-label="Flip the board" title="Flip the board (F)">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M7 4v14M7 18l-3-3M7 18l3-3M17 20V6M17 6l-3 3M17 6l3 3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
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

export function Coach({ msgs, voice, children }: { msgs: Msg[]; voice?: Voice; children?: ReactNode }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [msgs.length]);
  return (
    <section className="coach" aria-label="Coach">
      <div className="coach__feed">
        {msgs.map((m) => (
          <Bubble key={m.id} kind={m.kind} title={m.title} clip={m.clip} voice={voice}>
            {m.html ? <div className="bubble__text" dangerouslySetInnerHTML={{ __html: m.html }} /> : null}
            {m.text ? <p className="bubble__text">{m.text}</p> : null}
          </Bubble>
        ))}
        <div ref={end} />
      </div>
      {children}
    </section>
  );
}

/** A coach message. One that has a recording gets a button to hear it, and lights while it plays. */
export function Bubble({
  kind,
  title,
  clip,
  voice,
  children,
}: {
  kind: string;
  title?: string;
  clip?: string;
  voice?: Voice;
  children?: ReactNode;
}) {
  const playing = !!clip && voice?.speaking === clip;
  return (
    <div className={`bubble bubble--${kind}${playing ? ' bubble--speaking' : ''}`}>
      {clip && voice ? (
        <button
          type="button"
          className="bubble__play"
          onClick={() => voice.replay(clip)}
          aria-label={playing ? 'The coach is reading this' : 'Hear this again'}
          title={playing ? 'Reading…' : 'Hear this again'}
        >
          {playing ? <Wave /> : <Speaker size={16} />}
        </button>
      ) : null}
      {title ? <div className="bubble__title">{title}</div> : null}
      {children}
    </div>
  );
}

function Wave() {
  return (
    <span className="wave" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

/** The coach's name plate. With a voice, the avatar pulses while it speaks and a button mutes it. */
export function CoachAvatar({ voice }: { voice?: Voice }) {
  const speaking = !!voice?.speaking;
  useEffect(() => {
    if (!voice) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'm' || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      voice.toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [voice]);
  return (
    <div className={`coach__who${speaking ? ' coach__who--speaking' : ''}`}>
      <span className="coach__avatar" aria-hidden="true">
        <img src="/pieces/wN.svg" alt="" />
      </span>
      <span className="coach__name">Coach</span>
      {speaking ? (
        <span className="coach__status" role="status">
          <Wave /> Speaking
        </span>
      ) : null}
      {voice?.blocked ? (
        <button type="button" className="btn btn--secondary btn--sm coach__resume" onClick={voice.resume}>
          <Speaker size={16} /> Tap to hear the coach
        </button>
      ) : null}
      {voice ? (
        <button
          type="button"
          className={`icon-btn coach__mute${voice.on ? '' : ' coach__mute--off'}`}
          onClick={voice.toggle}
          aria-pressed={!voice.on}
          aria-label={voice.on ? 'Mute the coach' : 'Unmute the coach'}
          title={voice.on ? 'Mute the coach (M)' : 'Unmute the coach (M)'}
        >
          {voice.on ? <Speaker /> : <SpeakerOff />}
        </button>
      ) : null}
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
