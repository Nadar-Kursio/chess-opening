import Link from 'next/link';
import type { courseCard } from '@/lib/catalog';
import { sideLabel } from '@/lib/catalog';
import MiniBoard from './MiniBoard';

export default function CourseCard({ card, compact = false }: { card: ReturnType<typeof courseCard>; compact?: boolean }) {
  const { summary: o, progress, chapters: chs, hero } = card;
  return (
    <Link href={`/openings/${o.id}`} className={`card course-card${compact ? ' course-card--compact' : ''}`}>
      <div className="course-card__board">
        <MiniBoard fen={hero.fen} flipped={o.orientation === 'black'} last={hero} />
      </div>
      <div className="course-card__body">
        <div className="course-card__top">
          <h3>{o.name}</h3>
          <span className="eco">{o.eco}</span>
        </div>
        {!compact ? <p className="muted clamp-2">{o.tagline}</p> : <span className="muted">{sideLabel(o.orientation)}</span>}
        <div className="course-card__progress">
          <div className="bar bar--thin">
            <span style={{ width: `${Math.max(2, progress.pct)}%` }} />
          </div>
          <span className="course-card__pct">{progress.pct}%</span>
        </div>
        <span className="muted small">
          {progress.chaptersDone}/{chs.length} chapters · {o.level}
        </span>
      </div>
    </Link>
  );
}

