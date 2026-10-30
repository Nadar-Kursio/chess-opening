import Link from 'next/link';
import { Retry, Play } from '@/components/ui/icons';
import { deckByCourse, endOfDay, forecast, syncDeck } from '@/lib/cards';
import { learnerTimezone } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recall' };

/** Seconds a Recall question takes, replay included: for the time estimate only. */
const SECONDS_PER_MOVE = 12;

const STRENGTHS = [
  { key: 'mastered', label: 'Long-term', note: 'Recalled at gaps of three weeks or more' },
  { key: 'familiar', label: 'Familiar', note: 'Holding for a week or more' },
  { key: 'learning', label: 'Learning', note: 'Still fresh: asked again within days' },
  { key: 'new', label: 'New', note: 'Learned, not yet recalled' },
] as const;

export default async function RecallPage() {
  const user = await requirePageUser('/recall');
  const tz = await learnerTimezone();
  await syncDeck(user.id);
  const [decks, days] = await Promise.all([deckByCourse(user.id, endOfDay(tz)), forecast(user.id, tz)]);
  const due = decks.reduce((n, d) => n + d.due, 0);
  const cards = decks.reduce((n, d) => n + d.counts.new + d.counts.learning + d.counts.familiar + d.counts.mastered, 0);
  const mastered = decks.reduce((n, d) => n + d.counts.mastered, 0);
  const minutes = Math.max(1, Math.round((Math.min(due, 20) * SECONDS_PER_MOVE) / 60));
  const peak = Math.max(1, ...days);
  const labels = days.map((_, i) =>
    i === 0
      ? 'Today'
      : i === 1
        ? 'Tmrw'
        : new Date(Date.now() + i * 86_400_000).toLocaleDateString('en-GB', { weekday: 'short', timeZone: tz }),
  );

  return (
    <main className="page">
      <section className="recall-hero card">
        <div className="recall-hero__body">
          <span className="eyebrow">
            <Retry size={16} /> Recall
          </span>
          {!cards ? (
            <>
              <h1>Your memory deck is empty</h1>
              <p className="lead">
                Every move you learn joins it. Learn a chapter, and Recall will ask its moves again just before you’d forget them.
              </p>
              <Link href="/" className="btn btn--primary btn--lg">
                <Play size={18} /> Learn a chapter
              </Link>
            </>
          ) : due ? (
            <>
              <h1>
                {due} move{due === 1 ? '' : 's'} to recall
              </h1>
              <p className="lead">
                About {minutes} minute{minutes === 1 ? '' : 's'} for a round of {Math.min(due, 20)}. The board replays each line
                and stops where it’s your move.
              </p>
              <Link href="/recall/session" className="btn btn--primary btn--lg">
                <Play size={18} /> Start recall
              </Link>
            </>
          ) : (
            <>
              <h1>All caught up</h1>
              <p className="lead">
                {days[1]
                  ? `Nothing due today. ${days[1]} move${days[1] === 1 ? '' : 's'} come back tomorrow.`
                  : 'Nothing due today. Learn a new chapter to grow your deck.'}
              </p>
            </>
          )}
        </div>
        {cards ? (
          <div className="recall-hero__stats">
            <div className="recall-stat">
              <b>{cards}</b>
              <span>moves in your deck</span>
            </div>
            <div className="recall-stat recall-stat--gold">
              <b>{mastered}</b>
              <span>in long-term memory</span>
            </div>
          </div>
        ) : null}
      </section>

      {cards ? (
        <div className="course-layout">
          <section className="section" aria-label="Courses">
            <h2 className="section__title">By course</h2>
            <div className="memory-list">
              {decks.map((d) => {
                const known = d.counts.new + d.counts.learning + d.counts.familiar + d.counts.mastered;
                return (
                  <article key={d.id} className="card memory">
                    <div className="memory__head">
                      <span className={`pawn pawn--${d.orientation}`} aria-hidden="true">
                        <img src={`/pieces/${d.orientation === 'white' ? 'w' : 'b'}P.svg`} alt="" />
                      </span>
                      <div className="memory__titles">
                        <h3>
                          <Link href={`/openings/${d.id}`}>{d.name}</Link>
                        </h3>
                        <span className="muted small">
                          {d.counts.mastered} of {d.total} moves in long-term memory
                          {d.odds !== null ? ` · ${d.odds}% likely to recall today` : ''}
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
                    <div className="strength" role="img" aria-label={STRENGTHS.map((s) => `${d.counts[s.key]} ${s.label.toLowerCase()}`).join(', ')}>
                      {STRENGTHS.map((s) =>
                        d.counts[s.key] ? (
                          <span key={s.key} className={`strength__part strength__part--${s.key}`} style={{ flexGrow: d.counts[s.key] }} />
                        ) : null,
                      )}
                      {d.total > known ? <span className="strength__part" style={{ flexGrow: d.total - known }} /> : null}
                    </div>
                  </article>
                );
              })}
            </div>
            <ul className="strength-key">
              {STRENGTHS.map((s) => (
                <li key={s.key} title={s.note}>
                  <i className={`strength__part strength__part--${s.key}`} /> {s.label}
                </li>
              ))}
              <li>
                <i className="strength__part" /> Not learned yet
              </li>
            </ul>
          </section>

          <aside className="sidebar">
            <div className="card side-card">
              <h3>Coming up</h3>
              <ol className="forecast" aria-label="Moves due each day this week">
                {days.map((n, i) => (
                  <li key={i} className={i === 0 ? 'forecast__day forecast__day--today' : 'forecast__day'}>
                    <span className="forecast__n">{n || ''}</span>
                    <span className="forecast__bar" style={{ height: `${Math.round((n / peak) * 100)}%` }} />
                    <span className="forecast__label">{labels[i]}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="card side-card">
              <h3>How Recall works</h3>
              <ol className="how">
                <li>Every move you learn joins your deck.</li>
                <li>Recall asks it again just before you’d forget it, in the line where it’s played.</li>
                <li>Find it and the next gap grows: days, then weeks, then months. Miss it and it’s back tomorrow.</li>
              </ol>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
