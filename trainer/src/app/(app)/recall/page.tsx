import Link from 'next/link';
import { LevelRing } from '@/components/fun/LevelChip';
import { Bolt, Book, Check, ChevronRight, Flame, Play, Retry, Swords, Target } from '@/components/ui/icons';
import { deckByCourse, dueDates, endOfDay, syncDeck, type CourseMemory } from '@/lib/cards';
import { courseCard, courses, isFeatured } from '@/lib/catalog';
import { STEP_INFO } from '@/lib/course';
import { dayName, dueByDay, nextDue } from '@/lib/dueDays';
import { getFun } from '@/lib/fun';
import { LEVEL_LABEL, LEVEL_NOTE, tallyWords, type Level } from '@/lib/mastery';
import { getProgress, getPulse, lastOpening, learnerTimezone, type Pulse } from '@/lib/progress';
import { ROUND_SIZE } from '@/lib/recall';
import { requirePageUser } from '@/lib/session';
import type { Level as XpLevel } from '@/lib/xp';
import Forecast, { type ForecastDay } from './Forecast';
import '../../repertoire.css';
import '../../recall-home.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recall' };

/** Seconds a Recall question takes, replay included: for the time estimate only. */
const SECONDS_PER_MOVE = 12;

/** Strongest first, so each course's bar fills from the left like progress towards long-term memory. */
const STRONGEST_FIRST = ['mastered', 'familiar', 'learning', 'new'] as const;
/** The order a move climbs in, for the key. */
const CLIMB = ['new', 'learning', 'familiar', 'mastered'] as const;

