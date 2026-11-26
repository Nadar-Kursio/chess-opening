import 'server-only';
import { bringForward } from './cards';
import { getCatalog, getOpening } from './content';
import { query, transaction } from './db';
import { SITE_NAME, buildReport, deviationOf, forgot, matchGame, type ImportedGame, type Learned, type Site } from './games';
import { replay } from './gamePositions';
import { gameOrigins, type FromGame } from './gamePrep';
import { IMPORT_GAMES, fromChesscom, fromLichess, type ChesscomGame, type LichessGame } from './gameSources';
import { isCard } from './recall';
import type { Opening } from './types';

/* Importing the learner's games from Lichess and Chess.com, and reading them back as a report.
   Only the server talks to the sites. Each site gets one request at a time from this process,
   which is what Lichess asks of API clients. */

const USER_AGENT = 'ChessLab/1.0 (+https://chesslab.dev)';
/** A learner can import from each site this often. */
export const REIMPORT_MS = 10 * 60 * 1000;
const LOOKUP_TIMEOUT_MS = 15_000;
const GAMES_TIMEOUT_MS = 45_000;
/** Chess.com files games by month: how far back an import looks for its games. */
const CHESSCOM_MONTHS = 6;

export type ImportProblem = 'unknown' | 'closed' | 'empty' | 'busy' | 'unreachable' | 'wait';

export class ImportError extends Error {
  constructor(
    readonly problem: ImportProblem,
    message: string,
  ) {
    super(message);
  }
}

const queues: Record<Site, Promise<unknown>> = { lichess: Promise.resolve(), chesscom: Promise.resolve() };

function oneAtATime<T>(site: Site, work: () => Promise<T>): Promise<T> {
  const run = queues[site].then(work, work);
  queues[site] = run.catch(() => undefined);
  return run;
}

async function get(site: Site, url: string, accept: string, timeout: number) {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: accept },
      signal: AbortSignal.timeout(timeout),
      cache: 'no-store',
    });
  } catch {
    throw new ImportError('unreachable', `Couldn’t reach ${SITE_NAME[site]}. Check back in a minute.`);
  }
  if (res.status === 429) throw new ImportError('busy', `${SITE_NAME[site]} asked us to slow down. Try again in a minute or two.`);
  return res;
}

async function json<T>(site: Site, url: string, timeout = LOOKUP_TIMEOUT_MS): Promise<T | null> {
  const res = await get(site, url, 'application/json', timeout);
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) throw new ImportError('unreachable', `${SITE_NAME[site]} didn’t answer properly (${res.status}). Try again later.`);
  try {
    return (await res.json()) as T;
  } catch {
    throw new ImportError('unreachable', `${SITE_NAME[site]} sent something we couldn’t read. Try again later.`);
  }
}

const unknown = (site: Site, name: string) => new ImportError('unknown', `There’s no ${SITE_NAME[site]} account called ${name}.`);
const closed = (site: Site, name: string) =>
  new ImportError('closed', `The ${SITE_NAME[site]} account ${name} is closed, so its games can’t be read.`);

async function lichessGames(name: string) {
  const user = await json<{ username: string; disabled?: boolean; closed?: boolean }>('lichess', `https://lichess.org/api/user/${encodeURIComponent(name)}`);
  if (!user) throw unknown('lichess', name);
  if (user.disabled || user.closed) throw closed('lichess', user.username);
  const params = new URLSearchParams({
    max: String(IMPORT_GAMES),
    rated: 'true',
    perfType: 'ultraBullet,bullet,blitz,rapid,classical,correspondence',
    moves: 'true',
    opening: 'true',
  });
  const res = await get('lichess', `https://lichess.org/api/games/user/${encodeURIComponent(user.username)}?${params}`, 'application/x-ndjson', GAMES_TIMEOUT_MS);
  if (res.status === 404) throw unknown('lichess', name);
  if (!res.ok) throw new ImportError('unreachable', `Lichess didn’t answer properly (${res.status}). Try again later.`);
  let text: string;
  try {
    text = await res.text();
  } catch {
    throw new ImportError('unreachable', 'Lichess stopped sending games partway. Try again in a minute.');
  }
  const games: ImportedGame[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      const g = fromLichess(JSON.parse(line) as LichessGame, user.username);
      if (g) games.push(g);
    } catch {
      // One unreadable line shouldn't lose the other games.
    }
  }
  return { username: user.username, games };
}

