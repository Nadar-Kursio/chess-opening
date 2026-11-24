-- XP and levels are derived from the progress tables (src/lib/xp.ts). Stored here is only what
-- can't be: when each badge tier and quest was first earned, so a reset course or a changed quest
-- list never takes one back, the Opening Rush scores, and the last level the learner was shown.
alter table practice_sessions drop constraint if exists practice_sessions_mode_check;
alter table practice_sessions add constraint practice_sessions_mode_check check (mode in ('learn','drill','recall','quiz','free','review','spar','rush','games'));

-- `announced_at` is set once a toast has said so, so each unlock is celebrated exactly once.
create table achievement_unlocks (
  user_id text not null references "user" ("id") on delete cascade,
  badge text not null,
  tier smallint not null,
  unlocked_at timestamptz not null default now(),
  announced_at timestamptz,
  primary key (user_id, badge, tier)
);

-- A daily quest cleared on the learner's calendar `day`; three on one day earn the bonus.
create table quest_clears (
  user_id text not null references "user" ("id") on delete cascade,
  day date not null,
  quest text not null,
  cleared_at timestamptz not null default now(),
  announced_at timestamptz,
  primary key (user_id, day, quest)
);

-- One Opening Rush run. `scope` is the course played, or 'all'. Its moves are also in
-- practice_sessions (mode 'rush', one row per course), which is what the streak and goal count.
create table rush_runs (
  id bigserial primary key,
  user_id text not null references "user" ("id") on delete cascade,
  client_id text not null,
  scope text not null,
  score integer not null,
  found integer not null,
  strikes smallint not null,
  best_combo integer not null,
  day date not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);
create index rush_runs_user_scope_idx on rush_runs (user_id, scope, score desc);

create table fun_state (
  user_id text primary key references "user" ("id") on delete cascade,
  level_seen integer not null,
  updated_at timestamptz not null default now()
);
