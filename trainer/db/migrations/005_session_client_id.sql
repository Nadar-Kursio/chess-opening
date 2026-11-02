-- The browser names each session it saves, so a retry after a lost response can't count it twice.
-- Rows from before this have no name; Postgres treats nulls as distinct.
alter table practice_sessions add column client_id text;
create unique index practice_sessions_client_idx on practice_sessions (user_id, client_id);
