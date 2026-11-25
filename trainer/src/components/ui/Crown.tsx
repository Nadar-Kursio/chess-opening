import { CROWN_NAME, MAX_CROWN, type CrownLevel } from '@/lib/crownLevels';

/* The mastery mark: a crown in its level's colour with the level number on it, the same everywhere
   it appears. New is an empty grey crown; Mastered is gold with a spark. A chapter fading from
   overdue cards keeps the level it holds now and wears a red down-arrow until Recall wins it back.
   `rise` plays the level-up (crowns.css, stilled for reduced motion). */

export default function Crown({
  level,
  fading = false,
  size = 'md',
  rise = false,
  label,
}: {
  level: CrownLevel;
  fading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rise?: boolean;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 44"
      className={`crown crown--${size} crown--l${level}${fading ? ' crown--fading' : ''}${rise ? ' crown--rise' : ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g className="crown__shape">
        <path className="crown__body" d="M8.5 36L5 14.5l11 8.5L24 9.5l8 13.5 11-8.5L39.5 36z" />
        <circle className="crown__ball" cx="5" cy="13" r="3.4" />
        <circle className="crown__ball" cx="24" cy="7.5" r="3.8" />
        <circle className="crown__ball" cx="43" cy="13" r="3.4" />
        <rect className="crown__band" x="7" y="32.5" width="34" height="7.5" rx="2.5" />
        {level === MAX_CROWN ? <path className="crown__shine" d="M11.5 29.5l-1.6-9" /> : null}
        {level ? (
          <text className="crown__num" x="24" y="30.5" textAnchor="middle">
            {level}
          </text>
        ) : null}
      </g>
      {level === MAX_CROWN ? <path className="crown__spark" d="M40 0.5l1.4 3.6 3.6 1.4-3.6 1.4L40 10.5l-1.4-3.6L35 5.5l3.6-1.4z" /> : null}
      {fading ? (
        <g className="crown__fade">
          <circle cx="40.5" cy="36" r="7.5" />
          <path d="M40.5 32v7.5M37.3 36.6l3.2 3.2 3.2-3.2" />
        </g>
      ) : null}
    </svg>
  );
}

/** Five steps to Mastered: held ones in the level's colour, ones lost to overdue cards marked. */
export function CrownSteps({ level, earned }: { level: CrownLevel; earned: CrownLevel }) {
  return (
    <span className={`crown-steps crown-steps--l${level}`} aria-hidden="true">
      {Array.from({ length: MAX_CROWN }, (_, i) => (
        <span key={i} className={`crown-steps__step${i < level ? ' crown-steps__step--on' : i < earned ? ' crown-steps__step--lost' : ''}`} />
      ))}
    </span>
  );
}

/** The level's name in its own colour. */
export function CrownName({ level }: { level: CrownLevel }) {
  return <span className={`crown-name crown-name--l${level}`}>{CROWN_NAME[level]}</span>;
}
