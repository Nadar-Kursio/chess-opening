import Link from 'next/link';
import Badge from '@/components/fun/Badge';
import MiniBoard from '@/components/ui/MiniBoard';
import { Play } from '@/components/ui/icons';
import { courseCard, courses, sideLabel } from '@/lib/catalog';
import { rushBests } from '@/lib/fun';
import { getProgress } from '@/lib/progress';
import { RUSH_SECONDS, RUSH_STRIKES } from '@/lib/rush';
import { requirePageUser } from '@/lib/session';
import '@/app/fun.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Opening Rush' };

export default async function RushPage() {
  const user = await requirePageUser('/play/rush');
  const [progress, bests] = await Promise.all([getProgress(user.id), rushBests(user.id)]);
  const cards = courses().map((o) => {
    const byLine = progress.get(o.id);
    const learned = byLine ? [...byLine.values()].filter((p) => p.learned_at).length : 0;
    return { card: courseCard(o, byLine), learned, best: bests.get(o.id)?.best ?? 0 };
  });
  // Courses the learner has started come first: those are the positions a run asks.
  const started = cards.filter((c) => c.learned > 0);
  const rest = cards.filter((c) => c.learned === 0);
  const overall = Math.max(0, ...[...bests.values()].map((b) => b.best));
  const allBest = bests.get('all')?.best ?? 0;

  return (
    <main className="page">
      <section className="card rush-hero">
        <Badge emblem="bolt" tier="gold" size="lg" />
        <div className="rush-hero__body">
          <span className="eyebrow">Play</span>
          <h1>Opening Rush</h1>
          <p className="lead">
            Find your move in as many of your positions as you can before the clock runs out. A run of right answers
            multiplies your points.
          </p>
          <ul className="rush-rules" aria-label="Rules">
            <li>
              <b>{RUSH_SECONDS / 60}:00</b> on the clock
            </li>
            <li>
              <b>{RUSH_STRIKES}</b> strikes and you’re out
            </li>
            <li>
              <b>×2</b> after 5 in a row, up to <b>×4</b>
            </li>
          </ul>
        </div>
        {overall ? (
          <div className="rush-hero__best">
            <span className="muted small">Personal best</span>
            <b>{overall}</b>
          </div>
        ) : null}
      </section>

      <Link href="/play/rush/run?course=all" className="card rush-all">
        <span className="rush-all__icon" aria-hidden="true">
          <Play size={26} />
        </span>
        <span className="rush-all__body">
          <b>All my courses</b>
          <span className="muted small">
            {started.length
              ? `Positions from the ${started.reduce((k, c) => k + c.learned, 0)} chapters you’ve learned in ${started.length} course${started.length === 1 ? '' : 's'}.`
              : 'You haven’t learned a chapter yet, so this asks from every course.'}
          </span>
        </span>
        <Best score={allBest} />
      </Link>

      {started.length ? <CourseList title="Your courses" items={started} /> : null}
      <CourseList title={started.length ? 'Every other course' : 'Pick a course'} items={rest} />
    </main>
  );
}

function CourseList({
  title,
  items,
}: {
  title: string;
  items: { card: ReturnType<typeof courseCard>; learned: number; best: number }[];
}) {
  if (!items.length) return null;
  return (
    <section className="section">
      <h2 className="section__title">{title}</h2>
      <div className="rush-courses">
        {items.map(({ card, learned, best }) => (
          <Link key={card.summary.id} href={`/play/rush/run?course=${card.summary.id}`} className="card rush-course">
            <span className="rush-course__board">
              <MiniBoard fen={card.hero.fen} flipped={card.summary.orientation === 'black'} last={card.hero} />
            </span>
            <span className="rush-course__body">
              <b>{card.summary.name}</b>
              <span className="muted small">
                {learned
                  ? `${learned} chapter${learned === 1 ? '' : 's'} learned`
                  : `${sideLabel(card.summary.orientation)} · every position`}
              </span>
            </span>
            <Best score={best} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function Best({ score }: { score: number }) {
  if (!score) return null;
  return (
    <span className="rush-best">
      <span className="muted small">Best</span>
      <b>{score}</b>
    </span>
  );
}
