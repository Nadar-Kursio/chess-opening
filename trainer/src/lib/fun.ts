import 'server-only';
import type { PoolClient } from 'pg';
import { cache } from 'react';
import { badgeById, badgeStates, longestRun, newlyMet, tierCounts, tierName, type Emblem, type Totals, type Unlock } from './achievements';
import { endOfDay, fullCrowns, learnedCrowns } from './cards';
import { courses } from './catalog';
import { CROWN_NAME, crownRises, type CrownLevel, type CrownsSeen } from './crowns';
import { getOpening } from './content';
import { chapters, courseProgress } from './course';
import { query, queryOne, transaction } from './db';
import { MASTERED_DAYS } from './memory';
import { getPlayRecord } from './playRecord';
import { dayIn, getProgress, learnerTimezone } from './progress';
import { questById, questStates, questsFor, type Today } from './quests';
import type { SessionSave } from './saves';
import { levelFor, totalXp, xpParts, type Tier, type XpSource } from './xp';

/* XP, badges and quests for one learner, read from the progress tables every time they're shown.
   `syncFun` stores newly earned badge tiers and quests; `takeNews` hands out, once each, what the
   learner hasn't been told yet. */

interface Clear {
  day: string;
  quest: string;
}

async function readTotals(userId: string, tz: string) {
  const [row, days, byLine, play, crowns] = await Promise.all([
    queryOne<{
      moves: number;
      spar: number;
      games: number;
      learned: number;
      drilled: number;
      tested: number;
      quizzed: number;
      perfect: number;
      recalled: number;
      long_term: number;
      rush_points: number;
      rush_best: number;
    }>(
      `select ps.moves, ps.spar, ps.games, lp.learned, lp.drilled, lp.tested, lp.quizzed, lp.perfect,
              rl.recalled, rc.long_term, rr.rush_points, rr.rush_best
         from (select coalesce(sum(correct), 0)::int as moves,
                      count(*) filter (where mode = 'spar')::int as spar,
                      count(*) filter (where mode = 'games')::int as games
                 from practice_sessions where user_id = $1) ps,
              (select count(learned_at)::int as learned, count(drilled_at)::int as drilled,
                      count(recalled_at)::int as tested, count(quizzed_at)::int as quizzed,
                      count(*) filter (where quiz_best = 100)::int as perfect
                 from line_progress where user_id = $1) lp,
              (select count(*)::int as recalled from review_log where user_id = $1 and rating > 1) rl,
              (select count(*)::int as long_term from review_cards
                where user_id = $1 and reps > 0 and stability >= $2) rc,
              (select coalesce(sum(score), 0)::int as rush_points, coalesce(max(score), 0)::int as rush_best
                 from rush_runs where user_id = $1) rr`,
      [userId, MASTERED_DAYS],
    ),
    query<{ day: string }>(`select distinct day from practice_sessions where user_id = $1`, [userId]),
    getProgress(userId),
    getPlayRecord(userId),
    fullCrowns(userId, tz),
  ]);
  const r = { ...row!, games_xp: play.xp };
  const coursesFinished = courses().filter((o) => {
    const chs = chapters(getOpening(o.id));
    return chs.length > 0 && courseProgress(chs, byLine.get(o.id) ?? new Map()).chaptersDone === chs.length;
  }).length;
  return {
    r,
    totals: {
      moves: r.moves,
      learned: r.learned,
      longestStreak: longestRun(days.map((d) => d.day)),
      coursesFinished,
      longTerm: r.long_term,
      perfectQuizzes: r.perfect,
      rushBest: r.rush_best,
      sparSessions: r.spar,
      gameSessions: r.games,
      questDays: 0,
      fullCrowns: crowns,
      trapsSprung: play.sprung,
    } satisfies Totals,
  };
}

async function readToday(userId: string, tz: string, day: string): Promise<{ today: Today; hasDeck: boolean }> {
  const dayStart = new Date(endOfDay(tz).getTime() - 86_400_000);
  const row = await queryOne<Today & { has_deck: boolean }>(
    `select ps.moves, ps.sessions + rr.runs as sessions, ps.courses, ps.clean_drills as "cleanDrills",
            ps.perfect_quizzes as "perfectQuizzes", ps.recall_rounds as "recallRounds",
            lp.learned, rr.best as "rushBest", rr.combo as "rushCombo", rr.runs as "rushRuns",
            exists (select 1 from review_cards where user_id = $1 and created_at < $4) as has_deck
       from (select coalesce(sum(correct), 0)::int as moves,
                    count(*) filter (where mode <> 'rush')::int as sessions,
                    count(distinct opening_id)::int as courses,
                    count(*) filter (where mode = 'drill' and wrong = 0 and hints = 0)::int as clean_drills,
                    count(*) filter (where mode = 'quiz' and wrong = 0)::int as perfect_quizzes,
                    count(*) filter (where mode = 'review')::int as recall_rounds
               from practice_sessions where user_id = $1 and day = $2) ps,
            (select count(*)::int as learned from line_progress
              where user_id = $1 and (learned_at at time zone $3)::date = $2::date) lp,
            (select coalesce(max(score), 0)::int as best, coalesce(max(best_combo), 0)::int as combo,
                    count(*)::int as runs
               from rush_runs where user_id = $1 and day = $2) rr`,
    [userId, day, tz, dayStart],
  );
  const { has_deck: hasDeck, ...today } = row!;
  return { today, hasDeck };
}

