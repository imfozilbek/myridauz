-- G63: the different people who opened a trip in the app (docs/119, the driver after the publishing):
-- from the search, the button of a channel post or a shared link. «N kishi koʻrdi» counts the rows
-- of a trip through the primary key (docs/117). The driver's own look is never a row. WITHOUT ROWID:
-- the key is the table, so a first view writes 2 rows of the free quota (the table and the index
-- below), not 3.
CREATE TABLE trip_views (
  trip_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  first_at TEXT NOT NULL,
  PRIMARY KEY (trip_id, user_id)
) WITHOUT ROWID;
-- A deleted account takes its rows with it (docs/30).
CREATE INDEX trip_views_user ON trip_views (user_id);
