-- «Cheklovlar» (G75, docs/128 §4): the limits of people the owner changed; the default is the brand
-- config. One row a limit; every change is a row of the history: who, when, before, after.
CREATE TABLE limit_values (
  key TEXT PRIMARY KEY,
  value REAL NOT NULL,
  changed_by INTEGER NOT NULL,
  changed_at INTEGER NOT NULL
);
CREATE TABLE limit_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  before REAL NOT NULL,
  after REAL NOT NULL,
  changed_by INTEGER NOT NULL,
  changed_at INTEGER NOT NULL
);
-- The history of the owner, the newest first.
CREATE INDEX limit_history_at ON limit_history (changed_at);
