import 'server-only';
import { query } from './db';
import type { Colour } from './types';

/* Personal bests in sparring: the most of their own moves a learner kept in book in one game, per
   course and chair. Raising it only ever goes up, so a save the outbox repeats changes nothing. */

export async function recordSparBest(userId: string, openingId: string, spar: { side: Colour; depth: number }) {
  await query(
    `insert into spar_bests (user_id, opening_id, side, depth) values ($1, $2, $3, $4)
     on conflict (user_id, opening_id, side) do update set depth = excluded.depth, achieved_at = now()
       where spar_bests.depth < excluded.depth`,
    [userId, openingId, spar.side, spar.depth],
  );
}

/** Bests keyed `${openingId}|${side}`, and games played per course. */
export async function getSparRecords(userId: string) {
  const [bests, games] = await Promise.all([
    query<{ opening_id: string; side: Colour; depth: number }>(
      `select opening_id, side, depth from spar_bests where user_id = $1`,
      [userId],
    ),
    query<{ opening_id: string; games: number }>(
      `select opening_id, count(*)::int as games from practice_sessions
        where user_id = $1 and mode = 'spar' group by opening_id`,
      [userId],
    ),
  ]);
  return {
    bests: new Map(bests.map((b) => [`${b.opening_id}|${b.side}`, b.depth])),
    played: new Map(games.map((g) => [g.opening_id, g.games])),
  };
}
