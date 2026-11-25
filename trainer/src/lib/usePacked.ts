'use client';

import { useCallback, useEffect, useState } from 'react';
import { unpack, type Packed } from './pack';

/** A page's big data, fetched after the page loads (see src/lib/pack.ts): null while it comes,
    'failed' if it didn't, with `retry` to ask again. */
export function usePacked<T>(src: string) {
  const [state, setState] = useState<T | null | 'failed'>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setState(null);
    fetch(src, { redirect: 'manual' })
      .then((res) => (res.ok ? (res.json() as Promise<Packed<T>>) : Promise.reject(new Error(String(res.status)))))
      .then((packed) => live && setState(unpack(packed)))
      .catch(() => live && setState('failed'));
    return () => {
      live = false;
    };
  }, [src, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { data: state, retry };
}
