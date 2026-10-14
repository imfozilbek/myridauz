-- The waitlist (G83, docs/181): one record a person and a role. home: the answer «Qaysi viloyatdansiz?»;
-- region: the other end of the route Toshkent shahri ↔ region. pains: the keys, comma separated.
-- via: the first touch of the person (docs/116). notified_at: the bot told about the opening.
-- card_at: the live card in the bot last shown, refreshed every Monday.
CREATE TABLE waitlist (
  telegram_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  home_region TEXT NOT NULL,
  region TEXT NOT NULL,
  cadence TEXT NOT NULL,
  pains TEXT NOT NULL,
  via TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  notified_at INTEGER,
  card_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (telegram_id, role)
) WITHOUT ROWID;
CREATE INDEX waitlist_region ON waitlist (region, role);
CREATE INDEX waitlist_via ON waitlist (via);
CREATE INDEX waitlist_created ON waitlist (created_at);
CREATE INDEX waitlist_card ON waitlist (card_at);

-- The first touch of a person with the main bot and its app (docs/183, docs/184): the mark of the
-- source, the platform (android, ios, desktop, other), the own code of the friend link, the moments
-- of Start, of the app and of the first invite.
CREATE TABLE waitlist_visits (
  telegram_id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  via TEXT,
  platform TEXT,
  started_at INTEGER,
  opened_at INTEGER,
  invited_at INTEGER
);
CREATE INDEX waitlist_visits_via ON waitlist_visits (via);
CREATE INDEX waitlist_visits_opened ON waitlist_visits (opened_at);

-- An opened direction (docs/181): who opened it, when, how many people the bot told.
CREATE TABLE waitlist_openings (
  region TEXT PRIMARY KEY,
  opened_by INTEGER NOT NULL,
  opened_at INTEGER NOT NULL,
  sent INTEGER NOT NULL
);

-- The links of the ads (docs/184): into the main bot, or into a channel by its own invite link.
CREATE TABLE ad_links (
  code TEXT PRIMARY KEY,
  target TEXT NOT NULL,
  channel TEXT,
  invite_link TEXT UNIQUE,
  place TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER,
  days INTEGER,
  top_hours INTEGER NOT NULL,
  pin_hours INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX ad_links_created ON ad_links (created_at);

-- Who joined a channel by the invite link of an ad, and when they left (chat_member, docs/184).
-- chat: the number of the channel, the leave comes by it.
CREATE TABLE ad_joins (
  code TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  chat TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  left_at INTEGER,
  PRIMARY KEY (code, user_id)
) WITHOUT ROWID;
CREATE INDEX ad_joins_user ON ad_joins (user_id, chat);

-- The switches of the owner (docs/181): «Roʻyxatga yozish» is on until the owner turns it off.
-- Each change is a row of the journal too.
CREATE TABLE switches (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL,
  changed_by INTEGER NOT NULL,
  changed_at INTEGER NOT NULL
);
