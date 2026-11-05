-- G94 (owner, 05.11.2026, docs/223): the post of a passenger's request in a direction group. The
-- post goes away when the request is matched, cancelled or over; then its row goes too.
CREATE TABLE request_posts (
  request_id TEXT NOT NULL,
  chat TEXT NOT NULL,
  message_id INTEGER NOT NULL,
  PRIMARY KEY (request_id, chat)
);
