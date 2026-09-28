-- G06: driver applications, the team, support (docs/04, docs/02, docs/50).
CREATE TABLE driver_applications (
  user_id INTEGER PRIMARY KEY REFERENCES users (id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'changes_requested')),
  car_make TEXT,
  car_model TEXT,
  car_color TEXT,
  car_year INTEGER,
  car_plate TEXT,
  seats INTEGER,
  photo_front TEXT,
  photo_side TEXT,
  photo_interior TEXT,
  reason TEXT,
  submitted_at INTEGER,
  decided_by INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE INDEX driver_applications_queue ON driver_applications (status, submitted_at);

-- Moderators. Owners are the Worker secret ADMIN_TELEGRAM_IDS; they add and remove moderators (docs/02).
CREATE TABLE team_members (
  user_id INTEGER PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('moderator')),
  added_by INTEGER NOT NULL,
  added_at INTEGER NOT NULL
);

-- A support message copied to a team member: a reply to that copy goes back to the person.
CREATE TABLE support_links (
  team_chat_id INTEGER NOT NULL,
  team_message_id INTEGER NOT NULL,
  person_chat_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (team_chat_id, team_message_id)
);
