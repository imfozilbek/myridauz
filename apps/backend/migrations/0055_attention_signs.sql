-- «Diqqat» of the owner (G75, docs/120): the signs of the day with their data, one list for the card
-- of the admin bot and for the admin app. A sign of the same id the same day replaces its row; the
-- days past a week are forgotten when a new sign comes (by the primary key).
CREATE TABLE attention_signs (
  day TEXT NOT NULL,
  id TEXT NOT NULL,
  sign TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (day, id)
);