async function chesscomGames(name: string) {
  const base = `https://api.chess.com/pub/player/${encodeURIComponent(name.toLowerCase())}`;
  const player = await json<{ username: string; url?: string; status?: string }>('chesscom', base);
  if (!player) throw unknown('chesscom', name);
  // The member URL keeps the capitals the player chose; `username` is lower case.
  const display = player.url?.split('/member/')[1] ?? player.username;
  if (player.status?.startsWith('closed')) throw closed('chesscom', display);
  const archives = (await json<{ archives: string[] }>('chesscom', `${base}/games/archives`))?.archives ?? [];
  const games: ImportedGame[] = [];
  for (const month of archives.slice(-CHESSCOM_MONTHS).reverse()) {
    if (!month.startsWith('https://api.chess.com/')) continue;
    const page = await json<{ games: ChesscomGame[] }>('chesscom', month, GAMES_TIMEOUT_MS);
    for (const g of page?.games ?? []) {
      const game = fromChesscom(g, player.username);
      if (game) games.push(game);
    }
    if (games.length >= IMPORT_GAMES) break;
  }
  games.sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());
  return { username: display, games: games.slice(0, IMPORT_GAMES) };
}

/* ---------- reading ---------- */

export interface Account {
  site: Site;
  username: string;
  imported_at: Date | null;
}

async function getAccounts(userId: string) {
  return query<Account>(`select site, username, imported_at from game_accounts where user_id = $1 order by site`, [userId]);
}

interface GameRow {
  site: Site;
  game_id: string;
  url: string;
  played_at: Date;
  colour: 'white' | 'black';
  result: 'win' | 'draw' | 'loss';
  opponent: string;
  opponent_rating: number | null;
  rating: number | null;
  speed: string;
  opening_name: string | null;
  moves: string;
}

const toGame = (r: GameRow): ImportedGame => {
  const moves = r.moves.split(' ').filter(Boolean);
  return {
    site: r.site,
    id: r.game_id,
    url: r.url,
    playedAt: r.played_at,
    colour: r.colour,
    result: r.result,
    opponent: r.opponent,
    opponentRating: r.opponent_rating,
    rating: r.rating,
    speed: r.speed,
    openingName: r.opening_name,
    moves,
    positions: replay(moves),
  };
};

const GAME_COLUMNS = `site, game_id, url, played_at, colour, result, opponent, opponent_rating, rating, speed, opening_name, moves`;

export async function getGames(userId: string) {
  const rows = await query<GameRow>(
    `select ${GAME_COLUMNS} from imported_games where user_id = $1 order by played_at desc`,
    [userId],
  );
  return rows.map(toGame);
}

export async function getGame(userId: string, site: Site, id: string) {
  const rows = await query<GameRow>(
    `select ${GAME_COLUMNS} from imported_games where user_id = $1 and site = $2 and game_id = $3`,
    [userId, site, id],
  );
  return rows[0] ? toGame(rows[0]) : null;
}

/** Every course in catalogue order: the main courses before the traps. */
export function allOpenings(): Opening[] {
  return getCatalog().openings.map((o) => getOpening(o.id));
}

/** The chapters and sidelines the learner has done Learn for, and the courses that makes theirs. */
export async function learnedLines(userId: string) {
  const rows = await query<{ opening_id: string; line_slug: string; learned_at: Date }>(
    `select opening_id, line_slug, learned_at from line_progress where user_id = $1 and learned_at is not null`,
    [userId],
  );
  const learned: Learned = new Map();
  for (const r of rows) {
    let m = learned.get(r.opening_id);
    if (!m) learned.set(r.opening_id, (m = new Map()));
    m.set(r.line_slug, r.learned_at);
  }
  return { learned, studied: new Set(learned.keys()) };
}

/** Where the learner's games left the courses they study, to label the Recall cards at those positions. */
export async function gameCards(userId: string) {
  const [games, { learned, studied }] = await Promise.all([getGames(userId), learnedLines(userId)]);
  if (!games.length) return new Map<string, FromGame>();
  const openings = allOpenings();
  const byId = new Map(openings.map((op) => [op.id, op]));
  return gameOrigins(
    games.map((game) => {
      const walk = matchGame(openings, studied, game.colour, game.moves, game.positions);
      const op = walk && studied.has(walk.openingId) ? byId.get(walk.openingId)! : null;
      return { game, walk, deviation: op ? deviationOf(op, walk!, learned.get(op.id)) : null, traps: [] };
    }),
  );
}

