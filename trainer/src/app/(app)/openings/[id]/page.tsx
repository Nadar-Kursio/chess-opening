import Link from 'next/link';
import { notFound } from 'next/navigation';
import MiniBoard from '@/components/ui/MiniBoard';
import { Book, Brain, Check, Flame, Play, Question, Retry, Shuffle, Swords, Target, Trap } from '@/components/ui/icons';
import { courseCard, sideLabel } from '@/lib/catalog';
import { getCatalog, getClub, getOpening, hasOpening } from '@/lib/content';
import {
  STEP_INFO,
  STEP_KINDS,
  punishQuestions,
  sidesTaught,
  stepDone,
  type StepKind,
} from '@/lib/course';
import { courseMemory, endOfDay, syncDeck } from '@/lib/cards';
import { getProgress, getPulse, learnerTimezone } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';
import { trapChip, trapView } from '@/lib/traps';
import Overview from '@/components/lesson/Overview';
import WinBar from '@/components/ui/WinBar';
import Crown, { crownWords } from '@/components/ui/Crown';
import { CROWN_LABEL, crownSummary } from '@/lib/crowns';
import '@/app/crowns.css';
import ResetCourse from './ResetCourse';
import Sidelines from './Sidelines';
import Traps from './Traps';
import '@/app/traps.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/openings/[id]'>) {
  const { id } = await params;
  return { title: hasOpening(id) ? getOpening(id).name : 'Opening' };
}

const STEP_ICON: Record<StepKind, React.ReactNode> = {
  learn: <Book size={20} />,
  drill: <Target size={20} />,
  recall: <Brain size={20} />,
  quiz: <Question size={20} />,
};

