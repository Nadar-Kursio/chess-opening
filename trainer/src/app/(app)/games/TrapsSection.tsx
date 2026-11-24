import Link from 'next/link';
import MiniBoard from '@/components/ui/MiniBoard';
import { Trap } from '@/components/ui/icons';
import { getOpening } from '@/lib/content';
import { trapHome } from '@/lib/playRecord';
import type { LineProgress } from '@/lib/course';
import type { TrapOutcome } from '@/lib/gameTraps';
import { metEntries, type TrapEntry, type TrapTally } from '@/lib/trapAlbum';
import { trapTitle, trapView } from '@/lib/traps';
import { plural } from './parts';

/* "Traps in your games": every trap course whose bait one of the learner's games reached, with how
   it went. Where it belongs to a course the learner studies, its links are that course's (the
   build's trap relation): the defence the course teaches, or the trap course from the setter's side. */

const OUTCOME_LABEL: Record<TrapOutcome, string> = {
  sprung: 'Sprung by you',
  caught: 'Sprung on you',
  dodged: 'Dodged',
};

type Progress = Map<string, Map<string, LineProgress>>;

function nextStep(e: TrapEntry, studied: Set<string>, progress: Progress) {
  const home = trapHome(e.id, studied);
  const trapOp = getOpening(e.id);
  const view = home ? trapView(home.course, home.link, trapOp, progress.get(e.id) ?? new Map(), progress.get(home.course.id) ?? new Map()) : null;
  if (e.events.caught.length) {
    if (view?.defence) return { href: view.primary.href, label: view.primary.label };
    return { href: `/openings/${e.id}`, label: 'See how to avoid it' };
  }
  if (e.events.sprung.length && !e.punishedAll && e.bait) {
    const learned = !!progress.get(e.id)?.get(e.bait.line)?.learned_at;
    return { href: `/openings/${e.id}/${e.bait.line}/${learned ? 'drill' : 'learn'}`, label: learned ? 'Drill the follow-up' : 'Learn the follow-up' };
  }
  return { href: `/openings/${e.id}`, label: 'Open the trap course' };
}

function Score({ t }: { t: TrapTally }) {
  const games = t.win + t.draw + t.loss;
  if (!games) return null;
  return (
    <span className="trap-meet__score">
      {t.win ? <span className="trap-meet__w">{t.win}W</span> : null}
      {t.draw ? <span className="trap-meet__d">{t.draw}D</span> : null}
      {t.loss ? <span className="trap-meet__l">{t.loss}L</span> : null}
    </span>
  );
}

export default function TrapsSection({
  entries,
  studied,
  progress,
  total,
  date,
}: {
  entries: TrapEntry[];
  studied: Set<string>;
  progress: Progress;
  /** Trap courses in the collection. */
  total: number;
  date: (d: Date) => string;
}) {
  const met = metEntries(entries);
  const count = (o: TrapOutcome) => met.reduce((n, e) => n + e.events[o].length, 0);
  const collected = entries.filter((e) => e.events.sprung.length).length;
  return (
    <section className="card trap-games" aria-labelledby="trap-games-title">
      <header className="trap-games__head">
        <span className="trap-games__icon" aria-hidden="true">
          <Trap size={22} />
        </span>
        <div className="trap-games__titles">
          <h2 id="trap-games-title">Traps in your games</h2>
          <span className="muted small">From your imported games and your sparring games, by position, so any move order counts.</span>
        </div>
        <Link href="/traps/collection" className="btn btn--secondary btn--sm">
          Collection {collected}/{total}
        </Link>
      </header>

      {met.length ? (
        <>
          <ul className="trap-games__totals">
            {(['sprung', 'caught', 'dodged'] as const).map((o) => (
              <li key={o} className={`trap-total trap-total--${o}`}>
                <b>{count(o)}</b>
                <span>{OUTCOME_LABEL[o]}</span>
              </li>
            ))}
          </ul>
          <ul className="trap-meets">
            {met.map((e) => {
              const step = nextStep(e, studied, progress);
              const last = [...e.events.sprung, ...e.events.caught, ...e.events.dodged].sort((a, b) => b.at.getTime() - a.at.getTime())[0];
              const home = trapHome(e.id, studied);
              return (
                <li key={e.id} className="trap-meet">
                  {e.bait ? (
                    <div className="trap-meet__board">
                      <MiniBoard fen={e.bait.fen} flipped={e.setter === 'black'} last={e.bait} />
                    </div>
                  ) : null}
                  <div className="trap-meet__body">
                    <h3>{trapTitle(e.name)}</h3>
                    <span className="muted small">
                      The bait: <b className="move">{e.bait?.num}</b>
                      {home ? ` · in your ${home.course.name}` : ''}
                    </span>
                    <ul className="trap-meet__outcomes">
                      {(['sprung', 'caught', 'dodged'] as const)
                        .filter((o) => e.events[o].length)
                        .map((o) => (
                          <li key={o} className={`trap-pill trap-pill--${o}`}>
                            {OUTCOME_LABEL[o]} {e.events[o].length}×
                            <Score t={e.results[o]} />
                          </li>
                        ))}
                    </ul>
                    {e.events.sprung.length && !e.punishedAll ? (
                      <p className="trap-meet__note small">They took the bait, but you didn’t always find {e.bait?.punish?.num}.</p>
                    ) : null}
                    <div className="trap-meet__foot">
                      <Link href={step.href} className="btn btn--secondary btn--sm">
                        {step.label}
                      </Link>
                      {last.game ? (
                        <Link href={`/games/${last.game.site}/${last.game.id}`} className="link-btn">
                          Last: vs {last.game.opponent}, {date(last.at)}
                        </Link>
                      ) : (
                        <span className="muted small">Last: sparring, {date(last.at)}</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="muted">
          None of your games has reached a trap yet. {plural(total, 'trap')} are waiting in the collection, each with the move that
          springs it.
        </p>
      )}
    </section>
  );
}
