-- Traps met in sparring games. An imported game keeps its moves, so its traps are found again on
-- every read; a sparring game keeps nothing but its session row, so what it met is stored here.
-- `client_id` is the save's own id: the outbox can post a game twice and it is stored once.
create table spar_traps (
  user_id text not null references "user" ("id") on delete cascade,
  client_id text not null,
  trap_id text not null,
  opening_id text not null,
  side text not null check (side in ('white', 'black')),
  outcome text not null check (outcome in ('sprung', 'caught', 'dodged')),
  punished boolean,
  played_at timestamptz not null,
  primary key (user_id, client_id, trap_id)
);
create index spar_traps_user_idx on spar_traps (user_id, played_at desc);