const list = new Intl.ListFormat('en-GB', { type: 'conjunction' });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default async function RecallPage() {
  const user = await requirePageUser('/recall');
  const tz = await learnerTimezone();
  await syncDeck(user.id);
  const end = endOfDay(tz);
  const [decks, schedule, pulse, fun, progress, recent] = await Promise.all([
    deckByCourse(user.id, end),
    dueDates(user.id),
    getPulse(user.id),
    getFun(user.id),
    getProgress(user.id),
    lastOpening(user.id),
  ]);

  const names = new Map(courses().map((o) => [o.id, o.name]));
  const due = decks.reduce((n, d) => n + d.due, 0);
  const cards = decks.reduce((n, d) => n + d.counts.new + d.counts.learning + d.counts.familiar + d.counts.mastered, 0);
  const days: ForecastDay[] = dueByDay(schedule, end).map((d) => ({
    ...dayName(d.offset, tz),
    total: d.total,
    courses: d.courses.map((c) => ({ name: names.get(c.id) ?? c.id, n: c.n })),
  }));
  const next = nextDue(schedule, end);

  // The same pick as Home's "Continue": the course last played, else the first repertoire course with a step left.
  const cardsByCourse = courses().map((o) => courseCard(o, progress.get(o.id)));
  const resume =
    cardsByCourse.find((c) => c.summary.id === recent && c.progress.next) ??
    cardsByCourse.find((c) => isFeatured(c.summary.id) && c.summary.section !== 'traps' && c.progress.next) ??
    null;
  const step = resume?.progress.next
    ? {
        href: `/openings/${resume.summary.id}/${resume.progress.next.slug}/${resume.progress.next.step}`,
        title: resume.progress.next.step === 'learn' ? 'Learn the next chapter' : 'Pick up where you left off',
        where:
          `${resume.summary.name}: ${resume.progress.next.name}` +
          (resume.progress.next.step === 'learn' ? '' : `, ${STEP_INFO[resume.progress.next.step].label} next`),
      }
    : null;

  if (!cards) {
    return (
      <main className="page">
        <section className="card rh-hero rh-hero--empty">
          <div className="rh-hero__main rh-rise">
            <span className="eyebrow rh-eyebrow">
              <Retry size={16} /> Recall
            </span>
            <h1>Your memory deck is empty</h1>
            <p className="lead">
              Every move you learn joins it. Recall then asks each one again just before you’d forget it, so your openings
              stay with you.
            </p>
            {step ? (
              <Link href={step.href} className="btn btn--primary btn--lg">
                <Play size={18} /> Learn your first chapter
              </Link>
            ) : null}
            {step ? <span className="muted small">{step.where}</span> : null}
          </div>
          <div className="rh-hero__side rh-panel rh-rise" style={{ '--i': 1 } as React.CSSProperties}>
            <h2 className="rh-side-title">How a move sticks</h2>
            <Climb />
          </div>
        </section>
      </main>
    );
  }

  const dueCourses = decks.filter((d) => d.due).sort((a, b) => b.due - a.due);
  const round = Math.min(due, ROUND_SIZE);
  const minutes = Math.max(1, Math.round((round * SECONDS_PER_MOVE) / 60));
  const mastered = decks.reduce((n, d) => n + d.counts.mastered, 0);
  const answered = decks.some((d) => d.odds !== null);

  return (
    <main className="page">
      {due ? (
        <section className="card rh-hero">
          <div className="rh-hero__main rh-rise">
            <span className="eyebrow rh-eyebrow">
              <Retry size={16} /> Recall
            </span>
            <h1>{plural(due, 'move')} to recall</h1>
            <p className="lead">
              {list.format(dueCourses.map((d) => `${d.due} in ${d.name}`))}. A round of {round} takes about{' '}
              {plural(minutes, 'minute')}.
            </p>
            <Link href="/recall/session" className="btn btn--primary btn--lg">
              <Play size={18} /> Start recall
            </Link>
            <p className="rh-due-note">
              A move is due when you’re likely to start forgetting it. Find it today and the next gap grows.
            </p>
          </div>
          <PulseTiles pulse={pulse} level={fun.level} />
        </section>
      ) : (
        <section className="card rh-hero rh-hero--done">
          <div className="rh-hero__main rh-rise">
            <span className="rh-medal" aria-hidden="true">
              <Check size={30} />
            </span>
            <h1>All caught up</h1>
            <p className="lead">
              Nothing left to recall today.{' '}
              {next ? (
                <>
                  Next: <b>{plural(next.n, 'move')}</b> {dayName(next.offset, tz).phrase}.
                </>
              ) : (
                'Learn a new chapter and its moves join your deck.'
              )}
            </p>
            <p className="rh-deck">
              <b>{mastered}</b> of your <b>{cards}</b> learned moves are in long-term memory.
            </p>
          </div>
          <PulseTiles pulse={pulse} level={fun.level} />
        </section>
      )}

      {due ? null : (
        <section className="section" aria-label="What to do next">
          <h2 className="section__title">While your moves settle</h2>
          <div className="rh-steps">
            {step ? <StepLink href={step.href} icon={<Book size={22} />} title={step.title} sub={step.where} primary i={0} /> : null}
            {answered ? (
              <StepLink href="/stats/practice" icon={<Target size={22} />} title="Practise your shakiest moves" sub="The ten you’re likeliest to forget, asked early" i={1} />
            ) : null}
            <StepLink href="/play/spar" icon={<Swords size={22} />} title="Spar a club player" sub="Play your openings against moves real players choose" i={2} />
            <StepLink href="/play/rush" icon={<Bolt size={22} />} title="Opening Rush" sub="Find your moves against the clock" i={3} />
          </div>
        </section>
      )}

      <div className="course-layout">
        <section className="section" aria-label="Memory by course">
          <div>
            <h2 className="section__title">Memory by course</h2>
            <p className="muted">Each bar is every move the course can ask you, the ones you’ll keep longest on the left.</p>
          </div>
          <div className="rh-courses">
            {decks.map((d) => (
              <CourseRow key={d.id} deck={d} />
            ))}
          </div>
        </section>

        <aside className="sidebar">
          <div className="card side-card">
            <h3>Coming up</h3>
            <p className="muted small">Moves due each day. Today also holds any you didn’t get to. Tap a day for its courses.</p>
            <Forecast days={days} />
          </div>
          <div className="card side-card">
            <h3>How a move sticks</h3>
            <Climb />
          </div>
        </aside>
      </div>
    </main>
  );
}

function PulseTiles({ pulse, level }: { pulse: Pulse; level: XpLevel }) {
  const today = pulse.week[pulse.week.length - 1];
  const left = Math.max(0, pulse.goal - pulse.today);
  return (
    <div className="rh-pulse">
      <Link href="/stats" className={`rh-tile rh-rise${pulse.streak ? '' : ' rh-tile--cold'}`} style={{ '--i': 1 } as React.CSSProperties}>
        <span className="rh-flame" aria-hidden="true">
          <Flame size={30} />
        </span>
        <span className="rh-tile__body">
          <b>{plural(pulse.streak, 'day')}</b>
          <span className="rh-tile__label">
            {today.practised ? 'Streak, and today counts' : pulse.streak ? 'Streak: practise today to keep it' : 'Practise today to start a streak'}
          </span>
          <span className="week rh-week" aria-label="This week">
            {pulse.week.map((d) => (
              <span
                key={d.day}
                className={`week__day${d.practised ? ' week__day--on' : ''}${d.today ? ' week__day--today' : ''}`}
                title={d.day}
              >
                <span className="week__dot">{d.practised ? <Flame size={12} /> : null}</span>
                {d.label}
              </span>
            ))}
          </span>
        </span>
      </Link>
      <Link href="/profile" className="rh-tile rh-rise" style={{ '--i': 2 } as React.CSSProperties}>
        <GoalRing share={Math.min(1, pulse.today / pulse.goal)} />
        <span className="rh-tile__body">
          <b>
            {pulse.today}/{pulse.goal}
          </b>
          <span className="rh-tile__label">{left ? `${plural(left, 'move')} to today’s goal` : 'Today’s goal done'}</span>
        </span>
      </Link>
      <Link href="/achievements" className="rh-tile rh-rise" style={{ '--i': 3 } as React.CSSProperties}>
        <LevelRing level={level.level} share={level.share} />
        <span className="rh-tile__body">
          <b>
            Level {level.level} · {level.name}
          </b>
          <span className="rh-tile__label">{level.span - level.into} XP to the next level</span>
        </span>
      </Link>
    </div>
  );
}

