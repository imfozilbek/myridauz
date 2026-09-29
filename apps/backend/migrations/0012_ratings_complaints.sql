-- Ratings (docs/24): the bot asks each side of a ride once and reminds once.
CREATE TABLE rating_asks (
  booking_id TEXT NOT NULL,
  rater_id INTEGER NOT NULL,
  ratee_id INTEGER NOT NULL,
  asked_at INTEGER NOT NULL,
  reminded INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (booking_id, rater_id)
);
CREATE INDEX rating_asks_remind ON rating_asks (reminded, asked_at);

-- One review of each side per ride; shown only when both sides reviewed or 14 days passed.
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  rater_id INTEGER NOT NULL,
  ratee_id INTEGER NOT NULL,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  tags TEXT NOT NULL DEFAULT '[]',
  text TEXT NOT NULL DEFAULT '',
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (booking_id, rater_id)
);
CREATE INDEX reviews_ratee ON reviews (ratee_id, created_at);
CREATE INDEX reviews_rater ON reviews (rater_id);

-- A person whose rating went low was sent to a moderator once (docs/24).
CREATE TABLE rating_flags (
  user_id INTEGER PRIMARY KEY,
  flagged_at INTEGER NOT NULL
);

-- Complaints (docs/17): one per author and ride; the one complained about never sees the author.
CREATE TABLE complaints (
  id TEXT PRIMARY KEY,
  author_id INTEGER NOT NULL,
  against_id INTEGER NOT NULL,
  booking_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('new', 'in_review', 'resolved')),
  decision TEXT,
  decided_by INTEGER,
  created_at INTEGER NOT NULL,
  decided_at INTEGER,
  UNIQUE (author_id, booking_id)
);
CREATE INDEX complaints_against ON complaints (against_id, created_at);
CREATE INDEX complaints_status ON complaints (status, created_at);

-- Every time a moderator reads the chat of a complaint (docs/07).
CREATE TABLE complaint_chat_reads (
  complaint_id TEXT NOT NULL,
  moderator_id INTEGER NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX complaint_chat_reads_complaint ON complaint_chat_reads (complaint_id);
