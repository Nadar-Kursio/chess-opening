-- Games vs prep: the learner's Lichess and Chess.com usernames and the games imported from them.
-- `imported_at` is the last successful import, which is what re-imports are rate-limited by.
create table game_accounts (
  user_id text not null references "user" ("id") on delete cascade,
  site text not null check (site in ('lichess', 'chesscom')),
  username text not null,
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, site)
);

-- One row per game, deduped by site and the site's own game id. Only the moves are kept: which
-- course a game follows and where it leaves it is worked out from them on every read, so a course
-- that grows reclassifies old games without a re-import.
create table imported_games (
  user_id text not null references "user" ("id") on delete cascade,
  site text not null check (site in ('lichess', 'chesscom')),
  game_id text not null,
  url text not null,
  played_at timestamptz not null,
  colour text not null check (colour in ('white', 'black')),
  result text not null check (result in ('win', 'draw', 'loss')),
  opponent text not null,
  opponent_rating integer,
  rating integer,
  speed text not null,
  opening_name text,
  moves text not null,
  imported_at timestamptz not null default now(),
  primary key (user_id, site, game_id)
);
create index imported_games_user_played_idx on imported_games (user_id, played_at desc);
