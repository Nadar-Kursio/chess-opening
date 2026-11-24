import 'server-only';
import { getClub, getOpening, hasOpening } from './content';
import { query } from './db';
import { allOpenings, getGames, learnedLines } from './gameImport';
import { baitsOf, sparPathValid, trapsInGame, type TrapOutcome } from './gameTraps';
import { buildReport, gameFacts, type Matched } from './games';
import { sparBook, type SparBook } from './spar';
import type { TrapEvent } from './trapAlbum';
import type { Colour } from './types';
import { gameXp } from './xp';

/* What the learner's real play has earned: XP from imported games and every trap met, in games and
   in sparring. Derived from the stored games on each read, so a re-import (deduped by site and game
   id) never pays twice and a course that grows reclassifies old games. Kept per learner until their
   games, studied courses or sparring traps change, since the header asks for it on every page. */

export interface PlayRecord {
  /** XP from imported games, and how many games earned some. */
  xp: number;
  paid: number;
  traps: TrapEvent[];
  /** Different trap courses sprung by the learner. */
  sprung: number;
}

interface SparRow {
  trap_id: string;
  opening_id: string;
  outcome: TrapOutcome;
  punished: boolean | null;
  side: Colour;
  played_at: Date;
}

export function playFrom(matched: Matched[], studied: Set<string>, spar: SparRow[]): PlayRecord {
  let xp = 0;
  let paid = 0;
  const traps: TrapEvent[] = [];
  for (const m of matched) {
    const earned = gameXp(gameFacts(m, studied));
    xp += earned;
    if (earned) paid++;
    for (const t of m.traps) {
      const { site, id, result, opponent, colour } = m.game;
      traps.push({ ...t, at: m.game.playedAt, source: 'game', game: { site, id, result, opponent, colour } });
    }
  }
  for (const r of spar) {
    traps.push({
      trapId: r.trap_id,
      outcome: r.outcome,
      setter: hasOpening(r.trap_id) && getOpening(r.trap_id).orientation === r.side,
      ply: 0,
      punished: r.punished,
      at: r.played_at,
      source: 'spar',
      openingId: r.opening_id,
    });
  }
  traps.sort((a, b) => b.at.getTime() - a.at.getTime());
  const sprung = new Set(traps.filter((t) => t.outcome === 'sprung').map((t) => t.trapId)).size;
  return { xp, paid, traps, sprung };
}

export async function sparTraps(userId: string) {
  return query<SparRow>(
    `select trap_id, opening_id, outcome, punished, side, played_at from spar_traps where user_id = $1`,
    [userId],
  );
}

const CACHE_SIZE = 500;
const cache = new Map<string, { sig: string; record: PlayRecord }>();

/** The learner's play record, recomputed only when something it's derived from has changed. */
export async function getPlayRecord(userId: string): Promise<PlayRecord> {
  const [sig, { learned, studied }] = await Promise.all([
    query<{ sig: string }>(
      `select concat_ws('|', (select count(*) from imported_games where user_id = $1),
                             (select max(imported_at) from imported_games where user_id = $1),
                             (select count(*) from spar_traps where user_id = $1)) as sig`,
      [userId],
    ),
    learnedLines(userId),
  ]);
  const key = `${sig[0].sig}|${[...learned].map(([id, lines]) => `${id}:${lines.size}`).sort().join(',')}`;
  const hit = cache.get(userId);
  if (hit?.sig === key) return hit.record;
  const [games, spar] = await Promise.all([getGames(userId), sparTraps(userId)]);
  const { matched } = buildReport(games, allOpenings(), studied, learned);
  const record = playFrom(matched, studied, spar);
  cache.delete(userId);
  if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value!);
  cache.set(userId, { sig: key, record });
  return record;
}

const books = new Map<string, SparBook>();

/**
 * Stores the traps a sparring game met, once its path checks out against the course and the club
 * moves the sparring partner draws from. A repeat of the same save stores nothing new.
 */
export async function recordSparTraps(userId: string, clientId: string, openingId: string, side: Colour, keys: string[], at: Date) {
  const club = getClub(openingId);
  if (!club || keys.length < 2) return;
  const id = `${openingId}|${side}`;
  let book = books.get(id);
  if (!book) books.set(id, (book = sparBook(getOpening(openingId), side, club)));
  if (!sparPathValid(book, keys)) return;
  const met = trapsInGame(baitsOf(allOpenings()), side, keys);
  if (!met.length) return;
  await query(
    `insert into spar_traps (user_id, client_id, trap_id, opening_id, side, outcome, punished, played_at)
     select $1, $2, unnest($3::text[]), $4, $5, unnest($6::text[]), unnest($7::boolean[]), $8
     on conflict do nothing`,
    [userId, clientId, met.map((m) => m.trapId), openingId, side, met.map((m) => m.outcome), met.map((m) => m.punished), at],
  );
}
