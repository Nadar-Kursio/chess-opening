import Link from 'next/link';
import Badge from '@/components/fun/Badge';
import MiniBoard from '@/components/ui/MiniBoard';
import { Trap } from '@/components/ui/icons';
import { trapCourses } from '@/lib/catalog';
import { getOpening } from '@/lib/content';
import { chapters, courseProgress, type LineProgress } from '@/lib/course';
import { syncFun } from '@/lib/fun';
import { getPlayRecord, trapHome } from '@/lib/playRecord';
import { getProgress, learnerTimezone } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';
import { trapEntries, type TrapEntry } from '@/lib/trapAlbum';
import { trapTitle } from '@/lib/traps';
import '@/app/fun.css';
import '@/app/trapdex.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Trap collection' };

const times = (n: number) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);

export default async function TrapCollectionPage() {
  const user = await requirePageUser('/traps/collection');
  const [record, progress, tz, fun] = await Promise.all([getPlayRecord(user.id), getProgress(user.id), learnerTimezone(), syncFun(user.id)]);
  const entries = trapEntries(
    trapCourses().map((o) => getOpening(o.id)),
    record.traps,
  );
  const studied = new Set(progress.keys());
  const date = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: tz });
  const collected = entries.filter((e) => e.events.sprung.length);
  const badge = fun.badges.find((b) => b.def.id === 'traps');
  const share = entries.length ? collected.length / entries.length : 0;

  return (
    <main className="page trapdex">
      <section className="card trapdex-hero">
        <span className="trapdex-hero__icon" aria-hidden="true">
          <Trap size={28} />
        </span>
        <div className="trapdex-hero__body">
          <span className="eyebrow">Your games</span>
          <h1>Trap collection</h1>
          <p className="lead">
            Every trap ChessLab teaches has a slot. Spring one in a rated game or a sparring game and the card is yours, with the date
            and how often you’ve caught someone with it.
          </p>
          <div className="trapdex-hero__progress">
            <div className="bar bar--big bar--gold" role="progressbar" aria-valuemin={0} aria-valuemax={entries.length} aria-valuenow={collected.length} aria-label="Traps sprung">
              <span style={{ width: `${Math.max(2, share * 100)}%` }} />
            </div>
            <span>
              <b>
                {collected.length} of {entries.length}
              </b>{' '}
              sprung
            </span>
          </div>
        </div>
        {badge ? (
          <Link href="/achievements" className="trapdex-hero__badge" title={badge.next?.label ?? 'Every tier earned'}>
            <Badge emblem={badge.def.emblem} tier={(badge.top ?? badge.tiers[0]).tier} locked={!badge.top} size="lg" />
            <span className="small">
              <b>{badge.def.name}</b>
              <span className="muted">{badge.next ? badge.next.label : 'Every tier earned'}</span>
            </span>
          </Link>
        ) : null}
      </section>

      <ol className="trapdex-grid">
        {entries.map((e) => (
          <Slot key={e.id} e={e} date={date} studied={studied} progress={progress.get(e.id)} />
        ))}
      </ol>

      <p className="muted small trapdex-foot">
        A trap counts as sprung when your opponent plays the bait move, by any move order. Import games on{' '}
        <Link href="/games">Your games</Link> or <Link href="/play/spar">spar a club opponent</Link> to fill the album.
      </p>
    </main>
  );
}

function Slot({
  e,
  date,
  studied,
  progress,
}: {
  e: TrapEntry;
  date: (d: Date) => string;
  studied: Set<string>;
  progress: Map<string, LineProgress> | undefined;
}) {
  const sprung = e.events.sprung;
  const got = sprung.length > 0;
  const op = getOpening(e.id);
  const p = courseProgress(chapters(op), progress ?? new Map());
  const home = trapHome(e.id, studied);
  const side = e.setter === 'white' ? 'White' : 'Black';
  const sparred = sprung.filter((x) => x.source === 'spar').length;
  return (
    <li className={`card trap-slot${got ? ' trap-slot--got' : ''}`}>
      <div className="trap-slot__board">
        {e.bait ? <MiniBoard fen={e.bait.fen} flipped={e.setter === 'black'} last={e.bait} /> : null}
        {sprung.length > 1 ? <span className="trap-slot__count">×{sprung.length}</span> : null}
      </div>
      <div className="trap-slot__body">
        <h2>{trapTitle(e.name)}</h2>
        {got ? (
          <>
            <p className="small">
              Sprung {times(sprung.length)}
              {sparred ? `, ${sparred === sprung.length ? 'all' : sparred} in sparring` : ''}.
            </p>
            <p className="muted small">
              {sprung.length > 1 ? `First ${date(e.first!)} · last ${date(e.last!)}` : date(e.first!)}
            </p>
          </>
        ) : (
          <>
            <p className="small">
              Play {side} and wait for <b className="move">{e.bait?.num}</b>.
            </p>
            <p className="muted small">
              {p.done ? `${p.pct}% of the trap course done` : home ? `It comes up in the ${home.course.name}.` : 'Learn it first, then set it.'}
            </p>
          </>
        )}
        {e.events.caught.length ? <p className="trap-slot__caught small">It caught you {times(e.events.caught.length)}.</p> : null}
        <Link href={`/openings/${e.id}`} className={`btn btn--sm ${got ? 'btn--ghost' : 'btn--secondary'}`}>
          {got ? 'Practise it' : p.done ? 'Keep learning it' : 'Learn to set it'}
        </Link>
      </div>
    </li>
  );
}