export async function loadReport(userId: string) {
  const [accounts, games, { learned, studied }] = await Promise.all([getAccounts(userId), getGames(userId), learnedLines(userId)]);
  return { accounts, studied, learned, ...buildReport(games, allOpenings(), studied, learned) };
}

/* ---------- writing ---------- */

interface Imported {
  username: string;
  /** Games read from the site this time. */
  fetched: number;
  /** Of those, games not already here. */
  added: number;
  /** Positions from new games that Recall will ask today. */
  recalled: number;
}

export async function importGames(userId: string, site: Site, name: string, now = new Date()): Promise<Imported> {
  const [account] = await query<Account>(`select site, username, imported_at from game_accounts where user_id = $1 and site = $2`, [userId, site]);
  const same = account?.username.toLowerCase() === name.toLowerCase();
  if (same && account.imported_at && now.getTime() - account.imported_at.getTime() < REIMPORT_MS) {
    const minutes = Math.ceil((REIMPORT_MS - (now.getTime() - account.imported_at.getTime())) / 60_000);
    throw new ImportError('wait', `You imported a moment ago. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
  }

  const { username, games } = await oneAtATime(site, () => (site === 'lichess' ? lichessGames(name) : chesscomGames(name)));
  if (!games.length) {
    throw new ImportError('empty', `${username} has no rated standard games on ${SITE_NAME[site]} yet. Play a few and import again.`);
  }

  const { learned, studied } = await learnedLines(userId);
  const openings = allOpenings();
  const byId = new Map(openings.map((op) => [op.id, op]));

  return transaction(async (client) => {
    if (account && !same) await client.query(`delete from imported_games where user_id = $1 and site = $2`, [userId, site]);
    await client.query(
      `insert into game_accounts (user_id, site, username, imported_at) values ($1, $2, $3, $4)
       on conflict (user_id, site) do update set username = excluded.username, imported_at = excluded.imported_at`,
      [userId, site, username, now],
    );
    const { rows } = await client.query<{ game_id: string }>(
      `insert into imported_games
         (user_id, site, game_id, url, played_at, colour, result, opponent, opponent_rating, rating, speed, opening_name, moves)
       select $1, $2, * from unnest($3::text[], $4::text[], $5::timestamptz[], $6::text[], $7::text[], $8::text[],
                                    $9::int[], $10::int[], $11::text[], $12::text[], $13::text[])
       on conflict (user_id, site, game_id) do nothing
       returning game_id`,
      [
        userId,
        site,
        games.map((g) => g.id),
        games.map((g) => g.url),
        games.map((g) => g.playedAt),
        games.map((g) => g.colour),
        games.map((g) => g.result),
        games.map((g) => g.opponent),
        games.map((g) => g.opponentRating),
        games.map((g) => g.rating),
        games.map((g) => g.speed),
        games.map((g) => g.openingName),
        games.map((g) => g.moves.join(' ')),
      ],
    );
    const added = new Set(rows.map((r) => r.game_id));

    // A move the learner had learned and then missed over the board is due in Recall today.
    const due = new Map<string, Set<string>>();
    for (const g of games) {
      if (!added.has(g.id)) continue;
      const walk = matchGame(openings, studied, g.colour, g.moves, replay(g.moves));
      if (!walk || !studied.has(walk.openingId)) continue;
      const op = byId.get(walk.openingId)!;
      const d = deviationOf(op, walk, learned.get(op.id));
      if (!d || !forgot(d, g.playedAt) || !isCard(op, d.key)) continue;
      let keys = due.get(op.id);
      if (!keys) due.set(op.id, (keys = new Set()));
      keys.add(d.key);
    }
    let recalled = 0;
    for (const [openingId, keys] of due) recalled += await bringForward(client, userId, openingId, [...keys], now);
    return { username, fetched: games.length, added: added.size, recalled };
  });
}

export async function unlink(userId: string, site: Site) {
  await transaction(async (client) => {
    await client.query(`delete from imported_games where user_id = $1 and site = $2`, [userId, site]);
    await client.query(`delete from game_accounts where user_id = $1 and site = $2`, [userId, site]);
  });
}