/** Everything the header, Home and the badges page show: one read per request. */
export const getFun = cache(async (userId: string) => {
  const tz = await learnerTimezone();
  const day = dayIn(tz);
  const [{ r, totals }, { today, hasDeck }, unlockRows, clears] = await Promise.all([
    readTotals(userId, tz),
    readToday(userId, tz, day),
    query<{ badge: string; tier: number; at: string }>(
      `select badge, tier, to_char(unlocked_at at time zone $2, 'YYYY-MM-DD') as at
         from achievement_unlocks where user_id = $1`,
      [userId, tz],
    ),
    query<Clear>(`select day, quest from quest_clears where user_id = $1`, [userId]),
  ]);
  return build({ userId, day, r, totals, today, hasDeck, unlocks: unlockRows, clears });
});

function build(s: {
  userId: string;
  day: string;
  r: Awaited<ReturnType<typeof readTotals>>['r'];
  totals: Totals;
  today: Today;
  hasDeck: boolean;
  unlocks: Unlock[];
  clears: Clear[];
}) {
  const perDay = new Map<string, number>();
  for (const c of s.clears) perDay.set(c.day, (perDay.get(c.day) ?? 0) + 1);
  const questDays = [...perDay.values()].filter((n) => n >= 3).length;
  const totals: Totals = { ...s.totals, questDays };
  const quests = questStates(questsFor(s.userId, s.day, { hasDeck: s.hasDeck }), s.today);
  const tiers: Record<Tier, number> = tierCounts(s.unlocks);
  const source: XpSource = {
    moves: s.r.moves,
    learned: s.r.learned,
    drilled: s.r.drilled,
    tested: s.r.tested,
    quizzed: s.r.quizzed,
    perfectQuizzes: s.r.perfect,
    recalled: s.r.recalled,
    longTerm: s.r.long_term,
    rushPoints: s.r.rush_points,
    games: s.r.games_xp,
    questsCleared: s.clears.length,
    questDays,
    tiers,
  };
  const xp = totalXp(source);
  return {
    ...s,
    totals,
    quests,
    questsDone: quests.every((q) => q.done),
    badges: badgeStates(totals, s.unlocks),
    parts: xpParts(source),
    level: levelFor(xp),
  };
}

export type Fun = ReturnType<typeof build>;

/**
 * Stores badge tiers and quests earned since the last look, and returns the state including them.
 * Inserting is idempotent, so two tabs syncing at once store each one once.
 */
export async function syncFun(userId: string): Promise<Fun> {
  let fun = await getFun(userId);
  // Clearing quests can complete the quest badge, so quests go in first.
  const cleared = fun.quests.filter((q) => q.done && !fun.clears.some((c) => c.day === fun.day && c.quest === q.id));
  if (cleared.length) {
    await query(
      `insert into quest_clears (user_id, day, quest) select $1, $2, unnest($3::text[]) on conflict do nothing`,
      [userId, fun.day, cleared.map((q) => q.id)],
    );
    fun = build({ ...fun, clears: [...fun.clears, ...cleared.map((q) => ({ day: fun.day, quest: q.id }))] });
  }
  const met = newlyMet(fun.totals, fun.unlocks);
  if (met.length) {
    await query(
      `insert into achievement_unlocks (user_id, badge, tier)
       select $1, unnest($2::text[]), unnest($3::smallint[]) on conflict do nothing`,
      [userId, met.map((m) => m.badge), met.map((m) => m.tier)],
    );
    fun = build({ ...fun, unlocks: [...fun.unlocks, ...met.map((m) => ({ ...m, at: fun.day }))] });
  }
  return fun;
}

export type News =
  | { kind: 'welcome'; level: number; name: string; badges: number }
  | { kind: 'level'; level: number; name: string }
  | { kind: 'badge'; badge: string; name: string; label: string; tier: Tier; emblem: Emblem }
  | { kind: 'quest'; title: string }
  | { kind: 'quests' }
  | { kind: 'crown'; openingId: string; slug: string; course: string; chapter: string; level: CrownLevel; name: string; back: boolean };

/**
 * Chapters whose crown went up since the learner last looked. The first look only remembers what
 * they hold. The row is swapped only if nobody changed it since it was read, so a second tab
 * asking at the same moment gets nothing twice.
 */
