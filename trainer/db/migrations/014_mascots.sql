-- The companion each learner picked (src/lib/mascots.ts). Its look comes from the learner's level,
-- so only the choice is stored. A learner without a row hasn't picked one yet.
create table mascot_choices (
  user_id text primary key references "user" ("id") on delete cascade,
  mascot text not null,
  chosen_at timestamptz not null default now()
);
