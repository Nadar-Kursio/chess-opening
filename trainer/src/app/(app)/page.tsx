import Link from 'next/link';
import CourseCard from '@/components/ui/CourseCard';
import MiniBoard from '@/components/ui/MiniBoard';
import { Flame, Play, Trap } from '@/components/ui/icons';
import { courseCard, courses, isFeatured, trapCourses } from '@/lib/catalog';
import { getOpening } from '@/lib/content';
import { STEP_INFO, lineBySlug } from '@/lib/course';
import { getProgress, getPulse, lastOpening, learnerTimezone } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Learn' };

export default async function Home() {
  const user = await requirePageUser('/');
  const [progress, pulse, recent, tz] = await Promise.all([
    getProgress(user.id),
    getPulse(user.id),
    lastOpening(user.id),
    learnerTimezone(),
  ]);

  const cards = courses().map((o) => courseCard(o, progress.get(o.id)));
  const repertoire = cards.filter((c) => isFeatured(c.summary.id));
  const others = cards.filter((c) => !isFeatured(c.summary.id) && c.summary.section !== 'traps');
  const traps = trapCourses();

  // Pick up where the learner left off; a newcomer starts at the top of the repertoire.
  const resume =
    cards.find((c) => c.summary.id === recent && c.progress.next) ??
    repertoire.find((c) => c.progress.next) ??
    null;
  const resumeLine = resume?.progress.next
    ? lineBySlug(getOpening(resume.summary.id), resume.progress.next.slug)
    : null;

  const firstName = (user.name || '').split(' ')[0] || 'there';
  const white = repertoire.filter((c) => c.summary.orientation === 'white');
  const black = repertoire.filter((c) => c.summary.orientation === 'black');

  return (
    <main className="page">
      <section className="home-hero">
        <div className="home-hero__hello">
          <h1>
            {greeting(tz)}, {firstName}
          </h1>
          <p className="lead">
            {pulse.today >= pulse.goal
              ? 'Daily goal done. Anything more is a bonus.'
              : pulse.today > 0
                ? `${pulse.goal - pulse.today} more moves to hit today’s goal.`
                : 'A few minutes a day is how openings stick.'}
          </p>
        </div>

        {resume && resume.progress.next && resumeLine ? (
          <Link
            className="card resume"
            href={`/openings/${resume.summary.id}/${resume.progress.next.slug}/${resume.progress.next.step}`}
          >
            <div className="resume__board">
              <MiniBoard
                fen={resumeLine.plies[Math.min(resumeLine.plies.length - 1, 8)].fen}
                flipped={resume.summary.orientation === 'black'}
              />
            </div>
            <div className="resume__body">
              <span className="eyebrow">Continue · {resume.summary.name}</span>
              <h2>{resume.progress.next.name}</h2>
              <p className="muted">
                Next step: <b>{STEP_INFO[resume.progress.next.step].label}</b> —{' '}
                {STEP_INFO[resume.progress.next.step].blurb}
              </p>
              <div className="bar">
                <span style={{ width: `${Math.max(3, resume.progress.pct)}%` }} />
              </div>
              <span className="btn btn--primary resume__cta">
                <Play size={18} /> Continue
              </span>
            </div>
          </Link>
        ) : null}

        <div className="card goal">
          <div className="goal__ring">
            <BigRing share={Math.min(1, pulse.today / pulse.goal)} />
            <span className="goal__count">
              <b>{pulse.today}</b>/{pulse.goal}
            </span>
          </div>
          <div>
            <h3>Today’s goal</h3>
            <p className="muted">Moves played from memory today.</p>
            <div className="week" aria-label="This week">
              {pulse.week.map((d) => (
                <span
                  key={d.day}
                  className={`week__day${d.practised ? ' week__day--on' : ''}${d.today ? ' week__day--today' : ''}`}
                  title={d.day}
                >
                  <span className="week__dot">{d.practised ? <Flame size={14} /> : null}</span>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Your repertoire</h2>
        <div className="rep">
          <RepColumn title="As White" sub="You move first" cards={white} side="white" />
          <RepColumn title="As Black" sub="You answer 1.e4" cards={black} side="black" />
        </div>
      </section>

      <section className="section">
        <Link href="/traps" className="card trap-banner">
          <span className="trap-banner__icon">
            <Trap size={28} />
          </span>
          <div>
            <h2>Opening traps</h2>
            <p className="muted">
              {traps.length} trap course{traps.length === 1 ? '' : 's'}, from the Fried Liver to the quick mates. Learn to
              spring them — and never fall for them.
            </p>
          </div>
          <span className="btn btn--gold">Open</span>
        </Link>
      </section>

      {others.length ? (
        <section className="section">
          <h2 className="section__title">More openings</h2>
          <div className="grid-cards">
            {others.map((c) => (
              <CourseCard key={c.summary.id} card={c} compact />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function RepColumn({
  title,
  sub,
  cards,
  side,
}: {
  title: string;
  sub: string;
  cards: ReturnType<typeof courseCard>[];
  side: 'white' | 'black';
}) {
  return (
    <div className="rep__col">
      <div className="rep__head">
        <span className={`pawn pawn--${side}`} aria-hidden="true">
          <img src={`/pieces/${side === 'white' ? 'w' : 'b'}P.svg`} alt="" />
        </span>
        <div>
          <h3>{title}</h3>
          <span className="muted">{sub}</span>
        </div>
      </div>
      {cards.length ? (
        cards.map((c) => <CourseCard key={c.summary.id} card={c} />)
      ) : (
        <p className="muted card card--empty">Coming soon.</p>
      )}
    </div>
  );
}

function BigRing({ share }: { share: number }) {
  const c = 2 * Math.PI * 40;
  return (
    <svg viewBox="0 0 100 100" className="ring ring--big" aria-hidden="true">
      <circle cx="50" cy="50" r="40" className="ring__track" />
      <circle cx="50" cy="50" r="40" className="ring__fill" strokeDasharray={`${share * c} ${c}`} transform="rotate(-90 50 50)" />
    </svg>
  );
}

function greeting(tz: string) {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(new Date()));
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
