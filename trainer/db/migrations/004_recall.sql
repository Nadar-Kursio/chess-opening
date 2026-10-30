-- Recall: a card per position where the learner has a move to find, scheduled by FSRS
-- (src/lib/memory.ts). A card joins the deck when Learn teaches its line, or the first time a drill
-- or quiz asks it. `last_day` is the learner's calendar day of the last graded attempt: only the
-- first attempt of a day moves the schedule.
create table review_cards (
  user_id text not null references "user" ("id") on delete cascade,
  opening_id text not null,
  position_key text not null,
  state smallint not null default 0,
  due timestamptz not null default now(),
  stability double precision not null default 0,
  difficulty double precision not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  last_review timestamptz,
  last_day date,
  created_at timestamptz not null default now(),
  primary key (user_id, opening_id, position_key)
);
create index review_cards_user_due_idx on review_cards (user_id, due);

-- Every graded attempt, so the scheduler's parameters can later be fitted to how these learners
-- actually forget.
create table review_log (
  id bigserial primary key,
  user_id text not null references "user" ("id") on delete cascade,
  opening_id text not null,
  position_key text not null,
  rating smallint not null check (rating between 1 and 4),
  think_ms integer,
  state smallint not null,
  stability double precision not null,
  difficulty double precision not null,
  due timestamptz not null,
  reviewed_at timestamptz not null default now()
);
create index review_log_user_idx on review_log (user_id, reviewed_at);
