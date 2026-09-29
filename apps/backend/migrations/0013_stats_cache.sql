-- G12: saved answers of Analytics Engine (10 000 queries a day) and sent signals (docs/29).
CREATE TABLE stats_cache (
  key TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  until INTEGER NOT NULL
);
