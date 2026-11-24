import { LEVELS, LEVEL_LABEL, LEVEL_NOTE, tallyWords, type Tally } from '@/lib/mastery';

/* How well a group of positions is remembered, in the explorer's colours: a level per square, weakest
   first, and a red mark where a position needs work. */

/** What the learner remembers below a move, weakest level first: a thin bar with no text. */
export function MemoryBar({ tally }: { tally: Tally }) {
  return (
    <span className="mem-bar" role="img" aria-label={tallyWords(tally)}>
      {LEVELS.map((l) => (tally[l] ? <span key={l} className={`mem-bar__part lvl--${l}`} style={{ flexGrow: tally[l] }} /> : null))}
    </span>
  );
}

export function WeakMark() {
  return <span className="weak-mark" aria-hidden="true" />;
}

export function LevelLegend() {
  return (
    <ul className="lvl-legend" aria-label="Colour key">
      {LEVELS.map((l) => (
        <li key={l} title={LEVEL_NOTE[l]}>
          <span className={`lvl-dot lvl--${l}`} /> {LEVEL_LABEL[l]}
        </li>
      ))}
      <li title="Due today after being recalled before, or missed more often than found">
        <WeakMark /> Needs work
      </li>
    </ul>
  );
}

