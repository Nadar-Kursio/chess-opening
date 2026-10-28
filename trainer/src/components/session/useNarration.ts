'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { setNarration } from '@/app/actions';

/* The coach's voice in Learn: one audio element playing recorded clips in order. Clips queue so
   the opponent's move and the reason for yours are read one after the other; the session waits on
   `speaking` before the board moves on. A browser that refuses to play before the learner has
   touched the page (a cold load) leaves the coach `blocked`, holding only the latest clip, until
   they ask for it. */

export interface NarrationProps {
  /** Clip URL by utterance key ("intro", "plan", "p<ply>"). */
  clips: Record<string, string>;
  on: boolean;
  /** Percent of normal speed. */
  rate: number;
}

export function useNarration(n: NarrationProps | null) {
  // Saving a session refreshes the page's props mid-sentence; the clips don't change, so read
  // them through a ref rather than rebuild the player.
  const props = useRef(n);
  useEffect(() => {
    props.current = n;
  });
  const audio = useRef<HTMLAudioElement | null>(null);
  const queue = useRef<string[]>([]);
  const current = useRef<string | null>(null);
  const isOn = useRef(!!n?.on);
  const isBlocked = useRef(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [on, setOn] = useState(!!n?.on);
  const [blocked, setBlocked] = useState(false);

  const block = (value: boolean) => {
    isBlocked.current = value;
    setBlocked(value);
  };

  const advance = useCallback(() => {
    const a = audio.current;
    const key = queue.current.shift() ?? null;
    current.current = key;
    setSpeaking(key);
    const src = key ? props.current?.clips[key] : null;
    if (!a || !key || !src) return;
    a.src = src;
    a.playbackRate = (props.current?.rate ?? 100) / 100;
    a.play().then(
      () => block(false),
      (err: DOMException) => {
        if (err.name !== 'NotAllowedError') return;
        queue.current = [key];
        current.current = null;
        setSpeaking(null);
        block(true);
      },
    );
  }, []);

  useEffect(() => {
    const a = new Audio();
    a.preload = 'auto';
    a.addEventListener('ended', advance);
    a.addEventListener('error', advance);
    audio.current = a;
    return () => {
      a.pause();
      queue.current = [];
      current.current = null;
      a.removeEventListener('ended', advance);
      a.removeEventListener('error', advance);
      audio.current = null;
    };
  }, [advance]);

  /** Queues a clip, or with `now` cuts in ahead of whatever is playing — even when muted. */
  const speak = useCallback(
    (key: string, now = false) => {
      if (!props.current?.clips[key] || (!isOn.current && !now)) return;
      if (now) {
        queue.current = [key];
        audio.current?.pause();
        block(false);
        advance();
      } else if (isBlocked.current) {
        queue.current = [key];
      } else {
        queue.current.push(key);
        if (!current.current) advance();
      }
    },
    [advance],
  );

  const stop = useCallback(() => {
    queue.current = [];
    audio.current?.pause();
    current.current = null;
    setSpeaking(null);
  }, []);

  const toggle = useCallback(() => {
    const next = !isOn.current;
    isOn.current = next;
    setOn(next);
    if (!next) {
      stop();
      block(false);
    }
    void setNarration(next).catch(() => {});
  }, [stop]);

  /** After a refused autoplay: play what was waiting, now that the learner has asked. */
  const resume = useCallback(() => {
    block(false);
    advance();
  }, [advance]);

  return {
    available: !!n && Object.keys(n.clips).length > 0,
    on,
    speaking,
    blocked: blocked && on,
    speak,
    stop,
    toggle,
    resume,
  };
}
