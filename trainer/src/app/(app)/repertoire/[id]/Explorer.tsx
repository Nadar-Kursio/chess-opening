'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import Board, { type BoardArrow } from '@/components/Board';
import { EvalBar } from '@/components/session/SessionBoard';
import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { MARK_GLYPH, evalText } from '@/lib/engineView';
import { LevelLegend, MemoryBar, WeakMark } from '@/components/ui/Memory';
import { LEVEL_LABEL, LEVEL_NOTE, emptyTally, tallyTotal, type PositionMemory, type Tally } from '@/lib/mastery';
import { usePacked } from '@/lib/usePacked';
import '@/app/loader.css';
import type { BranchGroup, Teach, XMove, XNode } from '@/lib/repertoire';
import type { Severity, Turn } from '@/lib/types';

/* The explorer's screen: a board over the course's tree, the moves from the position shown with
   what the learner remembers of each, and a map of the whole tree to find the weak branches.
   Every position and move comes from the server's tree; the board only offers the moves in it. */

export interface ExplorerData {
  id: string;
  name: string;
  side: Turn;
  root: string;
  nodes: Record<string, Omit<XNode, 'moves'> & { moves: ExplorerMove[] }>;
  memory: Record<string, PositionMemory>;
  tallies: Record<string, Tally>;
  groups: BranchGroup[];
  /** The positions from the start to the one to open on. */
  initial: string[];
  club: { source: string; games: number | null; elo: [number, number] | null; partial?: boolean } | null;
  learned: string[];
}

/** A move as the screen gets it: its first lesson, and how many others teach it. */
export type ExplorerMove = XMove & { more: number };

const SEV_LABEL: Record<Severity, string> = { playable: 'Playable', inaccuracy: 'Inaccuracy', blunder: 'Blunder' };

/** The explorer, once its data has arrived from /api/repertoire/[id]. */
export default function Explorer({ src }: { src: string }) {
  const { data, retry } = usePacked<ExplorerData>(src);
  if (data === 'failed') {
    return (
      <div className="card loading-note" role="status">
        <p>The repertoire didn’t load.</p>
        <button type="button" className="btn btn--ghost" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="card loading-note" role="status">
        <p className="muted">Opening the repertoire…</p>
      </div>
    );
  }
  return <ExplorerView data={data} />;
}

