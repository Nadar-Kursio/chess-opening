import Link from 'next/link';
import { getFun } from '@/lib/fun';
import FunNews from './FunNews';
import '@/app/fun.css';

/** The header's level: a ring that fills towards the next one, with the rank beside it on wide screens. */
export default async function LevelChip({ userId }: { userId: string }) {
  const { level } = await getFun(userId);
  return (
    <>
      <Link
        href="/achievements"
        className="stat-chip level-chip"
        title={`Level ${level.level}, ${level.name}: ${level.into} of ${level.span} XP to the next level`}
        aria-label={`Level ${level.level}, ${level.name}. Badges and XP`}
      >
        <LevelRing level={level.level} share={level.share} />
        <span className="level-chip__name">{level.name}</span>
      </Link>
      <FunNews refresh />
    </>
  );
}

export function LevelRing({ level, share, big = false }: { level: number; share: number; big?: boolean }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <span className={`level-ring${big ? ' level-ring--big' : ''}`}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r={r} className="level-ring__track" />
        <circle
          cx="18"
          cy="18"
          r={r}
          className="level-ring__fill"
          strokeDasharray={`${Math.max(0.02, share) * c} ${c}`}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <b>{level}</b>
    </span>
  );
}
