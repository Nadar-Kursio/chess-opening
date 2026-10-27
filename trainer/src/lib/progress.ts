import 'server-only';
import { cookies } from 'next/headers';
import { query, queryOne, transaction } from './db';
import { stepColumn, type LineProgress, type StepKind } from './course';

export type Mode = StepKind | 'free' | 'review';

/* ---------- the learner's calendar ---------- */

const DAY = new Map<string, Intl.DateTimeFormat>();

/** The learner's timezone, from the cookie the layout sets; UTC until it has. */
export async function learnerTimezone() {
  const tz = (await cookies()).get('tz')?.value ?? 'UTC';
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

export function dayIn(tz: string, at = new Date()) {
  let fmt = DAY.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    DAY.set(tz, fmt);
  }
  return fmt.format(at);
}

function shiftDay(day: string, by: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + by);
  return d.toISOString().slice(0, 10);
}

/* ---------- reads ---------- */

export async function getProgress(userId: string, openingId?: string) {
  const rows = await query<LineProgress & { opening_id: string }>(
    `select opening_id, line_slug, learned_at, drilled_at, recalled_at, quizzed_at, quiz_best,
            clean_runs, runs
       from line_progress
      where user_id = $1 and ($2::text is null or opening_id = $2)`,
    [userId, openingId ?? null],
  );
  const byOpening = new Map<string, Map<string, LineProgress>>();
  for (const row of rows) {
    let m = byOpening.get(row.opening_id);
    if (!m) byOpening.set(row.opening_id, (m = new Map()));
    m.set(row.line_slug, row);
  }
  return byOpening;
}

/** The opening the learner practised most recently, so Home can pick up where they left off. */
export async function lastOpening(userId: string) {
  const row = await queryOne<{ opening_id: string }>(
    `select opening_id from practice_sessions where user_id = $1 order by created_at desc limit 1`,
    [userId],
  );
  return row?.opening_id ?? null;
}

export interface Settings {
  daily_goal: number;
  sound: boolean;
  coordinates: boolean;
}

export async function getSettings(userId: string): Promise<Settings> {
  const row = await queryOne<Settings>(
    'select daily_goal, sound, coordinates from user_settings where user_id = $1',
    [userId],
  );
  return row ?? { daily_goal: 30, sound: true, coordinates: true };
}

export interface Pulse {
  today: number;
  goal: number;
  streak: number;
  /** The last seven days, oldest first: did the learner practise? */
  week: { day: string; label: string; practised: boolean; today: boolean }[];
}

/** Today's moves, the streak and the week — the numbers the header and sidebars show. */
export async function getPulse(userId: string): Promise<Pulse> {
  const tz = await learnerTimezone();
  const today = dayIn(tz);
  const [settings, days] = await Promise.all([
    getSettings(userId),
    query<{ day: string; moves: number }>(
      `select day, sum(correct)::int as moves
         from practice_sessions
        where user_id = $1 and day > $2::date - 400
        group by day order by day desc`,
      [userId, today],
    ),
  ]);
  const practised = new Set(days.map((d) => d.day));
  // A streak survives until the end of today: yesterday's practice still counts this morning.
  let streak = 0;
  let cursor = practised.has(today) ? today : shiftDay(today, -1);
  while (practised.has(cursor)) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }
  const week = Array.from({ length: 7 }, (_, k) => {
    const day = shiftDay(today, k - 6);
    const label = new Date(`${day}T12:00:00Z`).toLocaleDateString('en-GB', {
      weekday: 'narrow',
      timeZone: 'UTC',
    });
    return { day, label, practised: practised.has(day), today: day === today };
  });
  return {
    today: days.find((d) => d.day === today)?.moves ?? 0,
    goal: settings.daily_goal,
    streak,
    week,
  };
}

export async function getMissedKeys(userId: string, openingId: string, limit = 20) {
  const rows = await query<{ position_key: string; misses: number; hits: number }>(
    `select position_key, misses, hits
       from position_misses
      where user_id = $1 and opening_id = $2 and misses > hits
      order by misses - hits desc, last_missed_at desc
      limit $3`,
    [userId, openingId, limit],
  );
  return rows;
}

