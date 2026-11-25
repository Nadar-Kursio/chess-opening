import Link from 'next/link';
import Badge from '@/components/fun/Badge';
import { LevelRing } from '@/components/fun/LevelChip';
import QuestCard from '@/components/fun/QuestCard';
import Crown from '@/components/ui/Crown';
import { Trap } from '@/components/ui/icons';
import MasteryHelp, { MasteryHelpButton } from '@/components/ui/MasteryHelp';
import { learnedCrowns } from '@/lib/cards';
import { trapCourses } from '@/lib/catalog';
import { getOpening } from '@/lib/content';
import { CROWN_NAME, MAX_CROWN } from '@/lib/crowns';
import { syncFun } from '@/lib/fun';
import { getPlayRecord } from '@/lib/playRecord';
import { learnerTimezone } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';
import { GAME_MOVES_CAP, RANKS, XP, levelStart } from '@/lib/xp';
import '@/app/fun.css';
import '@/app/trapdex.css';
import '@/app/crowns.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Badges' };

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const formatDay = (day: string) => DATE.format(new Date(`${day}T12:00:00Z`));
const n = (x: number) => x.toLocaleString('en-GB');

export default async function AchievementsPage() {
  const user = await requirePageUser('/achievements');
  const [fun, play, crownsByCourse] = await Promise.all([
    syncFun(user.id),
    getPlayRecord(user.id),
    learnerTimezone().then((tz) => learnedCrowns(user.id, tz)),
  ]);
  const crownCourses = [...crownsByCourse].map(([id, crowns]) => {
    const op = getOpening(id);
    return { id, name: op.name, chapters: op.lines.map((l) => ({ slug: l.slug, name: l.name, level: crowns.get(l.slug)!.level })) };
  });
  const traps = trapCourses().length;
  const { level, badges, parts } = fun;
  const earned = badges.reduce((k, b) => k + b.tiers.filter((t) => t.unlocked).length, 0);
  const possible = badges.reduce((k, b) => k + b.tiers.length, 0);
  const nextRank = RANKS.find((r) => r.from > level.level);
  const topXp = Math.max(1, ...parts.map((p) => p.xp));

  return (
    <main className="page">
      <section className="card level-hero">
        <LevelRing level={level.level} share={level.share} big />
        <div className="level-hero__body">
          <span className="eyebrow">Level {level.level}</span>
          <h1>{level.name}</h1>
          <div
            className="bar bar--big level-hero__bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={level.span}
            aria-valuenow={level.into}
            aria-label="XP towards the next level"
          >
            <span style={{ width: `${Math.max(2, level.share * 100)}%` }} />
          </div>
          <p className="muted">
            <b className="level-hero__xp">{n(level.xp)} XP</b> · {n(level.span - level.into)} to level {level.level + 1}
            {nextRank ? ` · ${nextRank.name} at level ${nextRank.from}` : ''}
          </p>
        </div>
      </section>

      <div className="fun-layout">
        <section className="section" aria-labelledby="badges-title">
          <div className="section__head">
            <h2 className="section__title" id="badges-title">
              Badges
            </h2>
            <span className="muted">
              {earned} of {possible} earned
            </span>
          </div>
          <div className="badge-grid">
            {badges.map((b) => {
              const shown = b.top ?? b.tiers[0];
              return (
                <article key={b.def.id} className={`card badge-card${b.top ? '' : ' badge-card--locked'}`}>
                  <Badge emblem={b.def.emblem} tier={shown.tier} locked={!b.top} size="lg" />
                  <div className="badge-card__body">
                    <h3>{b.def.name}</h3>
                    {b.next ? (
                      <>
                        <p className="muted small">{b.next.label}</p>
                        <div className="badge-card__progress">
                          <span className="bar bar--thin" aria-hidden="true">
                            <span style={{ width: `${Math.max(3, b.share * 100)}%` }} />
                          </span>
                          <span className="badge-card__n">
                            {n(Math.min(b.value, b.next.goal))}/{n(b.next.goal)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="badge-card__maxed small">Every tier earned</p>
                    )}
                    <ol className="tiers" aria-label="Tiers">
                      {b.tiers.map((t) => (
                        <li
                          key={t.index}
                          className={`tier tier--${t.tier}${t.unlocked ? ' tier--on' : ''}`}
                          title={`${t.label}${t.at ? `: earned ${formatDay(t.at)}` : ''}`}
                        >
                          <span className="tier__dot" aria-hidden="true" />
                          <span className="tier__text">
                            {n(t.goal)}
                            {t.unlocked ? <span className="tier__when">{t.at ? formatDay(t.at) : 'Earned'}</span> : null}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="fun-side">
          <QuestCard userId={user.id} />

          <Link href="/traps/collection" className="card trapdex-link">
            <span className="trap-games__icon" aria-hidden="true">
              <Trap size={22} />
            </span>
            <span className="trapdex-link__text">
              <b>Trap collection</b>
              <span className="muted small">
                {play.sprung} of {traps} traps sprung in your games
              </span>
            </span>
            <span aria-hidden="true">→</span>
          </Link>

          <section className="card crown-card" aria-labelledby="crowns-title">
            <div className="crown-card__head">
              <h3 id="crowns-title">Chapter crowns</h3>
              <MasteryHelpButton className="mastery-sum__help">How mastery works</MasteryHelpButton>
            </div>
            {crownCourses.length ? (
              <ul className="crown-card__courses">
                {crownCourses.map((c) => (
                  <li key={c.id}>
                    <Link href={`/openings/${c.id}`} className="crown-card__course">
                      <span className="crown-card__name">
                        <b>{c.name}</b>
                        <span className="muted small">
                          {c.chapters.filter((ch) => ch.level === MAX_CROWN).length} of {c.chapters.length} mastered
                        </span>
                      </span>
                      <span className="crown-card__row">
                        {c.chapters.map((ch) => (
                          <Crown key={ch.slug} level={ch.level} size="sm" label={`${ch.name}: ${CROWN_NAME[ch.level]}`} />
                        ))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">Learn a chapter to earn its first crown. It grows as the moves settle into memory.</p>
            )}
          </section>

          <section className="card xp-card" aria-labelledby="xp-title">
            <h3 id="xp-title">Where your XP comes from</h3>
            {parts.length ? (
              <ul className="xp-parts">
                {parts.map((p) => (
                  <li key={p.label}>
                    <span className="xp-parts__label">{p.label}</span>
                    <span className="xp-parts__bar" aria-hidden="true">
                      <span style={{ width: `${Math.max(3, (p.xp / topXp) * 100)}%` }} />
                    </span>
                    <b>{n(p.xp)}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">Nothing yet. Find your first move and it starts counting.</p>
            )}
            <p className="muted small">
              {XP.move} XP for every move you find, in any mode. Finishing a chapter step, a perfect quiz, Recall answers, Rush
              points, quests and badges all add more. Each of your own games pays {XP.gameMove} XP a move in book (up to{' '}
              {GAME_MOVES_CAP}), {XP.gameEnd} for playing a line to its end and {XP.gameTrap} for springing a trap.
            </p>
          </section>

          <section className="card ranks" aria-labelledby="ranks-title">
            <h3 id="ranks-title">The ranks</h3>
            <ol className="ranks__list">
              {RANKS.map((r, i) => {
                const reached = level.level >= r.from;
                const current = reached && (RANKS[i + 1]?.from ?? Infinity) > level.level;
                return (
                  <li key={r.name} className={`rank${reached ? ' rank--on' : ''}${current ? ' rank--now' : ''}`}>
                    <span className="rank__lvl">{r.from}</span>
                    <span className="rank__name">{r.name}</span>
                    <span className="rank__xp">{n(levelStart(r.from))} XP</span>
                  </li>
                );
              })}
            </ol>
          </section>
        </aside>
      </div>
      <MasteryHelp />
    </main>
  );
}
