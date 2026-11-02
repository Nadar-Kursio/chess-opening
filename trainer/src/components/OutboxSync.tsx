'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { flushOutbox, savedSessions, setOutboxOwner, subscribeOutbox, waitingSaves } from '@/lib/outbox';

const RETRY_WHILE_WAITING_MS = 30_000;

/** Sends saves that failed earlier: on load, on reconnecting, on returning to the tab, and every so
    often while any wait. A saved session refreshes the page so the progress shown catches up. */
export default function OutboxSync({ userId, showWaiting = false }: { userId: string; showWaiting?: boolean }) {
  const router = useRouter();
  const waiting = useSyncExternalStore(subscribeOutbox, waitingSaves, () => 0);
  const saved = useSyncExternalStore(subscribeOutbox, savedSessions, () => 0);

  useEffect(() => {
    setOutboxOwner(userId);
    void flushOutbox();
    const flush = () => void flushOutbox();
    const flushIfVisible = () => {
      if (document.visibilityState === 'visible') flush();
    };
    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', flushIfVisible);
    return () => {
      window.removeEventListener('online', flush);
      document.removeEventListener('visibilitychange', flushIfVisible);
    };
  }, [userId]);

  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => void flushOutbox(), RETRY_WHILE_WAITING_MS);
    return () => clearInterval(timer);
  }, [waiting]);

  useEffect(() => {
    if (saved) router.refresh();
  }, [saved, router]);

  if (!showWaiting || !waiting) return null;
  return (
    <div className="outbox-note" role="status">
      {waiting} result{waiting === 1 ? '' : 's'} waiting to sync
    </div>
  );
}
