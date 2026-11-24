import type { Colour } from './types.ts';
import type { ImportedGame, Result, Site } from './games.ts';

/* What Lichess and Chess.com send, read into one shape. Pure, so tests can feed it captured
   responses; the fetching is in gameImport.ts. */

/** How many recent rated games an import reads. */
export const IMPORT_GAMES = 100;

/** A username, or a profile or game link the learner pasted instead. */
export function usernameFrom(input: string) {
  const text = input.trim();
  const fromUrl = text.match(/(?:lichess\.org\/@\/|chess\.com\/(?:member|stats\/[a-z]+\/[a-z]+)\/)([A-Za-z0-9_-]+)/i);
  const name = fromUrl ? fromUrl[1] : text.replace(/^@/, '');
  return /^[A-Za-z0-9][A-Za-z0-9_-]{1,29}$/.test(name) ? name : null;
}

const speedOf = (s: string) =>
  s === 'ultraBullet' ? 'bullet' : s === 'correspondence' ? 'daily' : s;

interface LichessPlayer {
  user?: { name: string; id: string };
  rating?: number;
}

export interface LichessGame {
  id: string;
  rated: boolean;
  variant: string;
  speed: string;
  createdAt: number;
  lastMoveAt?: number;
  status: string;
  players: { white: LichessPlayer; black: LichessPlayer };
  winner?: 'white' | 'black';
  opening?: { name: string };
  moves?: string;
  initialFen?: string;
}

/** Ends that aren't a played game, so there's nothing to learn from. */
const UNPLAYED = new Set(['created', 'started', 'aborted', 'noStart', 'unknownFinish', 'cheat']);

export function fromLichess(g: LichessGame, username: string): ImportedGame | null {
  if (!g.rated || g.variant !== 'standard' || g.initialFen || UNPLAYED.has(g.status) || !g.moves) return null;
  const me = username.toLowerCase();
  const colour: Colour | null =
    g.players.white.user?.id === me ? 'white' : g.players.black.user?.id === me ? 'black' : null;
  if (!colour) return null;
  const them = g.players[colour === 'white' ? 'black' : 'white'];
  const result: Result = !g.winner ? 'draw' : g.winner === colour ? 'win' : 'loss';
  return {
    site: 'lichess',
    id: g.id,
    url: `https://lichess.org/${g.id}${colour === 'black' ? '/black' : ''}`,
    playedAt: new Date(g.lastMoveAt ?? g.createdAt),
    colour,
    result,
    opponent: them.user?.name ?? 'Anonymous',
    opponentRating: them.rating ?? null,
    rating: g.players[colour].rating ?? null,
    speed: speedOf(g.speed),
    openingName: g.opening?.name ?? null,
    moves: g.moves.split(' ').filter(Boolean),
  };
}

interface ChesscomPlayer {
  username: string;
  rating?: number;
  result: string;
}

export interface ChesscomGame {
  url: string;
  uuid: string;
  pgn?: string;
  rated: boolean;
  rules: string;
  time_class: string;
  end_time: number;
  initial_setup?: string;
  white: ChesscomPlayer;
  black: ChesscomPlayer;
  eco?: string;
}

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const DRAWN = new Set(['agreed', 'repetition', 'stalemate', 'insufficient', '50move', 'timevsinsufficient']);

/** The moves of a PGN, without the headers, comments, variations, numbers or result. */
export function pgnMoves(pgn: string) {
  let text = pgn.replace(/^\s*\[.*\]\s*$/gm, '').replace(/\{[^}]*\}/g, ' ').replace(/;[^\n]*/g, ' ');
  // Variations nest, so strip the innermost until none are left.
  for (let prev = ''; prev !== text; ) {
    prev = text;
    text = text.replace(/\([^()]*\)/g, ' ');
  }
  return text
    .replace(/\$\d+/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^\d+\.+/, ''))
    .filter((t) => t && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t));
}

/** "https://www.chess.com/openings/Scandinavian-Defense-Closed-2...d4" → "Scandinavian Defense Closed". */
export function chesscomOpening(eco: string | undefined) {
  const slug = eco?.split('/openings/')[1];
  if (!slug) return null;
  const words: string[] = [];
  for (const w of slug.split('-')) {
    if (/^\d/.test(w)) break;
    words.push(w);
  }
  return words.join(' ') || null;
}

export function fromChesscom(g: ChesscomGame, username: string): ImportedGame | null {
  if (!g.rated || g.rules !== 'chess' || !g.pgn || (g.initial_setup && g.initial_setup !== START)) return null;
  const me = username.toLowerCase();
  const colour: Colour | null =
    g.white.username.toLowerCase() === me ? 'white' : g.black.username.toLowerCase() === me ? 'black' : null;
  if (!colour) return null;
  const moves = pgnMoves(g.pgn);
  if (!moves.length) return null;
  const mine = g[colour];
  const them = g[colour === 'white' ? 'black' : 'white'];
  const result: Result = mine.result === 'win' ? 'win' : DRAWN.has(mine.result) ? 'draw' : 'loss';
  return {
    site: 'chesscom',
    id: g.uuid,
    url: g.url,
    playedAt: new Date(g.end_time * 1000),
    colour,
    result,
    opponent: them.username,
    opponentRating: them.rating ?? null,
    rating: mine.rating ?? null,
    speed: speedOf(g.time_class),
    openingName: chesscomOpening(g.eco),
    moves,
  };
}

export const SITES: Site[] = ['lichess', 'chesscom'];