function ExplorerView({ data }: { data: ExplorerData }) {
  const { nodes } = data;
  const [path, setPath] = useState(data.initial.length ? data.initial : [data.root]);
  const [at, setAt] = useState(path.length - 1);
  const [hover, setHover] = useState<ExplorerMove | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const key = path[at];
  const node = nodes[key];
  const via = at > 0 ? nodes[path[at - 1]].moves.find((m) => m.next === key) ?? null : null;
  const isYours = node.toMove === data.side;
  const own = data.memory[key];

  const moves = useMemo(
    () =>
      [...node.moves].sort(
        (a, b) => Number(b.main) - Number(a.main) || (b.club ?? -1) - (a.club ?? -1) || rank(a) - rank(b),
      ),
    [node],
  );

  const weakSpots = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const g of data.groups)
      for (const r of g.rows)
        for (const c of r.cells) {
          if (data.memory[c.key]?.weak && !seen.has(c.key)) {
            seen.add(c.key);
            out.push(c.key);
          }
        }
    return out;
  }, [data]);

  const pathTo = (target: string) => {
    const keys = [target];
    for (let k = target; nodes[k].parent; k = nodes[k].parent!) keys.unshift(nodes[k].parent!);
    return keys;
  };

  const jump = (target: string) => {
    const keys = pathTo(target);
    setPath(keys);
    setAt(keys.length - 1);
    setHover(null);
    const top = boardRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const play = (next: string) => {
    setHover(null);
    if (path[at + 1] === next) setAt(at + 1);
    else {
      setPath([...path.slice(0, at + 1), next]);
      setAt(at + 1);
    }
  };

  const mainNext = moves.find((m) => m.main) ?? moves[0];
  const canForward = at < path.length - 1 || !!mainNext;
  const back = () => at > 0 && setAt(at - 1);
  const forward = () => {
    if (at < path.length - 1) setAt(at + 1);
    else if (mainNext) play(mainNext.next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      const act = { ArrowLeft: back, ArrowRight: forward, Home: () => setAt(0), End: () => setAt(path.length - 1) }[e.key];
      if (!act) return;
      e.preventDefault();
      act();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // The address follows the board, so a position can be shared or reopened.
  useEffect(() => {
    const sans = path.slice(1, at + 1).map((k, i) => nodes[path[i]].moves.find((m) => m.next === k)!.san);
    const url = new URL(window.location.href);
    if (sans.length) url.searchParams.set('at', sans.join('.'));
    else url.searchParams.delete('at');
    window.history.replaceState(window.history.state, '', url);
  }, [path, at, nodes]);

  const arrows: BoardArrow[] = hover
    ? [{ from: hover.from, to: hover.to, kind: 'hint' }]
    : isYours && mainNext
      ? [{ from: mainNext.from, to: mainNext.to, kind: 'good' }]
      : [];
  const onPath = new Set(path.slice(0, at + 1));
  // From a weak spot, on to the next; from anywhere else, the first.
  const weakAfter = weakSpots[(weakSpots.indexOf(key) + 1) % Math.max(1, weakSpots.length)];

  return (
    <div className="explorer">
      <div className="explorer__board" ref={boardRef}>
        <div className="explorer__board-row">
          {node.ev !== undefined || node.mate !== undefined ? <EvalBar score={node} orientation={data.side} /> : null}
          <div className="explorer__board-main">
            <Board
              fen={node.fen}
              orientation={data.side}
              last={via ? { from: via.from, to: via.to } : null}
              legal={node.moves.map((m) => m.from + m.to).join('')}
              movable={node.moves.length ? node.toMove : null}
              onMove={(from, to) => {
                const m = node.moves.find((e) => e.from === from && e.to === to);
                if (m) play(m.next);
              }}
              arrows={arrows}
              badge={node.mark && via ? { sq: via.to, glyph: MARK_GLYPH[node.mark], mark: node.mark } : null}
              checkSide={node.check ? node.toMove : null}
              label={`${data.name}, ${via ? `after ${via.num}` : 'the starting position'}`}
            />
          </div>
        </div>
        <div className="rep-nav">
          <button type="button" className="icon-btn" onClick={back} disabled={at === 0} aria-label="Previous move" title="Previous move (←)">
            <ChevronLeft />
          </button>
          <ol className="rep-tape" aria-label="Moves to this position">
            <li>
              <button type="button" className="rep-tape__jump" aria-current={at === 0 ? 'step' : undefined} onClick={() => setAt(0)}>
                Start
              </button>
            </li>
            {path.slice(1).map((k, i) => {
              const m = nodes[path[i]].moves.find((e) => e.next === k)!;
              const white = nodes[path[i]].toMove === 'w';
              return (
                <li key={`${i}-${k}`} className={i + 1 > at ? 'rep-tape__ahead' : undefined}>
                  <TapeJump current={i + 1 === at} onClick={() => setAt(i + 1)}>
                    {white || i === 0 ? <span className="rep-tape__num">{m.num.match(/^\d+\.+/)?.[0]}</span> : null}
                    {m.san}
                  </TapeJump>
                </li>
              );
            })}
          </ol>
          <button type="button" className="icon-btn" onClick={forward} disabled={!canForward} aria-label="Next move" title="Next move (→)">
            <ChevronRight />
          </button>
        </div>
      </div>

      <section className="explorer__panel" aria-label="This position">
        <div className="card rep-here">
          <div className="rep-here__head">
            <div>
              <span className="rep-here__where">{via ? `After ${via.num}` : 'Starting position'}</span>
              <h2>{!node.moves.length ? 'The course ends here' : isYours ? 'Your move' : `${node.toMove === 'w' ? 'White' : 'Black'} to play`}</h2>
            </div>
            {weakSpots.length ? (
              <button type="button" className="btn btn--sm btn--ghost rep-here__weak" onClick={() => weakAfter && jump(weakAfter)}>
                <WeakMark /> Next weak spot ({weakSpots.length})
              </button>
            ) : null}
          </div>
          {isYours && node.moves.length ? <OwnMemory memory={own} /> : null}
          {node.note ? (
            <div className="rep-note">
              <span className="rep-note__who">{via ? `Coach on ${via.num}` : 'Coach'}</span>
              <p dangerouslySetInnerHTML={{ __html: node.note }} />
            </div>
          ) : null}
        </div>

        {moves.length ? (
          <ol className="rep-moves" aria-label="Moves the course plays from here">
            {moves.map((m) => (
              <MoveRow
                key={m.next}
                m={m}
                data={data}
                tally={data.tallies[m.next]}
                ahead={path[at + 1] === m.next}
                onPlay={() => play(m.next)}
                onHover={(on) => setHover(on ? m : null)}
              />
            ))}
          </ol>
        ) : (
          <p className="card rep-end muted">No more moves in the course from here. Step back, or pick another branch on the map.</p>
        )}

        {isYours && node.alts?.length ? (
          <div className="card rep-alts">
            <h3>Moves the course avoids here</h3>
            <ul>
              {node.alts.map((a) => (
                <li key={a.from + a.to}>
                  <b>{a.san}</b> <span className={`chip chip--${a.sev}`}>{SEV_LABEL[a.sev]}</span>
                  <p className="muted small" dangerouslySetInnerHTML={{ __html: a.why }} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {data.club ? (
          <p className="rep-source muted small">
            Club numbers: {data.club.games ? `${data.club.games.toLocaleString('en-GB')} ` : ''}
            {data.club.source}
            {data.club.elo ? `, players rated ${data.club.elo[0]} to ${data.club.elo[1]}` : ''}
            {data.club.partial ? '. Shown where the course has a sideline for the move.' : '.'} Scores are Stockfish, from White’s side.
          </p>
        ) : (
          <p className="rep-source muted small">Scores are Stockfish, from White’s side. No club numbers for this course yet.</p>
        )}
      </section>

      <BranchMap data={data} current={key} onPath={onPath} onJump={jump} />
    </div>
  );
}

function rank(m: ExplorerMove) {
  return m.kind === 'line' ? 0 : m.kind === 'sideline' ? 1 : 2;
}

function TapeJump({ current, onClick, children }: { current: boolean; onClick: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  // Scrolls the strip only: scrollIntoView would move the page too.
  useEffect(() => {
    const button = ref.current;
    const strip = button?.closest('ol');
    if (current && button && strip) strip.scrollTo({ left: button.offsetLeft - (strip.clientWidth - button.offsetWidth) / 2 });
  }, [current]);
  return (
    <button ref={ref} type="button" className="rep-tape__jump" aria-current={current ? 'step' : undefined} onClick={onClick}>
      {children}
    </button>
  );
}

function OwnMemory({ memory }: { memory: PositionMemory | undefined }) {
  const level = memory?.level ?? 'none';
  const parts: string[] = [];
  if (memory?.odds != null) parts.push(`${memory.odds}% likely to recall`);
  if (memory?.dueIn === 0 && level !== 'none') parts.push(level === 'new' ? 'first recall due' : 'due today');
  else if (memory?.dueIn) parts.push(`back in ${memory.dueIn} day${memory.dueIn === 1 ? '' : 's'}`);
  if (memory && memory.misses + memory.hits) parts.push(`found ${memory.hits} of ${memory.misses + memory.hits}`);
  return (
    <div className={`rep-own${memory?.weak ? ' rep-own--weak' : ''}`}>
      <span className={`lvl-dot lvl--${level}`} aria-hidden="true" />
      <span>
        <b>{LEVEL_LABEL[level]}</b>
        {memory?.weak ? (
          <span className="rep-own__weak">
            <WeakMark /> Needs work
          </span>
        ) : null}
        <span className="muted small rep-own__facts">{parts.length ? parts.join(' · ') : LEVEL_NOTE[level]}</span>
      </span>
    </div>
  );
}

function MoveRow({
  m,
  data,
  tally,
  ahead,
  onPlay,
  onHover,
}: {
  m: ExplorerMove;
  data: ExplorerData;
  tally: Tally | undefined;
  ahead: boolean;
  onPlay: () => void;
  onHover: (on: boolean) => void;
}) {
  const t = m.teach[0];
  const below = tally && tallyTotal(tally) ? tally : null;
  return (
    <li className={`rep-move${m.main ? ' rep-move--main' : ''}${ahead ? ' rep-move--ahead' : ''}`}>
      <button
        type="button"
        className="rep-move__go"
        onClick={onPlay}
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
      >
        <span className="rep-move__san">{m.num}</span>
        <span className="rep-move__tags">
          {m.main && m.kind === 'line' ? <span className="chip chip--done">Main line</span> : null}
          {m.kind === 'branch' && m.sev ? <span className={`chip chip--${m.sev}`}>{SEV_LABEL[m.sev]}</span> : null}
          {m.kind === 'sideline' ? <span className="chip">Sideline</span> : null}
          {m.transposes ? <span className="chip">Transposes</span> : null}
          {m.name ? <span className="muted small">{m.name}</span> : null}
        </span>
        <span className="rep-move__nums">
          {m.club !== undefined ? (
            <span className="rep-move__club" title="Share of club games at this position">
              <ClubMeter pct={m.club} />
              {m.club >= 1 ? `${Math.round(m.club)}%` : m.club > 0 ? '<1%' : 'Rare'}
            </span>
          ) : null}
          {m.ev !== undefined || m.mate !== undefined ? <span className="rep-move__eval">{evalText(m)}</span> : null}
        </span>
        {below ? (
          <span className="rep-move__memory">
            <MemoryBar tally={below} />
            <span className="muted small">
              {below.weak ? (
                <span className="rep-move__weak">
                  <WeakMark /> {below.weak} to work on
                </span>
              ) : null}
              {below.weak ? ' · ' : ''}
              {tallyTotal(below) - below.none} of {tallyTotal(below)} learned
            </span>
          </span>
        ) : null}
      </button>
      {t ? <TeachLinks t={t} more={m.more} data={data} /> : null}
    </li>
  );
}

function TeachLinks({ t, more, data }: { t: Teach; more: number; data: ExplorerData }) {
  const base = `/openings/${data.id}/${t.slug}`;
  const learned = data.learned.includes(t.slug);
  const label = t.kind === 'chapter' ? `Chapter ${(t.index ?? 0) + 1}: ${t.name}` : `Sideline: ${t.name}`;
  return (
    <div className="rep-move__teach">
      <span className="rep-move__chapter">
        {label}
        {more > 0 ? <span className="muted"> and {more} more</span> : null}
      </span>
      <span className="rep-move__links">
        {t.steps.includes('learn') ? (
          <Link href={`${base}/learn`} className={`btn btn--sm ${learned ? 'btn--ghost' : 'btn--secondary'}`}>
            Learn
          </Link>
        ) : null}
        {t.steps.includes('drill') ? (
          <Link href={`${base}/drill`} className={`btn btn--sm ${learned ? 'btn--secondary' : 'btn--ghost'}`}>
            Drill
          </Link>
        ) : null}
        {t.steps.includes('quiz') && !t.steps.includes('learn') ? (
          <Link href={`${base}/quiz`} className="btn btn--sm btn--secondary">
            Quiz
          </Link>
        ) : null}
      </span>
    </div>
  );
}

function ClubMeter({ pct }: { pct: number }) {
  return (
    <span className="club-meter" aria-hidden="true">
      <span style={{ width: `${Math.max(pct > 0 ? 4 : 0, Math.min(100, pct))}%` }} />
    </span>
  );
}

function BranchMap({
  data,
  current,
  onPath,
  onJump,
}: {
  data: ExplorerData;
  current: string;
  onPath: Set<string>;
  onJump: (key: string) => void;
}) {
  const cols = Math.max(1, ...data.groups.flatMap((g) => g.rows.flatMap((r) => r.cells.map((c) => c.col + 1))));
  const groupOf = (key: string) => data.groups.find((g) => g.rows.some((r) => r.cells.some((c) => c.key === key)))?.id;
  const [open, setOpen] = useState<Set<string>>(() => new Set([groupOf(current) ?? data.groups[0]?.id].filter(Boolean) as string[]));
  const currentGroup = groupOf(current);
  const [prevGroup, setPrevGroup] = useState(currentGroup);
  if (prevGroup !== currentGroup) {
    setPrevGroup(currentGroup);
    if (currentGroup && !open.has(currentGroup)) setOpen(new Set([...open, currentGroup]));
  }
  const toggle = (id: string) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };

  return (
    <section className="explorer__map card" aria-label="Map of the whole repertoire">
      <div className="bmap__head">
        <div>
          <h2>The whole tree</h2>
          <p className="muted small">Each square is one of your moves, by move number. Tap one to go there.</p>
        </div>
        <LevelLegend />
      </div>
      <div className="bmap" style={{ '--bmap-cols': cols } as React.CSSProperties}>
        {data.groups.map((g) => {
          const keys = g.rows.flatMap((r) => r.cells.map((c) => c.key));
          const tally = groupTally(keys, data.memory);
          const isOpen = open.has(g.id);
          return (
            <div key={g.id} className={`bmap__group${isOpen ? ' bmap__group--open' : ''}`}>
              <button type="button" className="bmap__toggle" aria-expanded={isOpen} onClick={() => toggle(g.id)}>
                <ChevronRight size={16} className="bmap__chev" />
                <span className="bmap__title">
                  {g.index !== null ? <span className="bmap__num">{g.index + 1}</span> : null}
                  <span className="bmap__name">{g.title}</span>
                </span>
                <span className="bmap__summary">
                  <MemoryBar tally={tally} />
                  {tally.weak ? (
                    <span className="bmap__weak">
                      <WeakMark /> {tally.weak}
                    </span>
                  ) : null}
                </span>
              </button>
              {isOpen ? (
                <div className="bmap__rows">
                  {g.rows.map((r) => (
                    <div key={r.start} className="bmap__row">
                      <span className="bmap__label">{r.label}</span>
                      <span className="bmap__cells">
                        {r.cells.map((c) => {
                          const mem = data.memory[c.key];
                          const level = mem?.level ?? 'none';
                          const n = data.nodes[c.key];
                          const cls = [
                            'bmap__cell',
                            `lvl--${level}`,
                            mem?.weak ? 'bmap__cell--weak' : '',
                            onPath.has(c.key) ? 'bmap__cell--path' : '',
                            c.key === current ? 'bmap__cell--now' : '',
                          ].join(' ');
                          const label = `${n.num ? `After ${n.num}` : 'Move 1'}: ${LEVEL_LABEL[level]}${mem?.weak ? ', needs work' : ''}`;
                          return (
                            <button
                              key={c.key}
                              type="button"
                              className={cls}
                              style={{ gridColumn: c.col + 1 }}
                              onClick={() => onJump(c.key)}
                              aria-label={label}
                              title={label}
                            />
                          );
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function groupTally(keys: string[], memory: Record<string, PositionMemory>) {
  const t = emptyTally();
  for (const k of new Set(keys)) {
    const m = memory[k];
    t[m?.level ?? 'none']++;
    if (m?.weak) t.weak++;
  }
  return t;
}
