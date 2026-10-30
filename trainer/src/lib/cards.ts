import 'server-only';
import type { PoolClient } from 'pg';
import { courses } from './catalog';
import { getOpening, hasOpening } from './content';
import { query, transaction } from './db';
import { MASTERED_DAYS, daysUntil, newCard, ratingFor, recallOdds, review, strengthOf, type CardState, type Strength } from './memory';
import { courseCards, isCard, lineCards, type Due } from './recall';

/* The learner's deck: reading and writing review_cards. What a card is and how it's scheduled live
   in recall.ts and memory.ts; this file only stores them. */

interface CardRow extends CardState {
  opening_id: string;
  position_key: string;
  last_day: string | null;
}

const COLUMNS = `opening_id, position_key, state, due, stability, difficulty, reps, lapses, last_review, last_day`;

/** The instant the learner's day ends: a card due any time today is due now. */
export function endOfDay(tz: string, now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' })
      .formatToParts(now)
      .map((p) => [p.type, Number(p.value)]),
  );
  const elapsed = ((parts.hour * 60 + parts.minute) * 60 + parts.second) * 1000;
  return new Date(now.getTime() - elapsed + 86_400_000);
}

/** New cards for positions a chapter's Learn just taught; cards already in the deck are left be. */
export async function introduce(client: PoolClient, userId: string, openingId: string, keys: string[]) {
  if (!keys.length) return;
  await client.query(
    `insert into review_cards (user_id, opening_id, position_key)
     select $1, $2, unnest($3::text[])
     on conflict do nothing`,
    [userId, openingId, keys],
  );
}

export interface Graded {
  key: string;
  /** Days until the card is asked again. */
  days: number;
  strength: Strength;
  /** This answer carried the card into long-term memory. */
  mastered: boolean;
  /** Already graded today: this attempt was practice and the schedule didn't move. */
  repeat: boolean;
}

/**
 * Grades what the learner did at each position, creating cards for positions met for the first
 * time. Positions the course doesn't ask from are ignored.
 */
