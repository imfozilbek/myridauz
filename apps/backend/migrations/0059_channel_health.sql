-- G75: the health of each channel for «Kanallar» of the owner (docs/120): the people in it and
-- whether the passenger bot may post there, as the hourly Cron last read them from Telegram.
CREATE TABLE channel_health (
  channel TEXT PRIMARY KEY,
  subscribers INTEGER,
  can_post INTEGER,
  checked_at INTEGER NOT NULL
);
