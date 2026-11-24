import Link from 'next/link';
import MiniBoard from '@/components/ui/MiniBoard';
import { LevelLegend, MemoryBar, WeakMark } from '@/components/ui/Memory';
import { endOfDay, syncDeck } from '@/lib/cards';
import { courseCard, courses, sideLabel } from '@/lib/catalog';
import { tallyTotal } from '@/lib/mastery';
import { learnerTimezone } from '@/lib/progress';
import { courseTallies, deckFacts } from '@/lib/repertoireData';
import { requirePageUser } from '@/lib/session';
import '../../repertoire.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Repertoire' };

export default async function RepertoireIndex() {
  const user = await requirePageUser('/repertoire');
  const tz = await learnerTimezone();
  await syncDeck(user.id);
  const all = courses();
  const tallies = courseTallies(await deckFacts(user.id, endOfDay(tz)), all.map((o) => o.id));
  const rows = all.map((o) => ({ o, ...tallies.get(o.id)!, hero: courseCard(o, undefined).hero }));
  const started = rows.filter((r) => r.started);
  const rest = rows.filter((r) => !r.started);

  const list = (items: typeof rows) => (
    <div className="rep-index">
      {items.map(({ o, tally, hero }) => {
        const total = tallyTotal(tally);
        return (
          <Link key={o.id} href={`/repertoire/${o.id}`} className="card rep-card">
            <MiniBoard fen={hero.fen} flipped={o.orientation === 'black'} last={hero} />
            <span className="rep-card__body">
              <span className="rep-card__top">
                <h3>{o.name}</h3>
                {tally.weak ? (
                  <span className="rep-card__weak">
                    <WeakMark /> {tally.weak}
                  </span>
                ) : null}
              </span>
              <MemoryBar tally={tally} />
              <span className="muted small">
                {sideLabel(o.orientation)} · {total - tally.none} of {total} moves learned
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <main className="page">
      <header className="section">
        <span className="eyebrow">Repertoire</span>
        <h1>Everything you play, as a tree</h1>
        <p className="lead">
          Walk every line, branch and sideline a course teaches, and see at a glance which ones you remember and which are fading.
        </p>
        <LevelLegend />
      </header>
      {started.length ? (
        <section className="section" aria-label="Courses you’ve started">
          <h2 className="section__title">Your courses</h2>
          {list(started)}
        </section>
      ) : null}
      <section className="section" aria-label="Other courses">
        <h2 className="section__title">{started.length ? 'Not started yet' : 'All courses'}</h2>
        {list(rest)}
      </section>
    </main>
  );
}