export default async function CoursePage({ params }: PageProps<'/openings/[id]'>) {
  const { id } = await params;
  if (!hasOpening(id)) notFound();
  const user = await requirePageUser(`/openings/${id}`);
  const op = getOpening(id);
  const summary = getCatalog().openings.find((o) => o.id === id)!;
  const [progress, pulse, tz] = await Promise.all([getProgress(user.id), getPulse(user.id), learnerTimezone(), syncDeck(user.id)]);
  const byLine = progress.get(id) ?? new Map();
  const learned = new Set([...byLine.values()].filter((l) => l.learned_at).map((l) => l.line_slug));
  const { due, chapters: memory } = await courseMemory(user.id, id, endOfDay(tz), learned);
  const card = courseCard(summary, byLine);
  const { progress: p, chapters: chs } = card;
  const sides = sidesTaught(op);
  const sparrable = getClub(id) !== null;
  const punish = punishQuestions(op, op.orientation).length;
  const games = getCatalog().games.filter((g) => g.op === id);
  const sidelines = op.sidelines;
  const crowns = chs.map((ch) => memory.get(ch.slug)!.crown);
  const crownSum = crownSummary(crowns);
  const traps = (op.traps ?? []).map((t) => trapView(op, t, getOpening(t.id), progress.get(t.id) ?? new Map(), byLine));
  const parents = (op.partOf ?? []).filter(hasOpening).map((pid) => ({ id: pid, name: getOpening(pid).name }));
  const nextHref = p.next ? `/openings/${id}/${p.next.slug}/${p.next.step}` : null;

  return (
    <main className="page">
      <Link href="/" className="back-link">
        ← All openings
      </Link>

      <section className="card course-hero">
        <div className="course-hero__body">
          {parents.map((parent) => (
            <Link key={parent.id} href={`/openings/${parent.id}#trap-${id}`} className="trap-parent">
              <Trap size={16} /> Part of your {parent.name} repertoire
            </Link>
          ))}
          <div className="chips">
            <span className={`chip chip--side-${op.orientation}`}>
              <img src={`/pieces/${op.orientation === 'white' ? 'w' : 'b'}P.svg`} alt="" />
              {sideLabel(op.orientation)}
            </span>
            <span className="chip">{op.eco}</span>
            <span className="chip">{op.level}</span>
          </div>
          <h1>{op.name}</h1>
          <p className="lead">{op.tagline}</p>
          <div className="course-hero__progress">
            <div className="bar bar--big" role="progressbar" aria-valuenow={p.pct} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${Math.max(2, p.pct)}%` }} />
            </div>
            <div className="course-hero__nums">
              <b>{p.pct}% complete</b>
              <span className="muted">
                {p.done} of {p.total} steps · {p.chaptersDone} of {chs.length} chapters mastered
              </span>
            </div>
            <div className="crown-sum" aria-label={`Crowns: ${crownSum.levels} of ${crownSum.possible} levels`}>
              <ol className="crown-sum__row">
                {chs.map((ch, i) => (
                  <li key={ch.slug} title={`${ch.name}. ${crownWords(crowns[i])}`}>
                    <Crown crown={crowns[i]} size="sm" />
                  </li>
                ))}
              </ol>
              <span className="crown-sum__text">
                <b>
                  {crownSum.levels}/{crownSum.possible}
                </b>{' '}
                crown levels
                {crownSum.full ? ` · ${crownSum.full} full crown${crownSum.full === 1 ? '' : 's'}` : ''}
                {crownSum.fading ? <span className="crown-sum__fading"> · {crownSum.fading} fading</span> : null}
              </span>
            </div>
          </div>
          <div className="course-hero__actions">
            {nextHref && p.next ? (
              <Link href={nextHref} className="btn btn--primary btn--lg">
                <Play size={18} /> {p.done ? 'Continue' : 'Start'}: {STEP_INFO[p.next.step].label}
              </Link>
            ) : (
              <span className="btn btn--gold btn--lg">
                <Check size={18} /> Course complete
              </span>
            )}
            <Link href={`/openings/${id}/practice?side=${sides[0]}`} className="btn btn--secondary btn--lg">
              <Swords size={18} /> Free practice
            </Link>
          </div>
        </div>
        <div className="course-hero__board">
          <MiniBoard fen={card.hero.fen} flipped={op.orientation === 'black'} last={card.hero} />
        </div>
      </section>

      <Overview
        op={{ orientation: op.orientation, theory: op.theory, progression: op.progression, lesson: op.lesson }}
      />

      <div className="course-layout">
        <section className="chapters" aria-label="Chapters">
          <h2 className="section__title">Chapters</h2>
          {chs.map((ch) => {
            const lp = byLine.get(ch.slug);
            const allDone = STEP_KINDS.every((k) => stepDone(lp, k));
            const firstGap = STEP_KINDS.find((k) => !stepDone(lp, k));
            const isNext = p.next?.slug === ch.slug;
            const crown = memory.get(ch.slug)!.crown;
            return (
              <article key={ch.slug} className={`card chapter${isNext ? ' chapter--next' : ''}${allDone ? ' chapter--done' : ''}`}>
                <div className="chapter__head">
                  <span className="chapter__num">{allDone ? <Check size={18} /> : ch.index + 1}</span>
                  <div className="chapter__titles">
                    <h3>{ch.name}</h3>
                    <div className="chapter__meta">
                      {ch.side !== op.orientation ? (
                        <span className={`chip chip--side-${ch.side}`}>Taught as {ch.side === 'white' ? 'White' : 'Black'}</span>
                      ) : null}
                      {ch.tier ? <span className="chip chip--tier">{ch.tier}</span> : null}
                      {traps
                        .filter((t) => t.trap.chapter === ch.slug)
                        .map((t) => (
                          <a key={t.trap.id} href={`#trap-${t.trap.id}`} className={`chip trap-chip trap-chip--${t.trap.group}`}>
                            <Trap size={14} /> {trapChip(t.trap)}
                          </a>
                        ))}
                      <span className="muted small">{ch.yourMoves} moves to learn</span>
                      {lp?.clean_runs ? <span className="muted small">· {lp.clean_runs} clean run{lp.clean_runs === 1 ? '' : 's'}</span> : null}
                      {memory.get(ch.slug)?.mastered ? (
                        <span className="muted small" title="Moves Recall now asks at gaps of three weeks or more">
                          · {memory.get(ch.slug)!.mastered}/{memory.get(ch.slug)!.total} in long-term memory
                        </span>
                      ) : null}
                      {crown.level < crown.earned ? (
                        <Link href={`/recall/session?course=${id}`} className="chip chip--fading">
                          Fading: {crown.overdue} overdue
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <span className="chapter__crown" title={crownWords(crown)}>
                    <Crown crown={crown} label={crownWords(crown)} />
                    <span className="chapter__crown-label">{CROWN_LABEL[crown.level]}</span>
                  </span>
                </div>
                <p className="muted clamp-2" dangerouslySetInnerHTML={{ __html: ch.note }} />
                {op.lines[ch.index].record ? <WinBar record={op.lines[ch.index].record!} /> : null}
                <ol className="path">
                  {STEP_KINDS.map((k) => {
                    const done = stepDone(lp, k);
                    const current = !done && k === firstGap;
                    return (
                      <li key={k} className="path__item">
                        <Link
                          href={`/openings/${id}/${ch.slug}/${k}`}
                          className={`node${done ? ' node--done' : ''}${current ? ' node--current' : ''}`}
                          aria-label={`${STEP_INFO[k].label}${done ? ' (done)' : ''}`}
                          title={STEP_INFO[k].blurb}
                        >
                          {done ? <Check size={20} /> : STEP_ICON[k]}
                        </Link>
                        <span className="path__label">
                          {STEP_INFO[k].label}
                          {k === 'quiz' && lp?.quiz_best != null ? <em> {lp.quiz_best}%</em> : null}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </article>
            );
          })}
          <ResetCourse openingId={id} />
        </section>

        <aside className="sidebar">
          <div className="card side-card">
            <h3>
              <Flame size={18} className="gold" /> {pulse.streak ? `${pulse.streak}-day streak` : 'Start a streak today'}
            </h3>
            <div className="bar bar--thin bar--gold">
              <span style={{ width: `${Math.min(100, (pulse.today / pulse.goal) * 100)}%` }} />
            </div>
            <p className="muted small">
              {pulse.today} of {pulse.goal} moves today
            </p>
          </div>

          <div className="card side-card">
            <h3>Ways to practise</h3>
            <ul className="ways">
              {sides.map((s) => (
                <li key={s}>
                  <Link href={`/openings/${id}/practice?side=${s}`} className="way">
                    <span className="way__icon way__icon--green">
                      <Swords size={20} />
                    </span>
                    <span>
                      <b>Free practice{sides.length > 1 ? ` as ${s === 'white' ? 'White' : 'Black'}` : ''}</b>
                      <span className="muted small">The opponent picks any line the course covers. Unscored.</span>
                    </span>
                  </Link>
                </li>
              ))}
              {sparrable
                ? sides.map((s) => (
                    <li key={`spar-${s}`}>
                      <Link href={`/play/spar/${id}?side=${s}`} className="way">
                        <span className="way__icon way__icon--gold">
                          <Target size={20} />
                        </span>
                        <span>
                          <b>Spar a club opponent{sides.length > 1 ? ` as ${s === 'white' ? 'White' : 'Black'}` : ''}</b>
                          <span className="muted small">They play what club players play. Stay in your prep as long as you can.</span>
                        </span>
                      </Link>
                    </li>
                  ))
                : null}
              <li>
                <Link href={`/repertoire/${id}`} className="way">
                  <span className="way__icon way__icon--purple">
                    <Book size={20} />
                  </span>
                  <span>
                    <b>Explore the tree</b>
                    <span className="muted small">Every move the course teaches, with how well you know each one.</span>
                  </span>
                </Link>
              </li>
              <li>
                <Link href={`/openings/${id}/shuffle`} className="way">
                  <span className="way__icon way__icon--blue">
                    <Shuffle size={20} />
                  </span>
                  <span>
                    <b>Drill shuffle</b>
                    <span className="muted small">A random chapter, from memory.</span>
                  </span>
                </Link>
              </li>
              <li>
                <Link href={due ? `/recall/session?course=${id}` : '/recall'} className={`way${due ? '' : ' way--quiet'}`}>
                  <span className="way__icon way__icon--purple">
                    <Retry size={20} />
                  </span>
                  <span>
                    <b>Recall{due ? ` (${due} due)` : ''}</b>
                    <span className="muted small">
                      {due ? 'This course’s moves that are fading, before you forget them.' : 'Nothing due. Learned moves come back here.'}
                    </span>
                  </span>
                </Link>
              </li>
              {traps.length ? (
                <li>
                  <a href="#traps" className="way">
                    <span className="way__icon way__icon--red">
                      <Trap size={20} />
                    </span>
                    <span>
                      <b>Traps in this opening ({traps.length})</b>
                      <span className="muted small">The ones to spring and the ones to see coming.</span>
                    </span>
                  </a>
                </li>
              ) : null}
              {sidelines ? (
                <li>
                  <a href="#sidelines" className="way">
                    <span className="way__icon way__icon--blue">
                      <Target size={20} />
                    </span>
                    <span>
                      <b>When they leave the line</b>
                      <span className="muted small">What club players really play, and when your setup isn’t enough.</span>
                    </span>
                  </a>
                </li>
              ) : null}
              {punish ? (
                <li>
                  <Link href={`/openings/${id}/punish`} className="way">
                    <span className="way__icon way__icon--gold">
                      <Target size={20} />
                    </span>
                    <span>
                      <b>Punish the blunder ({punish})</b>
                      <span className="muted small">Your opponent errs. Find the refutation.</span>
                    </span>
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>

          {games.length ? (
            <div className="card side-card">
              <h3>Model games</h3>
              <p className="muted small">Master games in this opening, annotated. Play along and guess the moves.</p>
              <ul className="ways">
                {games.map((g) => (
                  <li key={g.id}>
                    <Link href={`/openings/${id}/games/${g.id}`} className="way">
                      <span className="way__icon way__icon--blue">
                        <Book size={20} />
                      </span>
                      <span>
                        <b>{g.name.split(': ')[0]}</b>
                        {g.name.includes(': ') ? <span className="muted small">{g.name.slice(g.name.indexOf(': ') + 2)}</span> : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      {traps.length ? (
        <Traps
          traps={traps}
          orientation={op.orientation}
          chapterOf={(slug) => chs.find((ch) => ch.slug === slug)}
        />
      ) : null}

      {sidelines ? (
        <Sidelines
          openingId={id}
          orientation={op.orientation}
          source={sidelines.source}
          scanned={sidelines.scanned}
          games={sidelines.games}
          elo={sidelines.elo}
          depth={sidelines.depth}
          moments={sidelines.moments}
          coverage={sidelines.coverage}
          // The lessons stay on the server: the page only needs what the rows show.
          items={sidelines.items.map(({ line: _line, ...row }) => row)}
          chapters={chs.map((ch) => ({ slug: ch.slug, name: ch.name, index: ch.index }))}
          learned={[...byLine.values()].filter((l) => l.learned_at).map((l) => l.line_slug)}
          drilled={[...byLine.values()].filter((l) => l.drilled_at).map((l) => l.line_slug)}
          traps={Object.fromEntries((op.traps ?? []).map((t) => [t.id, { name: t.name, group: t.group }]))}
        />
      ) : null}
    </main>
  );
}
