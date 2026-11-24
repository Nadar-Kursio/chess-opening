import Link from 'next/link';
import MiniBoard from '@/components/ui/MiniBoard';
import { LevelLegend, MemoryBar, WeakMark } from '@/components/ui/Memory';
import { Play } from '@/components/ui/icons';
import { DueColumns, PracticeCharts, StabilityBars, YearCalendar } from '@/components/stats/Charts';
import { endOfDay, syncDeck } from '@/lib/cards';
import { courseCard, courses, sideLabel } from '@/lib/catalog';
import { LEVEL_LABEL, tallyTotal } from '@/lib/mastery';
import { dayIn, getProgress, getPulse, getSettings, learnerTimezone } from '@/lib/progress';
import { courseTallies, deckFacts } from '@/lib/repertoireData';
import { requirePageUser } from '@/lib/session';
import { calendar, fillDays, longestStreak, weakest } from '@/lib/stats';
import { deckStability, dueForecast, placeWeak, practiceDays, retention } from '@/lib/statsData';
import '../../repertoire.css';
import '../../stats.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Stats' };

const DAY_MS = 86_400_000;
/** What Recall schedules for: a card is asked again when its odds fall to this. */
const TARGET_RETENTION = 90;

export default async function StatsPage() {
  const user = await requirePageUser('/stats');
  const tz = await learnerTimezone();
  const today = dayIn(tz);
  const end = endOfDay(tz);
  await syncDeck(user.id);
  const [rows, pulse, settings, buckets, due, kept, facts, progress] = await Promise.all([
    practiceDays(user.id, today, 371),
    getPulse(user.id),
    getSettings(user.id),
    deckStability(user.id),
    dueForecast(user.id, tz, today, new Date(end.getTime() + 6 * DAY_MS)),
    retention(user.id),
    deckFacts(user.id, end),
    getProgress(user.id),
  ]);

  const practised = rows.filter((r) => r.moves > 0).map((r) => r.day);
  const weeks = calendar(rows, today, settings.daily_goal);
  const weak = weakest(facts, 10)
    .map((w) => ({ ...w, place: placeWeak(w) }))
    .filter((w) => w.place);
  const cards = buckets.reduce((n, b) => n + b.n, 0);
  const all = courses();
  const tallies = courseTallies(facts, all.map((o) => o.id));
  const started = all
    .filter((o) => progress.has(o.id) || tallies.get(o.id)?.started)
    .map((o) => ({ o, card: courseCard(o, progress.get(o.id)), tally: tallies.get(o.id)!.tally }));
  const dueLabels = due.map((_, i) =>
    i === 0 ? 'Today' : i === 1 ? 'Tmrw' : new Date(Date.now() + i * DAY_MS).toLocaleDateString('en-GB', { weekday: 'short', timeZone: tz }),
  );
  const recent = kept.recent_of ? Math.round((kept.recent / kept.recent_of) * 100) : null;
  const ever = kept.ever_of ? Math.round((kept.ever / kept.ever_of) * 100) : null;
  const yearMoves = weeks.flat().reduce((n, d) => n + d.moves, 0);

  if (!practised.length && !cards) {
    return (
      <main className="page">
        <section className="card stats-empty">
          <span className="eyebrow">Stats</span>
          <h1>Nothing to count yet</h1>
          <p className="lead">Play a chapter and your moves, accuracy and memory show up here, day by day.</p>
          <Link href="/" className="btn btn--primary btn--lg">
            <Play size={18} /> Start learning
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page stats-page">
      <header className="section">
        <span className="eyebrow">Stats</span>
        <h1>How your openings are coming along</h1>
      </header>

      <PracticeCharts days={fillDays(rows, today, 96)} goal={settings.daily_goal} streak={pulse.streak} longest={Math.max(pulse.streak, longestStreak(practised))} />

      <section className="card viz-card" aria-label="The last year">
        <div className="viz-card__head">
          <h3>The last year</h3>
          <span className="muted small">
            {practised.length} day{practised.length === 1 ? '' : 's'} practised · {yearMoves.toLocaleString('en-GB')} moves found
          </span>
        </div>
        <YearCalendar weeks={weeks} />
      </section>

      <section className="section" aria-label="Memory">
        <div className="section__head">
          <h2 className="section__title">Memory</h2>
          <Link href="/recall" className="btn btn--sm btn--ghost">
            Open Recall
          </Link>
        </div>
        <div className="stats-memory">
          <div className="card viz-card">
            <h3>How long each move holds</h3>
            <p className="muted small">Cards by how many days they stay 90% likely to be recalled.</p>
            <StabilityBars buckets={buckets} />
          </div>
          <div className="card viz-card">
            <h3>Due this week</h3>
            <p className="muted small">{due[0] ? `${due[0]} to recall today.` : 'Nothing due today.'}</p>
            <DueColumns counts={due} labels={dueLabels} />
          </div>
          <div className="card viz-card stats-retention">
            <h3>Retention</h3>
            <p className="muted small">Moves recalled when Recall asked again, last 30 days.</p>
            <b className="stats-retention__value">{recent === null ? 'None yet' : `${recent}%`}</b>
            <div className="meter" role="img" aria-label={recent === null ? 'No reviews yet' : `${recent}% recalled, target ${TARGET_RETENTION}%`}>
              <span className="meter__fill" style={{ width: `${recent ?? 0}%` }} />
              <span className="meter__target" style={{ left: `${TARGET_RETENTION}%` }} />
            </div>
            <p className="muted small">
              Recall aims for {TARGET_RETENTION}%.
              {kept.recent_of ? ` ${kept.recent} of ${kept.recent_of} reviews.` : ''}
              {ever !== null && kept.ever_of > kept.recent_of ? ` ${ever}% since you started.` : ''}
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-label="Weakest positions">
        <div className="section__head">
          <div>
            <h2 className="section__title">Your weakest positions</h2>
            <p className="muted small">The moves you are likeliest to forget, or miss most often.</p>
          </div>
          {weak.length ? (
            <Link href="/stats/practice" className="btn btn--primary">
              <Play size={18} /> Practise these
            </Link>
          ) : null}
        </div>
        {weak.length ? (
          <ol className="weak-grid">
            {weak.map(({ key, memory, place }) => (
              <li key={key}>
                <Link href={place!.href} className="card weak-card">
                  <MiniBoard fen={place!.fen} flipped={place!.flipped} last={place!} />
                  <span className="weak-card__course">{place!.course}</span>
                  <b>{place!.after ? `After ${place!.after}` : 'First move'}</b>
                  <span className="weak-card__facts">
                    <WeakMark />
                    {memory.odds !== null ? `${memory.odds}% recall` : LEVEL_LABEL[memory.level]}
                    {memory.misses ? ` · missed ${memory.misses} of ${memory.misses + memory.hits}` : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="card muted">No weak spots. Everything you have answered is holding up.</p>
        )}
      </section>

      <section className="section" aria-label="Courses">
        <div className="section__head">
          <h2 className="section__title">By course</h2>
          <Link href="/repertoire" className="btn btn--sm btn--ghost">
            All repertoires
          </Link>
        </div>
        <div className="card stats-courses">
          <LevelLegend />
          <ul>
            {started.map(({ o, card, tally }) => {
              const total = tallyTotal(tally);
              return (
                <li key={o.id} className="stats-course">
                  <span className="stats-course__name">
                    <span className={`pawn pawn--${o.orientation}`} aria-hidden="true">
                      <img src={`/pieces/${o.orientation === 'white' ? 'w' : 'b'}P.svg`} alt="" />
                    </span>
                    <span>
                      <Link href={`/openings/${o.id}`}>{o.name}</Link>
                      <span className="muted small">{sideLabel(o.orientation)}</span>
                    </span>
                  </span>
                  <span className="stats-course__bars">
                    <span className="stats-course__row">
                      <span className="stats-course__label">Steps</span>
                      <span className="bar bar--thin">
                        <span style={{ width: `${card.progress.pct}%` }} />
                      </span>
                      <span className="stats-course__fig">{card.progress.pct}%</span>
                    </span>
                    <span className="stats-course__row">
                      <span className="stats-course__label">Moves</span>
                      <MemoryBar tally={tally} />
                      <span className="stats-course__fig">
                        {total - tally.none}/{total}
                      </span>
                    </span>
                  </span>
                  <span className="stats-course__meta muted small">
                    {card.progress.chaptersDone} of {card.chapters.length} chapters done
                    {tally.weak ? (
                      <>
                        {' · '}
                        <WeakMark /> {tally.weak} to work on
                      </>
                    ) : null}
                  </span>
                  <Link href={`/repertoire/${o.id}`} className="btn btn--sm btn--secondary stats-course__go">
                    Explore
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </main>
  );
}