export async function gradeCards(
  client: PoolClient,
  userId: string,
  openingId: string,
  answers: { key: string; hit: boolean; ms?: number | null }[],
  day: string,
  now = new Date(),
) {
  const op = getOpening(openingId);
  const out: Graded[] = [];
  for (const a of answers) {
    if (!isCard(op, a.key)) continue;
    const { rows } = await client.query<CardRow>(
      `select ${COLUMNS} from review_cards
        where user_id = $1 and opening_id = $2 and position_key = $3 for update`,
      [userId, openingId, a.key],
    );
    const card = rows[0] ?? { ...newCard(now), last_day: null };
    if (card.last_day === day) {
      out.push({ key: a.key, days: daysUntil(card, now), strength: strengthOf(card), mastered: false, repeat: true });
      continue;
    }
    const rating = ratingFor(a.hit, a.ms);
    const next = review(card, now, rating);
    await client.query(
      `insert into review_cards
         (user_id, opening_id, position_key, state, due, stability, difficulty, reps, lapses, last_review, last_day)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (user_id, opening_id, position_key) do update set
         state = excluded.state, due = excluded.due, stability = excluded.stability,
         difficulty = excluded.difficulty, reps = excluded.reps, lapses = excluded.lapses,
         last_review = excluded.last_review, last_day = excluded.last_day`,
      [userId, openingId, a.key, next.state, next.due, next.stability, next.difficulty, next.reps, next.lapses, next.last_review, day],
    );
    await client.query(
      `insert into review_log (user_id, opening_id, position_key, rating, think_ms, state, stability, difficulty, due)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, openingId, a.key, rating, a.ms ?? null, next.state, next.stability, next.difficulty, next.due],
    );
    out.push({
      key: a.key,
      days: daysUntil(next, now),
      strength: strengthOf(next),
      mastered: card.stability < MASTERED_DAYS && next.stability >= MASTERED_DAYS,
      repeat: false,
    });
  }
  return out;
}

/**
 * Brings the deck up to date with what the learner has studied: every line they've learned has
 * its cards, including lines learned before Recall existed. A card for a position they've
 * already been tested on starts from that last result instead of from scratch.
 */
export async function syncDeck(userId: string, now = new Date()) {
  const [learned, existing] = await Promise.all([
    query<{ opening_id: string; line_slug: string }>(
      `select opening_id, line_slug from line_progress where user_id = $1 and learned_at is not null`,
      [userId],
    ),
    query<{ opening_id: string; position_key: string }>(
      `select opening_id, position_key from review_cards where user_id = $1`,
      [userId],
    ),
  ]);
  const have = new Set(existing.map((r) => `${r.opening_id}|${r.position_key}`));
  const missing = new Map<string, Set<string>>();
  for (const { opening_id: id, line_slug: slug } of learned) {
    if (!hasOpening(id)) continue;
    for (const key of lineCards(getOpening(id), slug)) {
      if (have.has(`${id}|${key}`)) continue;
      let keys = missing.get(id);
      if (!keys) missing.set(id, (keys = new Set()));
      keys.add(key);
    }
  }
  if (!missing.size) return;

  await transaction(async (client) => {
    for (const [id, keys] of missing) {
      const { rows: history } = await client.query<{
        position_key: string;
        misses: number;
        hits: number;
        last_seen_at: Date;
        last_missed_at: Date | null;
      }>(
        `select position_key, misses, hits, last_seen_at, last_missed_at from position_misses
          where user_id = $1 and opening_id = $2 and position_key = any($3::text[])`,
        [userId, id, [...keys]],
      );
      const seen = new Map(history.map((h) => [h.position_key, h]));
      for (const key of keys) {
        const h = seen.get(key);
        let card = newCard(now);
        if (h) {
          const forgot = h.misses > h.hits;
          const at = forgot && h.last_missed_at ? h.last_missed_at : h.last_seen_at;
          card = review(newCard(at), at, ratingFor(!forgot));
        }
        await client.query(
          `insert into review_cards
             (user_id, opening_id, position_key, state, due, stability, difficulty, reps, lapses, last_review)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           on conflict do nothing`,
          [userId, id, key, card.state, card.due, card.stability, card.difficulty, card.reps, card.lapses, card.last_review],
        );
      }
    }
  });
}

async function cardsOf(userId: string, openingId?: string) {
  return query<CardRow>(
    `select ${COLUMNS} from review_cards
      where user_id = $1 and ($2::text is null or opening_id = $2)`,
    [userId, openingId ?? null],
  );
}

/**
 * The cards due before `before`, most urgent first: reviews by how likely they are to be
 * forgotten by now, then cards never yet answered, in the order they were learned.
 */
export async function dueCards(userId: string, before: Date, openingId?: string, now = new Date()): Promise<Due[]> {
  const rows = (await cardsOf(userId, openingId)).filter((c) => c.due < before && hasOpening(c.opening_id));
  const odds = new Map(rows.map((c) => [c, recallOdds(c, now)]));
  return rows
    .sort((a, b) => {
      if ((a.reps === 0) !== (b.reps === 0)) return a.reps === 0 ? 1 : -1;
      return a.reps === 0 ? a.due.getTime() - b.due.getTime() : odds.get(a)! - odds.get(b)!;
    })
    .map((c) => ({ openingId: c.opening_id, key: c.position_key }));
}

export async function countDue(userId: string, before: Date) {
  const rows = await query<{ n: number }>(
    `select count(*)::int as n from review_cards where user_id = $1 and due < $2`,
    [userId, before],
  );
  return rows[0]?.n ?? 0;
}

export interface CourseMemory {
  id: string;
  name: string;
  orientation: 'white' | 'black';
  /** Positions the course can ask. */
  total: number;
  due: number;
  counts: Record<Strength, number>;
  /** Average chance of recalling an answered card right now, 0–100; null before any answer. */
  odds: number | null;
}

/** Per course: how much of it is in the deck, how strong, and what's due. */
export async function deckByCourse(userId: string, before: Date, now = new Date()) {
  const rows = await cardsOf(userId);
  const byCourse = new Map<string, CardRow[]>();
  for (const c of rows) {
    if (!hasOpening(c.opening_id)) continue;
    let list = byCourse.get(c.opening_id);
    if (!list) byCourse.set(c.opening_id, (list = []));
    list.push(c);
  }
  const out: CourseMemory[] = [];
  for (const summary of courses()) {
    const cards = byCourse.get(summary.id);
    if (!cards) continue;
    const counts: Record<Strength, number> = { new: 0, learning: 0, familiar: 0, mastered: 0 };
    let oddsSum = 0;
    let answered = 0;
    for (const c of cards) {
      counts[strengthOf(c)]++;
      if (c.reps) {
        oddsSum += recallOdds(c, now);
        answered++;
      }
    }
    out.push({
      id: summary.id,
      name: summary.name,
      orientation: summary.orientation,
      total: courseCards(getOpening(summary.id)).size,
      due: cards.filter((c) => c.due < before).length,
      counts,
      odds: answered ? Math.round((oddsSum / answered) * 100) : null,
    });
  }
  return out;
}

/** Cards falling due on each of the next `days` learner days; today includes everything overdue. */
export async function forecast(userId: string, tz: string, days = 7, now = new Date()) {
  const end = endOfDay(tz, now).getTime();
  const counts = Array.from({ length: days }, () => 0);
  for (const c of await cardsOf(userId)) {
    const k = c.due.getTime() < end ? 0 : Math.ceil((c.due.getTime() - end + 1) / 86_400_000);
    if (k < days) counts[k]++;
  }
  return counts;
}

/** A course's cards due before `before`, and per chapter how many positions are in long-term memory. */
export async function courseMemory(userId: string, openingId: string, before: Date) {
  const op = getOpening(openingId);
  const rows = await cardsOf(userId, openingId);
  const strong = new Set(rows.filter((c) => strengthOf(c) === 'mastered').map((c) => c.position_key));
  const due = rows.filter((c) => c.due < before).length;
  const chapters = new Map(
    op.lines.map((l) => {
      const keys = lineCards(op, l.slug);
      return [l.slug, { mastered: keys.filter((k) => strong.has(k)).length, total: keys.length }];
    }),
  );
  return { due, chapters };
}
