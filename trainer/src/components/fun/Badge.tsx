import type { Emblem } from '@/lib/achievements';
import type { Tier } from '@/lib/xp';

/* A badge drawn inline: a faceted medal in the tier's metal with the family's emblem struck on it.
   Colours come from the tier class in fun.css, so one drawing serves every tier and both themes. */

const EMBLEMS: Record<Emblem, React.ReactNode> = {
  book: <path d="M3 5.5c3-1.3 6-1.3 9 .7 3-2 6-2 9-.7V19c-3-1.3-6-1.3-9 .7-3-2-6-2-9-.7zM12 6.2v13.5" className="badge__stroke" />,
  flame: <path d="M12 2c.8 3.6 4.9 5.7 4.9 11a4.9 4.9 0 0 1-9.8 0c0-2 .9-3.3 2-4.3.1 1.8.9 3 2 3.2-.3-3.6-.6-6.3.9-9.9z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" className="badge__stroke" />
      <circle cx="12" cy="12" r="4.5" className="badge__stroke" />
      <circle cx="12" cy="12" r="1.8" />
    </>
  ),
  crown: <path d="M3 18.5h18L19.5 8l-4.6 4.2L12 5l-2.9 7.2L4.5 8zM3.5 21h17" />,
  brain: (
    <path
      d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4z"
      className="badge__stroke"
    />
  ),
  star: <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />,
  bolt: <path d="M13.5 2L4.5 13.5h6.5L10 22l9.5-12h-6.8z" />,
  swords: (
    <path
      d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 6.5L21 18v3h-3L6.5 9.5M5 14l-2 2 4 4 2-2"
      className="badge__stroke"
    />
  ),
  board: (
    <>
      <path d="M4 4h16v16H4z" className="badge__stroke" />
      <path d="M4 4h4v4H4zM12 4h4v4h-4zM8 8h4v4H8zM16 8h4v4h-4zM4 12h4v4H4zM12 12h4v4h-4zM8 16h4v4H8zM16 16h4v4h-4z" />
    </>
  ),
  flag: <path d="M5 21.5V3.5M5 4h12.5l-2.6 4.5 2.6 4.5H5" className="badge__stroke" />,
};

export default function Badge({
  emblem,
  tier,
  locked = false,
  size = 'md',
  label,
}: {
  emblem: Emblem;
  tier: Tier;
  locked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Given, the badge is announced as an image; otherwise it's decoration beside its own text. */
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`badge badge--${size} badge--${locked ? 'locked' : tier}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path className="badge__rim" d="M32 2l26 15v30L32 62 6 47V17z" />
      <path className="badge__face" d="M32 8l21 12.1v23.8L32 56 11 43.9V20.1z" />
      <path className="badge__shine" d="M32 8l21 12.1v6L32 14.5 11 26.1v-6z" />
      <g className="badge__emblem" transform="translate(18.4 18.4) scale(1.13)">
        {EMBLEMS[emblem]}
      </g>
      {locked ? (
        <g className="badge__lock" transform="translate(41 41)">
          <circle cx="9" cy="9" r="9" />
          <path d="M5.5 8.5h7v5.5h-7zM7 8.5V7a2 2 0 0 1 4 0v1.5" />
        </g>
      ) : null}
    </svg>
  );
}
