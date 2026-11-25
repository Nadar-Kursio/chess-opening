import Link from 'next/link';
import { Face } from '@/components/session/SparParts';
import MiniBoard from '@/components/ui/MiniBoard';
import { Play } from '@/components/ui/icons';
import { courses, sideLabel } from '@/lib/catalog';
import { getClub, getOpening } from '@/lib/content';
import { lineSide, sidesTaught } from '@/lib/course';
import { requirePageUser } from '@/lib/session';
import { OPPONENTS } from '@/lib/spar';
import { getSparRecords } from '@/lib/sparBests';
import '../../../spar.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sparring' };

export default async function SparHub() {
  const user = await requirePageUser('/play/spar');
  const { bests, played } = await getSparRecords(user.id);
  const games = (n: number) => n.toLocaleString('en-GB');

  const rows = courses().flatMap((o) => {
    const club = getClub(o.id);
    if (!club) return [];
    const op = getOpening(o.id);
    const sides = sidesTaught(op);
    return sides.map((side) => {
      const line = op.lines.find((l) => lineSide(op, l) === side) ?? op.lines[0];
      const hero = line.plies[Math.min(line.plies.length - 1, side === 'white' ? 5 : 6)];
      return {
        key: `${o.id}|${side}`,
        href: sides.length > 1 ? `/play/spar/${o.id}?side=${side}` : `/play/spar/${o.id}`,
        name: o.name,
        side,
        hero,
        best: bests.get(`${o.id}|${side}`) ?? 0,
        played: played.get(o.id) ?? 0,
        club,
      };
    });
  });
  const sample = rows[0]?.club;

  return (
    <main className="page">
      <section className="spar-hero">
        <div className="spar-hero__text">
          <span className="eyebrow">Play</span>
          <h1>Sparring partner</h1>
          <p className="lead">
            Play your opening against a club opponent who moves the way real club players do. The common lines come up most, and
            you find out where your prep runs out.
          </p>
        </div>
        <div className="spar-hero__faces" aria-hidden="true">
          {OPPONENTS.map((o) => (
            <Face key={o.id} id={o.id} size="lg" />
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Pick a course</h2>
        {rows.length ? (
          <div className="grid-cards spar-grid">
            {rows.map((r) => (
              <Link key={r.key} href={r.href} className="card spar-card">
                <div className="spar-card__board">
                  <MiniBoard fen={r.hero.fen} flipped={r.side === 'black'} last={r.hero} />
                </div>
                <div className="spar-card__body">
                  <h3>{r.name}</h3>
                  <span className="muted small">{sideLabel(r.side)}</span>
                  <span className={r.best ? 'spar-card__best' : 'spar-card__best spar-card__best--none'}>
                    {r.best ? `Best: ${r.best} ${r.best === 1 ? 'move' : 'moves'} in book` : 'Not played yet'}
                  </span>
                  {r.played ? (
                    <span className="muted small">
                      {r.played} {r.played === 1 ? 'game' : 'games'} played
                    </span>
                  ) : null}
                  <span className="btn btn--primary btn--sm spar-card__go">
                    <Play size={16} /> Play
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">No course has club data yet.</p>
        )}
      </section>

      <section className="section">
        <h2 className="section__title">How it works</h2>
        <ul className="spar-rules">
          <li>
            <b>Three lives.</b> A move that isn’t the course’s costs one. Where the engine rates your move as good too, it costs nothing.
          </li>
          <li>
            <b>Stay in book.</b> Your score is how many of your moves you play before the game leaves the course.
          </li>
          <li>
            <b>Every answer counts.</b> The moves you find go into Recall like any other session.
          </li>
        </ul>
        {sample ? (
          <p className="muted small spar-source">
            Moves come from {sample.source}, players rated {sample.elo[0]} to {sample.elo[1]}, bullet left out:{' '}
            {games(sample.scanned)} games.
          </p>
        ) : null}
      </section>
    </main>
  );
}
