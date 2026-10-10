-- G76: the different drivers who saw a request on «Yoʻlovchilar soʻrovlari» (mockup g76/2 state 4,
-- «14 haydovchi koʻrdi»), as trip_views counts the people of a trip (0049). One row per driver and
-- request: a second look writes nothing (docs/117). WITHOUT ROWID: the key is the table.
CREATE TABLE request_views (
  request_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  first_at TEXT NOT NULL,
  PRIMARY KEY (request_id, user_id)
) WITHOUT ROWID;
-- A deleted account takes its rows with it (docs/30).
CREATE INDEX request_views_user ON request_views (user_id);
