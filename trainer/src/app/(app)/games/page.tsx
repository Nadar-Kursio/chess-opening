import Link from 'next/link';
import { Play, Swords } from '@/components/ui/icons';
import { trapCourses } from '@/lib/catalog';
import { getOpening } from '@/lib/content';
import { REIMPORT_MS, loadReport } from '@/lib/gameImport';
import { SITES } from '@/lib/gameSources';
import { SITE_NAME, depthOf, practiceKeys, scorePct, type CourseReport, type Departure, type Forgotten, type Matched } from '@/lib/games';
import { playFrom, sparTraps } from '@/lib/playRecord';
import { getProgress, learnerTimezone } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';
import { trapEntries } from '@/lib/trapAlbum';
import Accounts, { type AccountView } from './Accounts';
import { PositionBoard, ResultChip, TallyBar, movesText, plural, sideName, teachLink } from './parts';
import TrapsSection from './TrapsSection';
import '../../games.css';
import '../../trapdex.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your games' };

const FORGOTTEN_SHOWN = 6;
const DEPARTURES_SHOWN = 6;
/** Games each side of the comparison needs before a difference in score means anything. */
const INSIGHT_GAMES = 3;

function ago(at: Date, now: number) {
  const minutes = Math.round((now - at.getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default async function GamesPage() {
  const user = await requirePageUser('/games');
  const [{ accounts, report, matched, studied }, tz, spar, progress] = await Promise.all([
    loadReport(user.id),
    learnerTimezone(),
    sparTraps(user.id),
    getProgress(user.id),
  ]);
  const play = playFrom(matched, studied, spar);
  const trapOps = trapCourses().map((o) => getOpening(o.id));
  const entries = trapEntries(trapOps, play.traps);
  const now = Date.now();
  const views: AccountView[] = SITES.map((site) => {
    const a = accounts.find((x) => x.site === site);
    const waited = a?.imported_at ? now - a.imported_at.getTime() : Infinity;
    return {
      site,
      name: SITE_NAME[site],
      username: a?.username ?? null,
      games: matched.filter((m) => m.game.site === site).length,
      importedAgo: a?.imported_at ? ago(a.imported_at, now) : null,
      waitMinutes: waited < REIMPORT_MS ? Math.ceil((REIMPORT_MS - waited) / 60_000) : 0,
    };
  });
  const date = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: tz });

  const mine = report.courses.filter((c) => c.studied);
  const suggested = report.courses.filter((c) => !c.studied);
  const inPrep = mine.reduce((n, c) => n + c.games.length, 0);
  const practice = practiceKeys(report);
  const left = mine.reduce((n, c) => n + c.left.games, 0);
  const plies = mine.reduce((n, c) => n + c.games.reduce((k, m) => k + depthOf(m.walk!), 0), 0);

  return (
    <main className="page games">
      <section className="card games-hero">
        <div className="games-hero__body">
          <span className="eyebrow">
            <Swords size={16} /> Your games
          </span>
          {!report.games ? (
            <>
              <h1>How do your games compare with your prep?</h1>
              <p className="lead">
                Link your Lichess or Chess.com account. ChessLab reads your last 100 rated games and shows where each one left your
                courses: the moves you forgot, the replies you weren’t ready for, and how you score in each case.
              </p>
            </>
          ) : inPrep ? (
            <>
              <h1>
                {inPrep} of {plural(report.games, 'game')} reached your prep
              </h1>
              <p className="lead">
                {left
                  ? `You left the course yourself in ${plural(left, 'game')}. ${practice.length ? 'Those moves are worth a few minutes now, while the games are fresh.' : 'Learn the chapters that teach those moves and they join your practice here.'}`
                  : 'You played your moves every time the course had one. Your opponents did all the leaving.'}
              </p>
              {practice.length ? (
                <Link href="/games/practice" className="btn btn--primary btn--lg">
                  <Play size={18} /> Practise {practice.length > 20 ? 'the 20 you missed most' : plural(practice.length, 'position')}
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <h1>None of your {plural(report.games, 'game')} reached a course you study yet</h1>
              <p className="lead">
                {suggested.length
                  ? 'Some of them follow courses ChessLab teaches. Start one and your next import shows how your games compare.'
                  : 'Start a course for the openings you play, and your next import shows how your games compare.'}
              </p>
            </>
          )}
          {play.xp ? (
            <Link href="/achievements" className="games-xp">
              <span>
                <b>+{play.xp.toLocaleString('en-GB')} XP</b> from your games
              </span>
              <span className="muted small">
                Earned by {plural(play.paid, 'game')}: moves in book, lines played to the end, traps sprung
              </span>
            </Link>
          ) : null}
        </div>
        {inPrep ? (
          <div className="games-hero__stats">
            <div className="games-stat">
              <b>{Math.round((plies / inPrep / 2) * 10) / 10}</b>
              <span>moves in book, on average</span>
            </div>
            <div className="games-stat games-stat--red">
              <b>{practice.length}</b>
              <span>positions to practise</span>
            </div>
          </div>
        ) : null}
        <Accounts accounts={views} />
      </section>

      {report.games || play.traps.length ? (
        <TrapsSection entries={entries} studied={studied} progress={progress} total={trapOps.length} date={date} />
      ) : null}

      {mine.map((c) => (
        <CourseSection key={`${c.openingId}|${c.side}`} c={c} date={date} />
      ))}

      {suggested.length ? (
        <section className="section" aria-label="Courses that follow your games">
          <h2 className="section__title">Courses that follow your games</h2>
          <p className="muted">Openings you already play that ChessLab teaches. You haven’t started these yet.</p>
          <div className="games-suggest">
            {suggested.map((c) => (
              <Link key={`${c.openingId}|${c.side}`} href={`/openings/${c.openingId}`} className="card games-suggest__card">
                <span className={`pawn pawn--${c.side}`} aria-hidden="true">
                  <img src={`/pieces/${c.side === 'white' ? 'w' : 'b'}P.svg`} alt="" />
                </span>
                <span className="games-suggest__text">
                  <b>{c.name}</b>
                  <span className="muted small">
                    {plural(c.games.length, 'game')} as {sideName(c.side)} · {movesText(c.depth)} in book on average
                  </span>
                </span>
                <span className="btn btn--secondary btn--sm">Start</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {report.elsewhere.length ? (
        <section className="section" aria-label="Not in any course">
          <h2 className="section__title">Not in any course yet</h2>
          <p className="muted">
            {plural(report.elsewhere.reduce((n, e) => n + e.games, 0), 'game')} went somewhere ChessLab doesn’t teach, named the way the
            site names them.
          </p>
          <ul className="games-elsewhere">
            {report.elsewhere.map((e) => (
              <li key={e.name} className="chip">
                {e.name} <span className="muted">{e.games}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function CourseSection({ c, date }: { c: CourseReport; date: (d: Date) => string }) {
  const op = getOpening(c.openingId);
  const forgotten = c.forgotten.slice(0, FORGOTTEN_SHOWN);
  const departures = c.departures.slice(0, DEPARTURES_SHOWN);
  const toPractise = c.forgotten.filter((f) => f.learnedAt).length;
  const gap = c.knew.games >= INSIGHT_GAMES && c.left.games >= INSIGHT_GAMES ? scorePct(c.knew) - scorePct(c.left) : 0;
  return (
    <section className="card games-course" aria-label={`${c.name} as ${sideName(c.side)}`}>
      <header className="games-course__head">
        <span className={`pawn pawn--${c.side}`} aria-hidden="true">
          <img src={`/pieces/${c.side === 'white' ? 'w' : 'b'}P.svg`} alt="" />
        </span>
        <div className="games-course__titles">
          <h2>
            <Link href={`/openings/${c.openingId}`}>{c.name}</Link>
          </h2>
          <span className="muted small">
            {plural(c.games.length, 'game')} as {sideName(c.side)} · {movesText(c.depth)} in book on average
          </span>
        </div>
        {toPractise ? (
          <Link href={`/games/practice?course=${c.openingId}`} className="btn btn--primary btn--sm">
            <Play size={16} /> Practise {toPractise}
          </Link>
        ) : null}
      </header>

      <div className="games-course__tallies">
        <TallyBar tally={c.knew} label="When you knew your moves" />
        <TallyBar tally={c.left} label="When you left the course" />
      </div>
      {gap ? (
        <p className="games-course__insight">
          {gap > 0
            ? `You score ${gap} points more when you stay in book. Every move you remember counts.`
            : `You score ${-gap} points more after leaving the course, so your misses aren’t costing you games yet.`}
        </p>
      ) : null}

      {forgotten.length ? (
        <div className="games-block">
          <h3>Where you left the course</h3>
          <div className="forgot-list">
            {forgotten.map((f) => (
              <ForgotCard key={f.key} f={f} c={c} lines={op.lines} />
            ))}
          </div>
          {c.forgotten.length > forgotten.length ? (
            <p className="muted small">And {plural(c.forgotten.length - forgotten.length, 'more position')}, each met once or twice.</p>
          ) : null}
        </div>
      ) : (
        <p className="games-course__clean">You never left the course yourself in these games.</p>
      )}

      {departures.length ? (
        <div className="games-block">
          <h3>Where your opponents left it</h3>
          <ul className="dep-list">
            {departures.map((d) => (
              <DepartureRow key={`${d.key}${d.san}`} d={d} c={c} />
            ))}
          </ul>
        </div>
      ) : null}

      <details className="games-block games-list">
        <summary>
          <h3>The games</h3>
          <span className="muted small">{plural(c.games.length, 'game')}, newest first</span>
        </summary>
        <ul>
          {c.games.map((m) => (
            <GameRow key={`${m.game.site}${m.game.id}`} m={m} date={date} />
          ))}
        </ul>
      </details>
    </section>
  );
}

function ForgotCard({ f, c, lines }: { f: Forgotten; c: CourseReport; lines: { slug: string }[] }) {
  const main = f.course[0];
  const learn = teachLink(c.openingId, f, lines);
  return (
    <article className="forgot">
      <div className="forgot__top">
        <PositionBoard
          fen={f.fen}
          side={c.side}
          course={main.arrow}
          played={f.played.arrow}
          label={`The course plays ${main.num}; you played ${f.instead[0].num}`}
        />
        <div className="forgot__head">
          <span className="forgot__times">{f.times}×</span>
          <span>
            The course plays <b className="move move--good">{f.course.map((x) => x.num).join(' or ')}</b>
          </span>
          <span className="forgot__instead">
            You played{' '}
            {f.instead.map((i, k) => (
              <span key={i.num}>
                {k ? ', ' : ''}
                <b className="move move--bad">{i.num}</b>
                {i.times > 1 ? ` ${i.times}×` : ''}
              </span>
            ))}
          </span>
        </div>
      </div>
      {f.verdict ? (
        <p className={`forgot__verdict forgot__verdict--${f.verdict.sev}`}>
          <b>{f.verdict.title}</b> {f.verdict.text}
        </p>
      ) : f.authored ? (
        <p className="forgot__verdict" dangerouslySetInnerHTML={{ __html: f.authored.why }} />
      ) : null}
      <div className="forgot__foot">
        {f.forgot ? (
          <span className="chip chip--recall">In Recall</span>
        ) : f.learnedAt ? (
          <span className="chip">Learned since</span>
        ) : (
          <span className="chip chip--new">Not learned yet</span>
        )}
        {!f.learnedAt && learn ? (
          <Link href={learn.href} className="btn btn--secondary btn--sm" title={learn.name}>
            {learn.label}
          </Link>
        ) : null}
        <Link href={`/games/${f.games[0].site}/${f.games[0].id}`} className="link-btn">
          See the game
        </Link>
      </div>
    </article>
  );
}

const DEP_LABEL: Record<Departure['kind'], string> = {
  branch: 'Answered in the course',
  sideline: 'Sideline to learn',
  uncovered: 'Not covered yet',
};

function DepartureRow({ d, c }: { d: Departure; c: CourseReport }) {
  const cover = d.kind === 'uncovered' && d.cover ? getOpening(d.cover) : null;
  return (
    <li className={`dep dep--${d.kind}`}>
      <span className="dep__num">{d.num}</span>
      <span className="dep__text">
        <span className="dep__label">
          {DEP_LABEL[d.kind]}
          {d.name ? <span className="muted"> · {d.name}</span> : null}
        </span>
        <span className="muted small">
          {plural(d.times, 'game')} · you scored {scorePct(d.results)}%
          {cover ? ` · the ${cover.name} course covers it` : ''}
        </span>
      </span>
      {d.kind === 'sideline' && d.slug ? (
        <Link href={`/openings/${c.openingId}/${d.slug}/learn`} className="btn btn--secondary btn--sm">
          Learn
        </Link>
      ) : cover ? (
        <Link href={`/openings/${cover.id}`} className="btn btn--ghost btn--sm">
          See course
        </Link>
      ) : null}
    </li>
  );
}

const OUTCOME: Record<NonNullable<Matched['walk']>['outcome'], (m: Matched) => string> = {
  you: (m) => `You left at ${m.deviation?.played.num}`,
  them: (m) => `They left at ${m.walk!.met?.num}`,
  end: (m) => `In book to the course’s end, ${movesText(depthOf(m.walk!))}`,
  over: () => 'Finished in book',
};

function GameRow({ m, date }: { m: Matched; date: (d: Date) => string }) {
  const w = m.walk!;
  return (
    <li>
      <Link href={`/games/${m.game.site}/${m.game.id}`} className="game-row">
        <ResultChip result={m.game.result} />
        <span className="game-row__who">
          <b>
            {m.game.opponent}
            {m.game.opponentRating ? <span className="muted"> ({m.game.opponentRating})</span> : null}
          </b>
          <span className="muted small">
            {date(m.game.playedAt)} · {m.game.speed} · {SITE_NAME[m.game.site]}
          </span>
        </span>
        <span className={`game-row__exit game-row__exit--${w.outcome}`}>{OUTCOME[w.outcome](m)}</span>
      </Link>
    </li>
  );
}
