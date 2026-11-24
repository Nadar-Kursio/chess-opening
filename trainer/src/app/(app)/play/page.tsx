import Link from 'next/link';
import { Bolt, Shuffle, Swords, Trap } from '@/components/ui/icons';
import { courseCard, courses, isFeatured } from '@/lib/catalog';
import { getProgress } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';
import '../../play.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Play' };

export default async function PlayPage() {
  const user = await requirePageUser('/play');
  const progress = await getProgress(user.id);
  const cards = courses()
    .filter((o) => o.section !== 'traps')
    .map((o) => courseCard(o, progress.get(o.id)));
  const started = cards.filter((c) => c.progress.done > 0);
  // A newcomer still gets something to play: the repertoire the home page leads with.
  const listed = started.length ? started : cards.filter((c) => isFeatured(c.summary.id));

  return (
    <main className="page play">
      <header>
        <h1>Play</h1>
        <p className="muted">Put what you learned to work, against a clock or an opponent.</p>
      </header>

      <section className="play__modes" aria-label="Game modes">
        <Link href="/play/spar" className="card play-card play-card--spar">
          <span className="play-card__icon">
            <Swords size={28} />
          </span>
          <span className="eyebrow">Sparring</span>
          <b className="play-card__title">Play a club opponent</b>
          <span className="muted">
            They answer the way 1200 to 2000 players on Lichess do. Stay in your prep as long as you can.
          </span>
          <span className="btn btn--primary play-card__cta">Start a game</span>
        </Link>
        <Link href="/play/rush" className="card play-card play-card--rush">
          <span className="play-card__icon">
            <Bolt size={28} />
          </span>
          <span className="eyebrow">Opening Rush</span>
          <b className="play-card__title">Three minutes, three strikes</b>
          <span className="muted">Find as many of your moves as you can before the clock runs out.</span>
          <span className="btn btn--gold play-card__cta">Start a rush</span>
        </Link>
      </section>

      <section className="card">
        <h2>{started.length ? 'Practise your courses' : 'Practise a course'}</h2>
        <p className="muted small">Free practice: the opponent picks any line the course covers. Shuffle drills the lines in a random order.</p>
        <ul className="ways play__courses">
          {listed.map((c) => (
            <li key={c.summary.id} className="play__course">
              <Link href={`/openings/${c.summary.id}/practice`} className="way">
                <span className="way__icon way__icon--green">
                  <Swords size={20} />
                </span>
                <span>
                  <b>{c.summary.name}</b>
                </span>
              </Link>
              <Link href={`/openings/${c.summary.id}/shuffle`} className="way way--quiet" aria-label={`Shuffle drill, ${c.summary.name}`}>
                <span className="way__icon way__icon--blue">
                  <Shuffle size={20} />
                </span>
                <span className="play__shuffle">
                  <b>Shuffle</b>
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/#traps" className="way">
              <span className="way__icon way__icon--red">
                <Trap size={20} />
              </span>
              <span>
                <b>Traps</b>
                <span className="muted small">Short courses on the traps that win games quickly</span>
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
