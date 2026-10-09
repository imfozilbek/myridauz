-- «Aziz koʻrmoqda» (G75, gap К of docs/158): a member opened a case of «Navbat»; the others see who
-- for a few minutes. One row a case, the last opening; rows older than a day go when a case is taken.
CREATE TABLE case_takes (
  kind TEXT NOT NULL,
  case_id TEXT NOT NULL,
  member_id INTEGER NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (kind, case_id)
);
-- The fresh takes are read by time.
CREATE INDEX case_takes_at ON case_takes (at);
