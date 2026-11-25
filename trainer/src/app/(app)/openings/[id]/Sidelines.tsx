'use client';

import Link from 'next/link';
import { useState } from 'react';
import Board from '@/components/Board';
import { Check, Trap } from '@/components/ui/icons';
import { turnOf } from '@/lib/course';
import { evalText } from '@/lib/engineView';
import { trapTitle } from '@/lib/traps';
import type { Colour, CourseTrap, Sideline, SidelineKind, Sidelines as SidelineData } from '@/lib/types';

/* Where club players leave the chapters, and what to do then. Optional, so it stays out of the
   course's progress: most replies only need "keep your setup", and the few that need more say so. */

type Row = Omit<Sideline, 'line'>;
type TrapNames = Record<string, Pick<CourseTrap, 'name' | 'group'>>;

const KIND_LABEL: Record<SidelineKind, string> = {
  answer: 'Needs an answer',
  dodge: 'Trap to dodge',
  set: 'Trap to set',
  keep: 'Keep your setup',
  chapter: 'Has its own chapter',
};

const isStudy = (s: Row) => s.kind === 'answer' || s.kind === 'dodge' || s.kind === 'set';
const pctLabel = (s: Row) => (s.pct ? `${s.pct}%` : 'Rare');
// Enough to see what the group is about on a phone; the rest is a tap away.
const SHOWN = 6;
// The filter for sidelines that leave before the chapters part (chapter null in the data).
const BEFORE = 'before-the-chapters';
// A rare sideline adds a fraction of a percent, and studying it should still move the number.
const percent = (n: number) => (n > 0 && n < 0.1 ? 'under 0.1' : n.toFixed(n < 10 ? 1 : 0));