async function crownNews(client: PoolClient, userId: string, tz: string): Promise<News[]> {
  const current = new Map<string, CrownLevel>();
  for (const [id, crowns] of await learnedCrowns(userId, tz)) {
    for (const [slug, c] of crowns) current.set(`${id}/${slug}`, c.level);
  }
  const { rows } = await client.query<{ levels: CrownsSeen }>(`select levels from crown_seen where user_id = $1`, [userId]);
  if (!rows.length) {
    await client.query(`insert into crown_seen (user_id, levels) values ($1, $2::jsonb) on conflict do nothing`, [
      userId,
      JSON.stringify(crownRises({}, current).next),
    ]);
    return [];
  }
  const seen = rows[0].levels;
  const { rises, next, changed } = crownRises(seen, current);
  if (!changed) return [];
  const swapped = await client.query(
    `update crown_seen set levels = $2::jsonb, updated_at = now() where user_id = $1 and levels = $3::jsonb`,
    [userId, JSON.stringify(next), JSON.stringify(seen)],
  );
  if (!swapped.rowCount) return [];
  return rises.map(({ key, level, back }) => {
    const [openingId, slug] = key.split('/');
    const op = getOpening(openingId);
    const chapter = op.lines.find((l) => l.slug === slug)?.name ?? slug;
    return { kind: 'crown', openingId, slug, course: op.name, chapter, level, name: CROWN_NAME[level], back };
  });
}

/**
 * What the learner hasn't been told yet, each item handed out once: claiming a row and reading it
 * are one statement, so a second tab asking at the same moment gets nothing twice. A learner seen
 * here for the first time gets one welcome instead of a toast for everything already earned.
 */
export async function takeNews(userId: string): Promise<{ news: News[]; fun: Fun }> {
  const fun = await syncFun(userId);
  const { level } = fun;
  const tz = await learnerTimezone();
  const news = await transaction(async (client) => {
    const crowns = await crownNews(client, userId, tz);
    const fresh = await client.query(
      `insert into fun_state (user_id, level_seen) values ($1, $2) on conflict do nothing`,
      [userId, level.level],
    );
    if (fresh.rowCount) {
      await client.query(`update achievement_unlocks set announced_at = now() where user_id = $1 and announced_at is null`, [userId]);
      await client.query(`update quest_clears set announced_at = now() where user_id = $1 and announced_at is null`, [userId]);
      const badges = fun.badges.reduce((n, b) => n + b.tiers.filter((t) => t.unlocked).length, 0);
      return level.level > 1 || badges ? [{ kind: 'welcome', level: level.level, name: level.name, badges } as News] : [];
    }
    const out: News[] = [...crowns];
    const up = await client.query(
      `update fun_state set level_seen = $2, updated_at = now() where user_id = $1 and level_seen < $2`,
      [userId, level.level],
    );
    if (up.rowCount) out.push({ kind: 'level', level: level.level, name: level.name });
    const quests = await client.query<{ day: string; quest: string }>(
      `update quest_clears set announced_at = now()
        where user_id = $1 and announced_at is null returning day::text, quest`,
      [userId],
    );
    for (const q of quests.rows) {
      const def = questById(q.quest);
      if (def && q.day === fun.day) out.push({ kind: 'quest', title: def.title });
    }
    if (quests.rows.some((q) => q.day === fun.day) && fun.questsDone) out.push({ kind: 'quests' });
    const badges = await client.query<{ badge: string; tier: number }>(
      `update achievement_unlocks set announced_at = now()
        where user_id = $1 and announced_at is null returning badge, tier`,
      [userId],
    );
    for (const u of badges.rows) {
      const def = badgeById(u.badge);
      const t = def?.tiers[u.tier];
      if (def && t) out.push({ kind: 'badge', badge: def.id, name: def.name, label: t.label, tier: tierName(def, u.tier), emblem: def.emblem });
    }
    return out;
  });
  return { news, fun };
}

/* ---------- Opening Rush ---------- */

export async function recordRush(userId: string, clientId: string, day: string, rush: NonNullable<SessionSave['rush']>) {
  await query(
    `insert into rush_runs (user_id, client_id, scope, score, found, strikes, best_combo, day)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (user_id, client_id) do nothing`,
    [userId, clientId, rush.scope, rush.score, rush.found, rush.strikes, rush.bestCombo, day],
  );
}

/** The learner's best Rush score for each course played, and 'all'. */
export async function rushBests(userId: string) {
  const rows = await query<{ scope: string; best: number; runs: number }>(
    `select scope, max(score)::int as best, count(*)::int as runs from rush_runs where user_id = $1 group by scope`,
    [userId],
  );
  return new Map(rows.map((r) => [r.scope, r]));
}
