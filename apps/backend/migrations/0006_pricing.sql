-- G07: the price engine (docs/23). Starting values: docs/16 (v4), changed later in the admin Mini App.
CREATE TABLE pricing_versions (
  version INTEGER PRIMARY KEY AUTOINCREMENT,
  rate_per_km INTEGER NOT NULL CHECK (rate_per_km > 0),
  round_step INTEGER NOT NULL CHECK (round_step > 0),
  min_price INTEGER NOT NULL CHECK (min_price >= 0),
  max_price INTEGER NOT NULL CHECK (max_price > min_price),
  changed_by INTEGER,
  changed_at INTEGER NOT NULL
);
INSERT INTO pricing_versions (rate_per_km, round_step, min_price, max_price, changed_by, changed_at)
VALUES (300, 5000, 30000, 600000, NULL, 0);

-- The team's price for a direction (region or place), both ways: it goes before the formula.
CREATE TABLE direction_prices (
  from_id TEXT NOT NULL REFERENCES locations (id),
  to_id TEXT NOT NULL REFERENCES locations (id),
  price INTEGER NOT NULL CHECK (price > 0),
  changed_by INTEGER NOT NULL,
  changed_at INTEGER NOT NULL,
  PRIMARY KEY (from_id, to_id),
  CHECK (from_id < to_id)
);
