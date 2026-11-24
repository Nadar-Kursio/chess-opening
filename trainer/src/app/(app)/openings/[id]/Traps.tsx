import Link from 'next/link';
import MiniBoard from '@/components/ui/MiniBoard';
import { Check, Trap } from '@/components/ui/icons';
import type { TrapView } from '@/lib/traps';
import type { Colour } from '@/lib/types';

const GROUPS = {
  set: { title: 'Set these', sub: 'Your side springs them. Know when the offer is on.' },
  watch: { title: 'Watch for these', sub: 'Set against you. What to play comes first, the trap itself second.' },
} as const;

/* The trap courses that happen in this one. Their progress is shown but kept out of the course's
   own percentage: a trap is a side road, and finishing the London shouldn't wait on one. */
export default function Traps({
  traps,
  orientation,
  chapterOf,
}: {
  traps: TrapView[];
  orientation: Colour;
  chapterOf: (slug: string) => { index: number; name: string } | undefined;
}) {
  return (
    <section className="course-traps" id="traps" aria-labelledby="course-traps-title">
      <div className="course-traps__head">
        <h2 className="section__title" id="course-traps-title">
          Traps in this opening
        </h2>
        <p className="muted">Short courses of their own, met on the way through this one. They don’t count toward its progress.</p>
      </div>
      <div className="card course-traps__card">
        {(['set', 'watch'] as const).map((group) => {
          const views = traps.filter((t) => t.trap.group === group);
          if (!views.length) return null;
          return (
            <div key={group} className={`course-traps__group course-traps__group--${group}`}>
              <div className="course-traps__group-head">
                <span className="course-traps__badge" aria-hidden="true">
                  <Trap size={18} />
                </span>
                <div>
                  <h3>{GROUPS[group].title}</h3>
                  <p className="muted small">{GROUPS[group].sub}</p>
                </div>
              </div>
              <ul className="course-traps__list">
                {views.map((v) => (
                  <TrapRow key={v.trap.id} v={v} orientation={orientation} chapter={chapterOf(v.trap.chapter)} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TrapRow({
  v,
  orientation,
  chapter,
}: {
  v: TrapView;
  orientation: Colour;
  chapter: { index: number; name: string } | undefined;
}) {
  const { trap, progress } = v;
  const started = progress.done > 0;
  const complete = !progress.next;
  return (
    <li className="trap-row" id={`trap-${trap.id}`}>
      <div className="trap-row__board">
        <MiniBoard fen={trap.moment.fen} flipped={orientation === 'black'} last={trap.moment} />
        <span className="trap-row__moment">after {trap.moment.num}</span>
      </div>
      <div className="trap-row__body">
        <div className="trap-row__title">
          <h4>{v.title}</h4>
          {chapter ? <span className="muted small">Chapter {chapter.index + 1}: {chapter.name}</span> : null}
        </div>
        {v.defence ? (
          <div className="trap-row__defence">
            <span className="trap-row__defence-name">
              {v.defence.studied ? <Check size={16} /> : null}
              {v.defence.name}
            </span>
            <p className="clamp-2" dangerouslySetInnerHTML={{ __html: v.defence.text }} />
          </div>
        ) : null}
        <div className="trap-row__progress">
          <div
            className="bar bar--thin"
            role="progressbar"
            aria-label={`${v.title}: trap course progress`}
            aria-valuenow={progress.pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${progress.pct}%` }} />
          </div>
          <span className="muted small">
            {complete ? 'Trap course done' : started ? `${progress.done} of ${progress.total} steps` : 'Not started'}
          </span>
        </div>
        <div className="trap-row__actions">
          <Link href={v.primary.href} className={`btn btn--sm ${complete && trap.group === 'set' ? 'btn--ghost' : 'btn--primary'}`}>
            {v.primary.label}
          </Link>
          <Link href={v.secondary.href} className="trap-row__more">
            {v.secondary.label} →
          </Link>
        </div>
      </div>
    </li>
  );
}
