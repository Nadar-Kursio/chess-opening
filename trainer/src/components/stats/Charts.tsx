'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { rollingAccuracy, sumDays, type CalendarDay, type DayRow } from '@/lib/stats';

/* The stats page's charts. Thin marks on a recessive grid, one hue per chart, a tooltip on every
   mark and a table under each for anyone who'd rather read the numbers. Colours are tokens. */

const RANGES = [30, 90] as const;

const fmtDay = (day: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });

/** Clean ticks from zero: 0, a round half and a round top that clears the largest value. */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(value));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * step >= value) return m * step;
  return 10 * step;
}

interface TipState {
  x: number;
  y: number;
  value: string;
  label: string;
}

function Tip({ tip }: { tip: TipState | null }) {
  if (!tip) return null;
  return (
    <div className="viz-tip" style={{ left: tip.x, top: tip.y }} role="presentation">
      <b>{tip.value}</b>
      <span>{tip.label}</span>
    </div>
  );
}

/** Where a pointer event sits inside the chart box, for the tooltip. */
function within(e: React.PointerEvent, box: HTMLElement | null) {
  const r = box?.getBoundingClientRect();
  return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 };
}

/** The plot's size as CSS lays it out, with the axis band and dot size from the tokens. */
function useBox<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [box, setBox] = useState({ width: 0, height: 0, axis: 0, dot: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const css = getComputedStyle(el);
      setBox({
        width: el.clientWidth,
        height: el.clientHeight,
        axis: parseFloat(css.getPropertyValue('--chart-axis')) || 0,
        dot: parseFloat(css.getPropertyValue('--chart-dot')) || 0,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box] as const;
}

function TableView({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="viz-table">
      <summary>Show as a table</summary>
      <div className="viz-table__scroll">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, k) => (k ? <td key={k}>{c}</td> : <th key={k} scope="row">{c}</th>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Tile({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="stat-tile">
      <span className="stat-tile__label">{label}</span>
      <b className="stat-tile__value">{value}</b>
      {note ? <span className="stat-tile__note">{note}</span> : null}
    </div>
  );
}

/** The range toggle, the numbers it scopes, and the two charts over it. `days` is the last 96 days. */
export function PracticeCharts({ days, goal, streak, longest }: { days: DayRow[]; goal: number; streak: number; longest: number }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const shown = days.slice(-range);
  const accuracy = rollingAccuracy(days).slice(-range);
  const t = sumDays(shown);
  return (
    <section className="section stats-practice" aria-label="Practice">
      <div className="stats-filter" role="group" aria-label="Time range">
        {RANGES.map((r) => (
          <button key={r} type="button" className="stats-filter__btn" aria-pressed={range === r} onClick={() => setRange(r)}>
            Last {r} days
          </button>
        ))}
      </div>
      <div className="stat-tiles">
        <Tile label="Day streak" value={streak} note={longest > streak ? `Longest this year: ${longest}` : streak ? 'Your longest this year' : 'Practise today to start one'} />
        <Tile label="Moves found" value={t.moves.toLocaleString('en-GB')} note={`${Math.round(t.moves / range)} a day on average`} />
        <Tile label="Accuracy" value={t.accuracy === null ? 'None yet' : `${t.accuracy}%`} note="Found first time, outside Learn" />
        <Tile label="Days practised" value={t.active} note={`of the last ${range}`} />
      </div>
      <div className="stats-charts">
        <div className="card viz-card">
          <h3>Moves found per day</h3>
          <p className="muted small">The line is your daily goal of {goal}.</p>
          <Columns days={shown} goal={goal} />
          <TableView
            caption="Moves found per day"
            head={['Day', 'Moves found']}
            rows={[...shown].reverse().map((d) => [fmtDay(d.day), d.moves])}
          />
        </div>
        <div className="card viz-card">
          <h3>Accuracy</h3>
          <p className="muted small">Share of moves found first time, over the week up to each day.</p>
          <AccuracyLine points={accuracy} />
          <TableView
            caption="Accuracy over the week up to each day"
            head={['Day', 'Accuracy', 'Moves graded']}
            rows={[...accuracy].reverse().map((p) => [fmtDay(p.day), p.pct === null ? 'None' : `${p.pct}%`, p.graded])}
          />
        </div>
      </div>
    </section>
  );
}

function Columns({ days, goal }: { days: DayRow[]; goal: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const top = niceMax(Math.max(goal, ...days.map((d) => d.moves)));
  const ticks = [0, top / 2, top];
  return (
    <div className="viz" ref={box} onPointerLeave={() => (setTip(null), setActive(null))}>
      <div className="viz__plot">
        <div className="viz__grid" aria-hidden="true">
          {ticks.map((v) => (
            <span key={v} className="viz__gridline" style={{ bottom: `${(v / top) * 100}%` }}>
              <i>{v}</i>
            </span>
          ))}
          <span className="viz__goal" style={{ bottom: `${(goal / top) * 100}%` }}>
            <i>Goal</i>
          </span>
        </div>
        <div className={`viz__cols${days.length > 45 ? ' viz__cols--dense' : ''}`} role="img" aria-label={`Moves found each day over the last ${days.length} days`}>
          {days.map((d, i) => (
            <span
              key={d.day}
              className={`viz__col${active === i ? ' viz__col--on' : ''}`}
              onPointerMove={(e) => {
                setActive(i);
                setTip({ ...within(e, box.current), value: `${d.moves} move${d.moves === 1 ? '' : 's'}`, label: fmtDay(d.day) });
              }}
            >
              {d.moves ? <span className="viz__bar" style={{ height: `${(d.moves / top) * 100}%` }} /> : null}
            </span>
          ))}
        </div>
      </div>
      <div className="viz__x" aria-hidden="true">
        <span>{fmtDay(days[0].day, { day: 'numeric', month: 'short' })}</span>
        <span>{fmtDay(days[Math.floor(days.length / 2)].day, { day: 'numeric', month: 'short' })}</span>
        <span>Today</span>
      </div>
      <Tip tip={tip} />
    </div>
  );
}

function AccuracyLine({ points }: { points: { day: string; pct: number | null; graded: number }[] }) {
  const [plot, { width, height, axis, dot }] = useBox<HTMLDivElement>();
  const [at, setAt] = useState<number | null>(null);
  const known = points.filter((p) => p.pct !== null).map((p) => p.pct!);
  const floor = known.length ? Math.min(50, Math.floor(Math.min(...known) / 10) * 10) : 50;
  const r = dot / 2;
  const pad = { top: dot * 2.5, bottom: r, left: axis + r, right: dot * 1.5 };
  const w = Math.max(0, width - pad.left - pad.right);
  const h = height - pad.top - pad.bottom;
  const x = (i: number) => pad.left + (points.length > 1 ? (i / (points.length - 1)) * w : w / 2);
  const y = (v: number) => pad.top + (1 - (v - floor) / (100 - floor)) * h;

  let d = '';
  let pen = false;
  points.forEach((p, i) => {
    if (p.pct === null) {
      pen = false;
      return;
    }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.pct).toFixed(1)}`;
    pen = true;
  });
  const lastIndex = points.findLastIndex((p) => p.pct !== null);
  const ticks = [floor, (floor + 100) / 2, 100];
  const hover = at !== null ? points[at] : null;

  return (
    <div className="viz" onPointerLeave={() => setAt(null)}>
      <div className="viz__svgbox" ref={plot}>
      {width ? (
        <svg
          className="viz__svg"
          width={width}
          height={height}
          role="img"
          aria-label={known.length ? `Accuracy, latest ${points[lastIndex].pct}%` : 'No graded moves in this range yet'}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const i = Math.round(((e.clientX - r.left - pad.left) / Math.max(1, w)) * (points.length - 1));
            setAt(Math.max(0, Math.min(points.length - 1, i)));
          }}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line className="viz__rule" x1={pad.left} x2={width - pad.right} y1={y(v)} y2={y(v)} />
              <text className="viz__tick" x={pad.left - dot} y={y(v)} dy="0.32em" textAnchor="end">
                {v}%
              </text>
            </g>
          ))}
          {d ? <path className="viz__line" d={d} /> : null}
          {lastIndex >= 0 ? (
            <>
              <circle className="viz__dot" cx={x(lastIndex)} cy={y(points[lastIndex].pct!)} r={r} />
              <text className="viz__end" x={x(lastIndex)} y={y(points[lastIndex].pct!) - dot * 1.25} textAnchor="end">
                {points[lastIndex].pct}%
              </text>
            </>
          ) : null}
          {hover ? (
            <>
              <line className="viz__cross" x1={x(at!)} x2={x(at!)} y1={pad.top} y2={height - pad.bottom} />
              {hover.pct !== null ? <circle className="viz__dot" cx={x(at!)} cy={y(hover.pct)} r={r} /> : null}
            </>
          ) : null}
        </svg>
      ) : null}
      </div>
      {!known.length ? <p className="viz__empty muted small">Nothing graded in this range yet.</p> : null}
      <div className="viz__x viz__x--line" aria-hidden="true">
        <span>{fmtDay(points[0].day, { day: 'numeric', month: 'short' })}</span>
        <span>{fmtDay(points[Math.floor(points.length / 2)].day, { day: 'numeric', month: 'short' })}</span>
        <span>Today</span>
      </div>
      {hover && at !== null ? (
        <Tip
          tip={{
            x: x(at),
            y: hover.pct !== null ? y(hover.pct) : pad.top,
            value: hover.pct === null ? 'Nothing graded' : `${hover.pct}%`,
            label: `Week to ${fmtDay(hover.day)}${hover.graded ? ` · ${hover.graded} moves` : ''}`,
          }}
        />
      ) : null}
    </div>
  );
}

const CAL_LABEL = ['No practice', 'Under half your goal', 'Under your goal', 'Goal met', 'Twice your goal'];

export function YearCalendar({ weeks }: { weeks: CalendarDay[][] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);
  // A month is named over the first week that starts in it; the first column is a partial month.
  const months = weeks.map((w, i) => (i && w[0].day.slice(5, 7) !== weeks[i - 1][0].day.slice(5, 7) ? fmtDay(w[0].day, { month: 'short' }) : ''));
  const practised = weeks.flat().filter((d) => d.moves > 0);
  return (
    <div className="viz cal" onPointerLeave={() => setTip(null)}>
      <div className="cal__scroll" ref={scroller}>
        <div className="cal__months" aria-hidden="true" style={{ '--cal-weeks': weeks.length } as React.CSSProperties}>
          {months.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
        <div className="cal__grid" role="img" aria-label={`${practised.length} days practised in the last year`} style={{ '--cal-weeks': weeks.length } as React.CSSProperties}>
          {weeks.flatMap((w) =>
            w.map((d) => (
              <span
                key={d.day}
                className={`cal__day cal__day--${d.future ? 'future' : d.level}`}
                onPointerMove={(e) => {
                  if (d.future) return setTip(null);
                  const r = e.currentTarget.getBoundingClientRect();
                  const host = e.currentTarget.closest('.cal')!.getBoundingClientRect();
                  setTip({
                    x: r.left - host.left + r.width / 2,
                    y: r.top - host.top,
                    value: d.moves ? `${d.moves} move${d.moves === 1 ? '' : 's'}` : 'No practice',
                    label: fmtDay(d.day, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
                  });
                }}
              />
            )),
          )}
        </div>
      </div>
      <ul className="cal__key">
        <li className="muted small">Less</li>
        {CAL_LABEL.map((l, i) => (
          <li key={l} title={l}>
            <span className={`cal__day cal__day--${i}`} aria-hidden="true" />
            <span className="sr-only">{l}</span>
          </li>
        ))}
        <li className="muted small">More</li>
      </ul>
      <Tip tip={tip} />
      <TableView
        caption="Days practised in the last year"
        head={['Day', 'Moves found']}
        rows={[...practised].reverse().map((d) => [fmtDay(d.day, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), d.moves])}
      />
    </div>
  );
}

/** Cards per stability bucket, as horizontal bars in the buckets' natural order. */
export function StabilityBars({ buckets }: { buckets: { id: string; label: string; level: string; n: number }[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const top = Math.max(1, ...buckets.map((b) => b.n));
  const total = buckets.reduce((s, b) => s + b.n, 0);
  return (
    <div className="viz" ref={box} onPointerLeave={() => setTip(null)}>
      <ul className="hbars">
        {buckets.map((b) => (
          <li
            key={b.id}
            className="hbars__row"
            onPointerMove={(e) =>
              setTip({ ...within(e, box.current), value: `${b.n} card${b.n === 1 ? '' : 's'}`, label: `${b.label}, ${total ? Math.round((b.n / total) * 100) : 0}% of the deck` })
            }
          >
            <span className="hbars__label">{b.label}</span>
            <span className="hbars__track">
              {b.n ? <span className={`hbars__bar lvl--${b.level}`} style={{ width: `${(b.n / top) * 100}%` }} /> : null}
              <span className="hbars__value">{b.n}</span>
            </span>
          </li>
        ))}
      </ul>
      <Tip tip={tip} />
    </div>
  );
}

/** Cards due on each of the coming days, today first. */
export function DueColumns({ counts, labels }: { counts: number[]; labels: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const top = Math.max(1, ...counts);
  return (
    <div className="viz" ref={box} onPointerLeave={() => setTip(null)}>
      <ol className="due-cols" aria-label="Cards due each day this week">
        {counts.map((n, i) => (
          <li
            key={i}
            className="due-cols__day"
            onPointerMove={(e) => setTip({ ...within(e, box.current), value: `${n} due`, label: labels[i] })}
          >
            <span className="due-cols__n">{n || ''}</span>
            <span className="due-cols__slot">{n ? <span className="due-cols__bar" style={{ height: `${(n / top) * 100}%` }} /> : null}</span>
            <span className="due-cols__label">{labels[i]}</span>
          </li>
        ))}
      </ol>
      <Tip tip={tip} />
    </div>
  );
}
