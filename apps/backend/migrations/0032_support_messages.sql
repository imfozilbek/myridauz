-- G32: what a person and the team wrote in support, so the next team member sees it (docs/50).
-- Kept 90 days (the Cron erases older ones) and erased with the account (docs/30).
CREATE TABLE support_messages (
  person_id INTEGER NOT NULL,
  at INTEGER NOT NULL,
  author TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  text TEXT NOT NULL
);
CREATE INDEX support_messages_person ON support_messages (person_id, at);
CREATE INDEX support_messages_at ON support_messages (at);
