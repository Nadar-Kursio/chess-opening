'use client';

import { useState } from 'react';
import { Check } from '@/components/ui/icons';

export interface ForecastDay {
  short: string;
  /** The day inside a sentence: "today", "tomorrow", "on Thursday". */
  phrase: string;
  total: number;
  courses: { name: string; n: number }[];
}

const plural = (n: number) => `${n} move${n === 1 ? '' : 's'}`;

function sentence(d: ForecastDay) {
  if (!d.total) return `Nothing due ${d.phrase}.`;
  return `${plural(d.total)} due ${d.phrase}: ${d.courses.map((c) => `${c.n} ${c.name}`).join(', ')}.`;
}

/** The week ahead, one column a day; the chosen day spells out which courses its moves come from. */
export default function Forecast({ days }: { days: ForecastDay[] }) {
  const [chosen, setChosen] = useState(() => Math.max(0, days.findIndex((d) => d.total)));
  const peak = Math.max(1, ...days.map((d) => d.total));
  return (
    <div className="rh-forecast">
      <div className="rh-forecast__days" role="group" aria-label="Moves due each day this week">
        {days.map((d, i) => (
          <button
            key={i}
            type="button"
            className="rh-forecast__day"
            aria-pressed={chosen === i}
            aria-label={sentence(d)}
            onClick={() => setChosen(i)}
          >
            <span className="rh-forecast__n">{d.total ? d.total : i === 0 ? <Check size={14} /> : ''}</span>
            <span className="rh-forecast__slot">
              {d.total ? <span className="rh-forecast__bar" style={{ height: `${(d.total / peak) * 100}%` }} /> : null}
            </span>
            <span className="rh-forecast__label">{d.short}</span>
          </button>
        ))}
      </div>
      <p className="rh-forecast__detail" aria-live="polite">
        {sentence(days[chosen])}
      </p>
    </div>
  );
}
