'use client';

import { useState, useTransition } from 'react';
import { resetCourse } from '@/app/actions';

/** Starting a course over is rare and can't be undone, so it asks twice. */
export default function ResetCourse({ openingId }: { openingId: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  if (!armed) {
    return (
      <button type="button" className="link-btn" onClick={() => setArmed(true)}>
        Reset progress for this course
      </button>
    );
  }
  return (
    <div className="confirm">
      <span>Clear every step and missed position for this course?</span>
      <button type="button" className="btn btn--danger btn--sm" disabled={pending} onClick={() => start(() => resetCourse(openingId))}>
        {pending ? 'Clearing…' : 'Yes, reset'}
      </button>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setArmed(false)}>
        Cancel
      </button>
    </div>
  );
}
