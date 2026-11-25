-- Crowns are derived from review_cards (src/lib/crowns.ts). Stored here is only what the learner was
-- last shown, so each rise is celebrated once: per learned chapter ("<course>/<chapter>"), the level
-- last shown and the best ever shown, as `[level, best]`. A learner with no row yet is seeded with
-- what they hold, without a toast for every crown earned before this table existed.
create table crown_seen (
  user_id text primary key references "user" ("id") on delete cascade,
  levels jsonb not null,
  updated_at timestamptz not null default now()
);
