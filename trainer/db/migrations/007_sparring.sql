-- Sparring: games against a club opponent (src/lib/spar.ts). Each finished game is a practice
-- session with mode 'spar'; a learner's deepest game per course and side is kept here.
alter table practice_sessions drop constraint if exists practice_sessions_mode_check;
alter table practice_sessions add constraint practice_sessions_mode_check check (mode in ('learn','drill','recall','quiz','free','review','spar','rush','games'));

create table spar_bests (
  user_id text not null references "user" ("id") on delete cascade,
  opening_id text not null,
  side text not null check (side in ('white', 'black')),
  -- The learner's own moves played in book before the game ended.
  depth integer not null,
  achieved_at timestamptz not null default now(),
  primary key (user_id, opening_id, side)
);
