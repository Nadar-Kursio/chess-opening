import 'server-only';
import { getClub, getOpening, hasOpening } from './content';
import { sidesTaught } from './course';
import { query } from './db';
import { addTally, emptyTally, type PositionMemory } from './mastery';
import { clubIndex, courseShape, positionMemory, subtreeTallies, type ClubIndex, type ClubSource } from './repertoire';

/* Reading the deck for the explorer and the stats page: every card with its misses, as what the
   learner remembers of each position. */

interface FactRow {
  opening_id: string;
  position_key: string;
  state: number | null;
  due: Date | null;
  stability: number | null;
  difficulty: number | null;
  reps: number | null;
  lapses: number | null;
  last_review: Date | null;
  misses: number | null;
  hits: number | null;
}

export interface Fact {
  openingId: string;
  key: string;
  memory: PositionMemory;
  lapses: number;
}

/** Every position the learner has a card for or has missed, in one course or all of them. */
export async function deckFacts(userId: string, endOfToday: Date, openingId?: string, now = new Date()): Promise<Fact[]> {
  const rows = await query<FactRow>(
    `select coalesce(c.opening_id, m.opening_id) as opening_id,
            coalesce(c.position_key, m.position_key) as position_key,
            c.state, c.due, c.stability, c.difficulty, c.reps, c.lapses, c.last_review, m.misses, m.hits
       from (select * from review_cards where user_id = $1 and ($2::text is null or opening_id = $2)) c
       full join (select * from position_misses where user_id = $1 and ($2::text is null or opening_id = $2)) m
         on m.opening_id = c.opening_id and m.position_key = c.position_key`,
    [userId, openingId ?? null],
  );
  return rows
    .filter((r) => hasOpening(r.opening_id))
    .map((r) => ({
      openingId: r.opening_id,
      key: r.position_key,
      lapses: r.lapses ?? 0,
      memory: positionMemory(
        r.due
          ? {
              state: r.state!,
              due: r.due,
              stability: r.stability!,
              difficulty: r.difficulty!,
              reps: r.reps!,
              lapses: r.lapses!,
              last_review: r.last_review,
            }
          : null,
        r.misses === null ? null : { misses: r.misses, hits: r.hits ?? 0 },
        now,
        endOfToday,
      ),
    }));
}

export function memoryByKey(facts: Fact[]) {
  return Object.fromEntries(facts.map((f) => [f.key, f.memory]));
}

const clubs = new Map<string, { index: ClubIndex; source: ClubSource } | null>();

/** A course's club numbers, read once per process; null when the scripts haven't made them. */
export function clubOf(id: string) {
  if (!clubs.has(id)) {
    const raw = getClub(id) as ClubSource | null;
    const index = raw ? clubIndex(raw) : null;
    clubs.set(id, index?.size ? { index, source: { source: raw!.source, games: raw!.games, elo: raw!.elo } } : null);
  }
  return clubs.get(id)!;
}

/** Per course, every learner position in its tree (both chairs) counted by level. */
export function courseTallies(facts: Fact[], ids: string[]) {
  const byCourse = new Map<string, Record<string, PositionMemory>>();
  for (const f of facts) {
    let m = byCourse.get(f.openingId);
    if (!m) byCourse.set(f.openingId, (m = {}));
    m[f.key] = f.memory;
  }
  return new Map(
    ids.map((id) => {
      const op = getOpening(id);
      const memory = byCourse.get(id) ?? {};
      const tally = emptyTally();
      for (const side of sidesTaught(op)) {
        const shape = courseShape(op, side);
        addTally(tally, subtreeTallies(shape, memory)[shape.root] ?? emptyTally());
      }
      return [id, { tally, started: byCourse.has(id) }];
    }),
  );
}
