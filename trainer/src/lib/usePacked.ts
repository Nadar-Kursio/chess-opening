'use client';

import { useCallback, useEffect, useState } from 'react';
import { unpack, type Packed } from './pack';

/** Long enough for a slow phone connection, short enough that nobody stares at a spinner. */
const TIMEOUT_MS = 15_000;

export type LoadError = 'failed' | 'slow';

/** A page's big data, fetched after the page loads (see src/lib/pack.ts): `data` null while it
    comes, `error` if it didn't ('slow' when it took too long), with `retry` to ask again. An
    expired session sends the learner to sign in and back here. */
export function usePacked<T>(src: string) {
  const [state, setState] = useState<{ data: T | null; error: LoadError | null }>({ data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
    setState({ data: null, error: null });
    fetch(src, { redirect: 'manual', signal: abort.signal })
      .then(async (res) => {
        // The proxy answers a signed-out /api/* call with a redirect to sign-in.
        if (res.type === 'opaqueredirect' || res.status === 401) {
          window.location.assign(`/sign-in?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const packed = (await res.json()) as Packed<T>;
        const data = packed && typeof packed === 'object' ? unpack(packed) : null;
        if (!data || typeof data !== 'object') throw new Error('empty');
        if (live) setState({ data, error: null });
      })
      .catch(() => live && setState({ data: null, error: abort.signal.aborted ? 'slow' : 'failed' }))
      .finally(() => clearTimeout(timer));
    return () => {
      live = false;
      clearTimeout(timer);
      abort.abort();
    };
  }, [src, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
