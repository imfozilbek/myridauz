-- G87 V5: the life of each channel by day (docs/176): how many came and left, as the bot of the posts
-- heard them (chat_member), and how many people were in it when the hourly check last read it. Only
-- numbers, never who. The day first: the health of the channels reads the days of a week.
CREATE TABLE channel_days (
  day TEXT NOT NULL,
  chat TEXT NOT NULL,
  joined INTEGER NOT NULL DEFAULT 0,
  gone INTEGER NOT NULL DEFAULT 0,
  members INTEGER,
  PRIMARY KEY (day, chat)
) WITHOUT ROWID;
