'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { claimNews } from '@/app/fun-actions';
import type { News } from '@/lib/fun';
import { savedSessions, subscribeOutbox } from '@/lib/outbox';
import Badge from './Badge';
import Burst from './Burst';
import '@/app/fun.css';

/* Asks the server what's new (badges, quests, a level) on every page and after every saved
   session, and shows each once: a toast for most, a card of its own for a new level. `refresh`
   re-renders the page behind it, so the header's level catches up. */

const TOAST_MS = 5500;
const LEVEL_MS = 7000;
const ASK_DELAY_MS = 300;

type Shown = News & { id: number };

export default function FunNews({ refresh = false }: { refresh?: boolean }) {
  const path = usePathname();
  const router = useRouter();
  const saved = useSyncExternalStore(subscribeOutbox, savedSessions, () => 0);
  const [items, setItems] = useState<Shown[]>([]);
  const nextId = useRef(1);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Once asked, the answer is kept even if the page moves on: the server won't hand it out again.
    const t = setTimeout(() => {
      claimNews()
        .then((news) => {
          if (!mounted.current || !news.length) return;
          setItems((list) => [...list, ...news.map((n) => ({ ...n, id: nextId.current++ }))]);
          if (refresh) router.refresh();
        })
        .catch(() => {});
    }, ASK_DELAY_MS);
    return () => clearTimeout(t);
  }, [path, saved, refresh, router]);

  const dismiss = (id: number) => setItems((list) => list.filter((i) => i.id !== id));
  const level = items.find((i) => i.kind === 'level');
  const toasts = items.filter((i) => i.kind !== 'level').slice(0, 3);

  return (
    <>
      {level && level.kind === 'level' ? <LevelUp key={level.id} item={level} onClose={() => dismiss(level.id)} /> : null}
      {toasts.length ? (
        <div className="toasts" role="status">
          {toasts.map((t) => (
            <Toast key={t.id} item={t} onClose={() => dismiss(t.id)} />
          ))}
        </div>
      ) : null}
    </>
  );
}

function useAutoClose(onClose: () => void, ms: number) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const t = setTimeout(() => close.current(), ms);
    return () => clearTimeout(t);
  }, [ms]);
}

function Toast({ item, onClose }: { item: Shown; onClose: () => void }) {
  useAutoClose(onClose, TOAST_MS);
  const body =
    item.kind === 'badge' ? (
      <>
        <Badge emblem={item.emblem} tier={item.tier} size="sm" />
        <span className="toast__text">
          <span className="toast__eyebrow">New badge</span>
          <b>{item.name}</b>
          <span>{item.label}</span>
        </span>
      </>
    ) : item.kind === 'quest' ? (
      <>
        <span className="toast__icon toast__icon--quest" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="toast__text">
          <span className="toast__eyebrow">Quest done</span>
          <b>{item.title}</b>
        </span>
      </>
    ) : item.kind === 'quests' ? (
      <>
        <span className="toast__icon toast__icon--gold" aria-hidden="true">
          3/3
        </span>
        <span className="toast__text">
          <span className="toast__eyebrow">All quests cleared</span>
          <b>Bonus XP earned</b>
          <span>New quests tomorrow.</span>
        </span>
      </>
    ) : item.kind === 'welcome' ? (
      <>
        <span className="toast__icon toast__icon--level" aria-hidden="true">
          {item.level}
        </span>
        <span className="toast__text">
          <span className="toast__eyebrow">Levels and badges are here</span>
          <b>
            You start at level {item.level}, {item.name}
          </b>
          <span>
            {item.badges
              ? `Your practice so far has already earned ${item.badges} badge${item.badges === 1 ? '' : 's'}.`
              : 'Every move you find earns XP.'}
          </span>
        </span>
      </>
    ) : null;
  return (
    <div className={`toast toast--${item.kind}`}>
      {item.kind === 'quest' || item.kind === 'quests' ? <Burst /> : null}
      <Link href="/achievements" className="toast__body" onClick={onClose}>
        {body}
      </Link>
      <button type="button" className="toast__close" onClick={onClose} aria-label="Dismiss">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function LevelUp({ item, onClose }: { item: Extract<Shown, { kind: 'level' }>; onClose: () => void }) {
  useAutoClose(onClose, LEVEL_MS);
  return (
    <div className="level-up" role="dialog" aria-modal="false" aria-labelledby="level-up-title">
      <Burst big />
      <div className="level-up__card">
        <span className="level-up__ring" aria-hidden="true">
          {item.level}
        </span>
        <span className="toast__eyebrow">Level up</span>
        <h2 id="level-up-title">
          Level {item.level}: {item.name}
        </h2>
        <p className="muted">Keep finding moves to reach the next one.</p>
        <div className="level-up__actions">
          <Link href="/achievements" className="btn btn--secondary" onClick={onClose}>
            See badges
          </Link>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Nice
          </button>
        </div>
      </div>
    </div>
  );
}