export default function Sidelines({
  openingId,
  orientation,
  source,
  scanned,
  games,
  elo,
  depth,
  moments,
  coverage,
  items,
  chapters,
  learned,
  drilled,
  traps,
}: Pick<SidelineData, 'source' | 'scanned' | 'games' | 'elo' | 'depth' | 'moments' | 'coverage'> & {
  openingId: string;
  orientation: Colour;
  items: Row[];
  chapters: { slug: string; name: string; index: number }[];
  learned: string[];
  drilled: string[];
  traps: TrapNames;
}) {
  const [chapter, setChapter] = useState<string | null>(null);
  const [moment, setMoment] = useState<number | null>(null);
  const [selected, setSelected] = useState(items.find(isStudy)?.slug ?? items[0]?.slug);
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState({ study: false, keep: false });

  const group = chapter === BEFORE ? null : chapter;
  const inGroup = (s: Pick<Row, 'chapter'>) => !chapter || s.chapter === group;
  const shown = items.filter((s) => inGroup(s) && (moment === null || s.moment === moment));
  const study = shown.filter(isStudy);
  const keep = shown.filter((s) => !isStudy(s));
  const studyShown = more.study ? study : study.slice(0, SHOWN);
  const keepShown = more.keep ? keep : keep.slice(0, SHOWN);
  const before = items.filter((s) => s.chapter === null).length;
  const groupMoments = chapter
    ? moments
        .filter((m) => m.chapter === group && items.some((s) => s.chapter === group && s.moment === m.index))
        // A chapter's moves in the order they're played; the replies before the chapters, most played first.
        .sort((a, b) => (group === null ? b.leave - a.leave : a.index - b.index))
    : [];
  const filter = (next: string | null, at: number | null) => {
    setChapter(next);
    setMoment(at);
    setMore({ study: false, keep: false });
    // The detail panel follows the list: never a row the filter has just hidden.
    const nextGroup = next === BEFORE ? null : next;
    const rows = items.filter((s) => (!next || s.chapter === nextGroup) && (at === null || s.moment === at));
    const first = rows.find(isStudy) ?? rows[0];
    if (first) setSelected(first.slug);
    setOpen(false);
  };
  const current = items.find((s) => s.slug === selected) ?? items[0];

  const available = Object.values(coverage).reduce((n, w) => n + w, 0);
  const studied = learned.reduce((n, slug) => n + (coverage[slug] ?? 0), 0);
  const studyDone = items.filter((s) => isStudy(s) && learned.includes(s.slug)).length;
  const studyTotal = items.filter(isStudy).length;

  const pick = (slug: string) => {
    setOpen(slug !== selected || !open);
    setSelected(slug);
  };

  const row = (s: Row) => (
    <article key={s.slug} className={`card sideline${s.slug === selected ? ' sideline--on' : ''}`}>
      <button type="button" className="sideline__row" onClick={() => pick(s.slug)} aria-pressed={s.slug === selected}>
        <span className="sideline__num">{s.num}</span>
        <span className="sideline__text">
          <span className="sideline__tags">
            <span className={`chip chip--${s.kind}`}>{KIND_LABEL[s.kind]}</span>
            <span className="muted small">after {s.after}</span>
            {s.trap && traps[s.trap] ? (
              <span className="sideline__trap" title={trapTitle(traps[s.trap].name)}>
                <Trap size={14} /> {trapTitle(traps[s.trap].name)}
              </span>
            ) : null}
          </span>
          <span>{s.short}</span>
        </span>
        {learned.includes(s.slug) ? (
          <span className="sideline__done" aria-label="Studied">
            <Check size={18} />
          </span>
        ) : null}
        <span className="sideline__pct">{pctLabel(s)}</span>
      </button>
      {s.slug === selected && open ? (
        <div className="sideline__inline">
          <Detail s={s} openingId={openingId} orientation={orientation} chapters={chapters} learned={learned} drilled={drilled} traps={traps} />
        </div>
      ) : null}
    </article>
  );

  return (
    <section className="sidelines" id="sidelines" aria-label="When they leave the line">
      <div className="sidelines__head">
        <div className="sidelines__intro">
          <h2 className="section__title">When they leave the line</h2>
          <p>Club players leave a chapter early. Most of the time you just keep playing your setup. These are the moments when you can’t.</p>
        </div>
        <div className="card sidelines__meter">
          <div className="sidelines__meter-nums">
            <span>Club replies you’ve studied, first five moves</span>
            <span>
              {percent(studied)}% of {percent(available)}%
            </span>
          </div>
          <div className="sidelines__meter-bar" role="img" aria-label={`${percent(studied)}% studied, ${percent(available)}% taught by this course`}>
            <span style={{ width: `${studied}%` }} />
            <span style={{ width: `${Math.max(0, available - studied)}%` }} />
          </div>
          <span className="muted small">
            {studyDone} of {studyTotal} worth studying done
          </span>
        </div>
      </div>

      <div className="sidelines__filters" role="group" aria-label="Which chapter">
        <button type="button" className="sidelines__filter" aria-pressed={!chapter} onClick={() => filter(null, null)}>
          <b>All</b>
          <small>Most common first</small>
        </button>
        {before ? (
          <button type="button" className="sidelines__filter" aria-pressed={chapter === BEFORE} onClick={() => filter(BEFORE, null)}>
            <b>Before the chapters</b>
            <small>{before} places</small>
          </button>
        ) : null}
        {chapters.map((ch) => {
          const count = items.filter((s) => s.chapter === ch.slug).length;
          return count ? (
            <button key={ch.slug} type="button" className="sidelines__filter" aria-pressed={chapter === ch.slug} onClick={() => filter(ch.slug, null)}>
              <b>Chapter {ch.index + 1}</b>
              <small>{count} places</small>
            </button>
          ) : null;
        })}
      </div>

      {groupMoments.length > 1 ? (
        <div className="sidelines__filters" role="group" aria-label="Which move">
          {groupMoments.map((m) => (
            <button
              key={m.index}
              type="button"
              className="sidelines__filter"
              aria-pressed={moment === m.index}
              onClick={() => filter(chapter, moment === m.index ? null : m.index)}
            >
              <b>{m.label}</b>
              <small>{m.chapter === null ? `${m.leave}% play it` : `${m.leave}% leave here`}</small>
            </button>
          ))}
        </div>
      ) : null}

      <div className="sidelines__body">
        <div className="sidelines__list">
          {study.length ? (
            <div className="sidelines__group">
              <h3>Worth studying</h3>
              {studyShown.map(row)}
              {studyShown.length < study.length ? (
                <button type="button" className="btn btn--ghost" onClick={() => setMore({ ...more, study: true })}>
                  Show {study.length - studyShown.length} more
                </button>
              ) : null}
            </div>
          ) : (
            <p className="sidelines__source">Nothing to study here. Every common reply keeps your setup.</p>
          )}
          {keep.length ? (
            <div className="sidelines__group">
              <h3>Keep your setup</h3>
              {keepShown.map(row)}
              {keepShown.length < keep.length ? (
                <button type="button" className="btn btn--ghost" onClick={() => setMore({ ...more, keep: true })}>
                  Show {keep.length - keepShown.length} more
                </button>
              ) : null}
            </div>
          ) : null}
          <p className="sidelines__source">
            {games.toLocaleString('en-GB')} games between {elo[0]} and {elo[1]} rated players, no bullet, from {scanned.toLocaleString('en-GB')} in {source}.
            Percentages are of games reaching that position. Scores are Stockfish at depth {depth}, from White’s side.
          </p>
        </div>
        {current ? (
          <aside className="card sidelines__aside">
            <Detail s={current} openingId={openingId} orientation={orientation} chapters={chapters} learned={learned} drilled={drilled} traps={traps} />
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function Detail({
  s,
  openingId,
  orientation,
  chapters,
  learned,
  drilled,
  traps,
}: {
  s: Row;
  openingId: string;
  orientation: Colour;
  chapters: { slug: string; name: string; index: number }[];
  learned: string[];
  drilled: string[];
  traps: TrapNames;
}) {
  const trap = s.trap ? traps[s.trap] : undefined;
  const target = chapters.find((ch) => ch.slug === s.target);
  const hasLearned = learned.includes(s.slug);
  return (
    <div className="sideline-detail">
      <Board
        fen={s.fen}
        orientation={turnOf(orientation)}
        last={{ from: s.from, to: s.to }}
        arrows={s.play ? [{ from: s.play.from, to: s.play.to, kind: 'hint' }] : []}
        coordinates={false}
        animate={false}
      />
      <div className="sideline-detail__title">
        {s.num}
        <span className={`chip chip--${s.kind}`}>{KIND_LABEL[s.kind]}</span>
      </div>
      {s.name ? <span className="muted small">{s.name}</span> : null}
      <p className="sideline-detail__note" dangerouslySetInnerHTML={{ __html: s.note }} />
      <span className="muted small">
        {s.games.toLocaleString('en-GB')} of {s.at.toLocaleString('en-GB')} club games at this point
      </span>
      {s.bestEv !== undefined ? (
        <div className="sideline-detail__scores">
          {s.auto && s.autoEv !== undefined ? (
            <>
              <span>Your usual move: {s.auto}</span>
              <span className={s.kind === 'answer' || s.kind === 'dodge' ? 'sideline-detail__bad' : undefined}>{evalText({ ev: s.autoEv })}</span>
            </>
          ) : null}
          <span>Engine’s best: {s.best}</span>
          <span>{evalText({ ev: s.bestEv })}</span>
        </div>
      ) : null}
      <div className="sideline-detail__actions">
        {target ? (
          <Link className="btn btn--primary" href={`/openings/${openingId}/${target.slug}/learn`}>
            Open chapter {target.index + 1}
          </Link>
        ) : (
          <>
            <Link className={hasLearned ? 'btn btn--ghost' : 'btn btn--primary'} href={`/openings/${openingId}/${s.slug}/learn`}>
              Learn, {s.yourMoves} move{s.yourMoves === 1 ? '' : 's'}
            </Link>
            <Link className={hasLearned ? 'btn btn--primary' : 'btn btn--ghost'} href={`/openings/${openingId}/${s.slug}/drill`}>
              Drill{drilled.includes(s.slug) ? ' again' : ''}
            </Link>
          </>
        )}
      </div>
      {trap ? (
        <Link className="sideline-detail__trap" href={`/openings/${s.trap}`}>
          <Trap size={16} />
          <span>
            {trap.group === 'set' ? 'The trap this sets: ' : 'The trap this dodges: '}
            <b>{trapTitle(trap.name)}</b>
          </span>
        </Link>
      ) : null}
    </div>
  );
}
