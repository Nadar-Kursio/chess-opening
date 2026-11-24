import { CROWN_LABEL, MAX_CROWN, type Crown as CrownState } from '@/lib/crowns';

/* A chapter's crown: five points, a jewel on each, lit left to right as the level rises. Jewels
   the chapter earned but lost to overdue cards stay as hollow rings until Recall wins them back.
   At the full crown the whole crown turns gold. Colours are classes in crowns.css. */

const TIPS: [number, number][] = [
  [4, 10],
  [12, 7],
  [20, 4],
  [28, 7],
  [36, 10],
];

export default function Crown({ crown, size = 'md', label }: { crown: CrownState; size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const { level, earned } = crown;
  return (
    <svg
      viewBox="0 0 40 30"
      className={`crown crown--${size} crown--l${level}${level < earned ? ' crown--fading' : ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path className="crown__body" d="M6 22.5L4 10l7 6 1-9 5.5 7L20 4l2.5 10L28 7l1 9 7-6-2 12.5z" />
      <rect className="crown__band" x="5.5" y="22.5" width="29" height="5" rx="1.5" />
      {level === MAX_CROWN ? <path className="crown__shine" d="M8 19.5h24" /> : null}
      {TIPS.map(([x, y], i) => (
        <circle
          key={x}
          cx={x}
          cy={y}
          r="2.8"
          className={`crown__jewel${i < level ? ' crown__jewel--on' : i < earned ? ' crown__jewel--lost' : ''}`}
        />
      ))}
    </svg>
  );
}

/** What a crown means, for a title or a screen reader. */
export function crownWords(crown: CrownState) {
  const head = crown.level ? `Crown ${crown.level} of ${MAX_CROWN}: ${CROWN_LABEL[crown.level]}` : 'No crown yet';
  return crown.next ? `${head}. ${crown.next}.` : `${head}.`;
}
