import 'server-only';
import { getOpening } from './content';
import { query, queryOne } from './db';
import { sideOf } from './recall';
import { courseShape, sanPath } from './repertoire';
import type { Fact } from './repertoireData';
import { fillForecast, stabilityCounts, type DayRow } from './stats';

/* The stats page's reads. Each is one aggregate over the learner's own rows, on the indexes the
   tables already have: practice_sessions (user_id, day), review_cards' primary key,
   review_log (user_id, reviewed_at). */

/** Moves found and missed per practised day, back `days` days from `today`. */
export async function practiceDays(userId: string, today: string, days: number) {
  return query<DayRow>(
    `select day, sum(correct)::int as moves,
            coalesce(sum(correct) filter (where mode <> 'learn'), 0)::int as found,
            coalesce(sum(wrong) filter (where mode <> 'learn'), 0)::int as missed
       from practice_sessions
      where user_id = $1 and day > $2::date - $3::int
      group by day`,
    [userId, today, days],
  );
}

/** The deck by stability, grouped on whole days: the bucket edges are whole days. */
export async function deckStability(userId: string) {
  const rows = await query<{ reps: number; stability: number; n: number }>(
    `select least(reps, 1)::int as reps, floor(stability)::int as stability, count(*)::int as n
       from review_cards where user_id = $1 group by 1, 2`,
    [userId],
  );
  return stabilityCounts(rows);
}

/** Cards falling due on each of the next `days` learner days; overdue cards count today. */
export async function dueForecast(userId: string, tz: string, today: string, before: Date, days = 7) {
  const rows = await query<{ offset: number; n: number }>(
    `select ((due at time zone $2)::date - $3::date)::int as "offset", count(*)::int as n
       from review_cards where user_id = $1 and due < $4
      group by 1`,
    [userId, tz, today, before],
  );
  return fillForecast(rows, days);
}

/**
 * How often a card that had been answered before was recalled, over the last 30 days and ever.
 * A card's first answer is left out: that's learning it, not remembering it.
 */
export async function retention(userId: string) {
  return (
    (await queryOne<{ recent: number; recent_of: number; ever: number; ever_of: number }>(
      `select count(*) filter (where rating > 1 and reviewed_at > now() - interval '30 days')::int as recent,
              count(*) filter (where reviewed_at > now() - interval '30 days')::int as recent_of,
              count(*) filter (where rating > 1)::int as ever,
              count(*)::int as ever_of
         from (select rating, reviewed_at,
                      row_number() over (partition by opening_id, position_key order by reviewed_at) as n
                 from review_log where user_id = $1) r
        where n > 1`,
      [userId],
    )) ?? { recent: 0, recent_of: 0, ever: 0, ever_of: 0 }
  );
}

export interface WeakPosition {
  openingId: string;
  course: string;
  key: string;
  fen: string;
  from: string | null;
  to: string | null;
  flipped: boolean;
  /** The move that reaches it, or null at the start. */
  after: string | null;
  href: string;
}

/** Where a weak position sits in its course, for a board and a link into the explorer. */
export function placeWeak(f: Pick<Fact, 'openingId' | 'key'>): WeakPosition | null {
  const op = getOpening(f.openingId);
  const side = sideOf(op, f.key);
  if (!side) return null;
  const shape = courseShape(op, side);
  const n = shape.nodes[f.key];
  const sans = sanPath(shape, f.key);
  const params = new URLSearchParams({ side });
  if (sans.length) params.set('at', sans.join('.'));
  return {
    openingId: op.id,
    course: op.name,
    key: f.key,
    fen: n.fen,
    from: n.from,
    to: n.to,
    flipped: side === 'black',
    after: n.num || null,
    href: `/repertoire/${op.id}?${params}`,
  };
}
