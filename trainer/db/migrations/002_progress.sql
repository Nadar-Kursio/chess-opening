-- One row per chapter (a line of an opening) a learner has touched. Steps are timestamps rather
-- than booleans so the course page can say when, and a step is done once it has one.
create table line_progress (
  user_id text not null references "user" ("id") on delete cascade,
  opening_id text not null,
  line_slug text not null,
  learned_at timestamptz,
  drilled_at timestamptz,
  recalled_at timestamptz,
  quizzed_at timestamptz,
  quiz_best smallint,
  clean_runs integer not null default 0,
  runs integer not null default 0,
  last_practiced_at timestamptz not null default now(),
  primary key (user_id, opening_id, line_slug)
);

-- Every finished session, whatever the mode. Streaks and the daily goal are read from here; `day`
-- is the learner's own calendar day, so a streak doesn't break at UTC midnight.
create table practice_sessions (
  id bigserial primary key,
  user_id text not null references "user" ("id") on delete cascade,
  opening_id text not null,
  line_slug text,
  mode text not null check (mode in ('learn', 'drill', 'recall', 'quiz', 'free', 'review')),
  correct integer not null default 0,
  wrong integer not null default 0,
  hints integer not null default 0,
  day date not null,
  created_at timestamptz not null default now()
);
create index practice_sessions_user_day_idx on practice_sessions (user_id, day);

-- Positions the learner got wrong, keyed by board and side to move, so "review mistakes" can bring
-- back the weakest ones. Counts only: there is no review schedule.
create table position_misses (
  user_id text not null references "user" ("id") on delete cascade,
  opening_id text not null,
  position_key text not null,
  misses integer not null default 0,
  hits integer not null default 0,
  last_missed_at timestamptz,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, opening_id, position_key)
);

create table user_settings (
  user_id text primary key references "user" ("id") on delete cascade,
  daily_goal integer not null default 30 check (daily_goal between 5 and 500),
  sound boolean not null default true,
  coordinates boolean not null default true,
  updated_at timestamptz not null default now()
);
