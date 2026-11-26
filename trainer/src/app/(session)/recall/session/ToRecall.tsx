'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** A round that starts with nothing to ask: the Recall page is the caught-up screen. */
export default function ToRecall() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/recall');
  }, [router]);
  return null;
}