function GoalRing({ share }: { share: number }) {
  return (
    <svg viewBox="0 0 48 48" className="rh-goal" aria-hidden="true">
      <circle cx="24" cy="24" r="20" className="rh-goal__track" />
      <circle cx="24" cy="24" r="20" pathLength={100} className="rh-goal__fill" strokeDasharray={`${share * 100} 100`} transform="rotate(-90 24 24)" />
      {share >= 1 ? <path d="M16 24.5l5.5 5.5L32 19.5" className="rh-goal__check" /> : null}
    </svg>
  );
}

function StepLink({ href, icon, title, sub, primary, i }: { href: string; icon: React.ReactNode; title: string; sub: string; primary?: boolean; i: number }) {
  return (
    <Link href={href} className={`card rh-step rh-rise${primary ? ' rh-step--primary' : ''}`} style={{ '--i': i + 2 } as React.CSSProperties}>
      <span className="rh-step__icon">{icon}</span>
      <span className="rh-step__body">
        <b>{title}</b>
        <span className="muted small">{sub}</span>
      </span>
      <ChevronRight size={20} className="rh-step__go" />
    </Link>
  );
}

function CourseRow({ deck: d }: { deck: CourseMemory }) {
  const learned = d.counts.new + d.counts.learning + d.counts.familiar + d.counts.mastered;
  const tally: Record<Level, number> = { none: Math.max(0, d.total - learned), ...d.counts };
  const parts = [...STRONGEST_FIRST, 'none' as const].filter((l) => tally[l]);
  return (
    <article className="card rh-course">
      <div className="rh-course__head">
        <span className={`pawn pawn--${d.orientation}`} aria-hidden="true">
          <img src={`/pieces/${d.orientation === 'white' ? 'w' : 'b'}P.svg`} alt="" />
        </span>
        <div className="rh-course__titles">
          <h3>
            <Link href={`/openings/${d.id}`}>{d.name}</Link>
          </h3>
          <span className="muted small">
            {d.counts.mastered} of {d.total} moves in long-term memory
          </span>
        </div>
        {d.due ? (
          <Link href={`/recall/session?course=${d.id}`} className="btn btn--secondary btn--sm">
            {d.due} due
          </Link>
        ) : (
          <span className="chip chip--done">Caught up</span>
        )}
      </div>
      <span className="rh-bar" role="img" aria-label={`${d.name}: ${tallyWords({ ...tally, weak: 0 })}`}>
        {parts.map((l) => (
          <span key={l} className={`rh-bar__part lvl--${l}`} style={{ flexGrow: tally[l] }} />
        ))}
      </span>
      <ul className="rh-counts" aria-hidden="true">
        {parts.map((l) => (
          <li key={l}>
            <span className={`lvl-dot lvl--${l}`} />
            <b>{tally[l]}</b> {LEVEL_LABEL[l].toLowerCase()}
          </li>
        ))}
      </ul>
    </article>
  );
}

/** The key, as the path a move takes: each level with what it means. */
function Climb() {
  return (
    <ol className="rh-climb">
      {CLIMB.map((l) => (
        <li key={l}>
          <span className={`lvl-dot lvl--${l}`} aria-hidden="true" />
          <span>
            <b>{LEVEL_LABEL[l]}</b>
            <span className="muted small">{LEVEL_NOTE[l]}</span>
          </span>
        </li>
      ))}
      <li className="rh-climb__miss">
        <span className="lvl-dot lvl--none" aria-hidden="true" />
        <span className="muted small">Miss one and it slips back, and Recall asks it again tomorrow.</span>
      </li>
    </ol>
  );
}