export async function countMissed(userId: string) {
  const rows = await query<{ opening_id: string; n: number }>(
    `select opening_id, count(*)::int as n from position_misses
      where user_id = $1 and misses > hits group by opening_id`,
    [userId],
  );
  return new Map(rows.map((r) => [r.opening_id, r.n]));
}

export async function getTotals(userId: string) {
  return (
    (await queryOne<{ sessions: number; moves: number; days: number; mistakes: number }>(
      `select count(*)::int as sessions, coalesce(sum(correct), 0)::int as moves,
              count(distinct day)::int as days, coalesce(sum(wrong), 0)::int as mistakes
         from practice_sessions where user_id = $1`,
      [userId],
    )) ?? { sessions: 0, moves: 0, days: 0, mistakes: 0 }
  );
}

/* ---------- writes ---------- */

export interface SessionResult {
  openingId: string;
  lineSlug: string | null;
  mode: Mode;
  correct: number;
  wrong: number;
  hints: number;
  /** Quiz only: the share answered right first time, 0–100. */
  score: number | null;
  /** Positions asked, by key, and whether the learner found the move first time. */
  positions: { key: string; hit: boolean }[];
}

/** Whether a finished session completes its step. The client reports counts, the server decides. */
export function stepPassed(r: SessionResult) {
  switch (r.mode) {
    case 'learn':
    case 'drill':
      return true;
    case 'recall':
      return r.wrong === 0 && r.hints === 0;
    case 'quiz':
      return (r.score ?? 0) >= 80;
    default:
      return false;
  }
}

export async function recordSession(userId: string, r: SessionResult) {
  const day = dayIn(await learnerTimezone());
  const passed = stepPassed(r);
  await transaction(async (client) => {
    await client.query(
      `insert into practice_sessions (user_id, opening_id, line_slug, mode, correct, wrong, hints, day)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, r.openingId, r.lineSlug, r.mode, r.correct, r.wrong, r.hints, day],
    );
    if (r.lineSlug && r.mode !== 'free' && r.mode !== 'review') {
      const column = stepColumn(r.mode);
      const isRun = r.mode === 'drill' || r.mode === 'recall';
      const isClean = isRun && r.wrong === 0 && r.hints === 0;
      // `column` comes from a fixed map in course.ts, never from input.
      await client.query(
        `insert into line_progress (user_id, opening_id, line_slug, ${column}, quiz_best, runs, clean_runs)
         values ($1, $2, $3, case when $4 then now() end, $5, $6, $7)
         on conflict (user_id, opening_id, line_slug) do update set
           ${column} = coalesce(line_progress.${column}, excluded.${column}),
           quiz_best = greatest(line_progress.quiz_best, excluded.quiz_best),
           runs = line_progress.runs + excluded.runs,
           clean_runs = line_progress.clean_runs + excluded.clean_runs,
           last_practiced_at = now()`,
        [userId, r.openingId, r.lineSlug, passed, r.score, isRun ? 1 : 0, isClean ? 1 : 0],
      );
    }
    for (const p of r.positions) {
      await client.query(
        `insert into position_misses (user_id, opening_id, position_key, misses, hits, last_missed_at)
         values ($1, $2, $3, $4, $5, case when $4 > 0 then now() end)
         on conflict (user_id, opening_id, position_key) do update set
           misses = position_misses.misses + excluded.misses,
           hits = position_misses.hits + excluded.hits,
           last_missed_at = coalesce(excluded.last_missed_at, position_misses.last_missed_at),
           last_seen_at = now()`,
        [userId, r.openingId, p.key, p.hit ? 0 : 1, p.hit ? 1 : 0],
      );
    }
  });
  return { passed };
}

export async function saveSettings(userId: string, s: Settings) {
  await query(
    `insert into user_settings (user_id, daily_goal, sound, coordinates) values ($1, $2, $3, $4)
     on conflict (user_id) do update set daily_goal = excluded.daily_goal, sound = excluded.sound,
       coordinates = excluded.coordinates, updated_at = now()`,
    [userId, s.daily_goal, s.sound, s.coordinates],
  );
}

export async function resetOpening(userId: string, openingId: string) {
  await transaction(async (client) => {
    await client.query('delete from line_progress where user_id = $1 and opening_id = $2', [
      userId,
      openingId,
    ]);
    await client.query('delete from position_misses where user_id = $1 and opening_id = $2', [
      userId,
      openingId,
    ]);
  });
}
